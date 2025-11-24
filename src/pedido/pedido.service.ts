import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { ActualizarEstadoPedidoDto } from './dto/actualizar-estado-pedido.dto';
import { ActualizarTrackingPedidoDto } from './dto/actualizar-tracking-pedido.dto';

@Injectable()
export class PedidoService {
  private readonly logger = new Logger(PedidoService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Crear un pedido desde items directos (CHECKOUT)
   * - Valida stock de variaciones
   * - Valida y aplica cupón (opcional)
   * - Descuenta stock
   * - Crea pedido, items y pago simulado
   */
  async checkout(usuarioId: number, data: CrearPedidoDto) {
    // 1. Validar que hay items
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('No hay items en el pedido');
    }

    // 2. Validar stock de cada variación y obtener datos de productos
    const itemsConDatos: Array<{
      productoId: number;
      variacionId: number;
      cantidad: number;
      precioUnitario: number;
      producto: any;
      variacion: any;
    }> = [];
    
    for (const item of data.items) {
      // Validar que el item tiene variación (requerido por el schema)
      if (!item.variacionId) {
        throw new BadRequestException('Todos los productos deben tener una variación seleccionada');
      }

      const producto = await this.prisma.producto.findUnique({
        where: { id: item.productoId },
      });

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${item.productoId} no encontrado`);
      }

      const variacion = await this.prisma.variacion_producto.findUnique({
        where: { id: item.variacionId },
      });

      if (!variacion) {
        throw new NotFoundException(
          `Variación con ID ${item.variacionId} no encontrada`,
        );
      }

      const stockDisponible = variacion.stock || 0;
      if (stockDisponible < item.cantidad) {
        throw new ConflictException(
          `Stock insuficiente para ${producto.nombre} - ${variacion.talla} ${variacion.color}. ` +
            `Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}`,
        );
      }

      itemsConDatos.push({ 
        productoId: item.productoId,
        variacionId: item.variacionId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        producto, 
        variacion 
      });
    }

    // 3. Calcular subtotal
    const subtotal = data.items.reduce(
      (sum, item) => sum + Number(item.precioUnitario) * item.cantidad,
      0,
    );

    // 4. Validar y aplicar cupón si se proporciona
    let cupon: any = null;
    let descuento = 0;
    if (data.cupon_codigo) {
      cupon = await this.prisma.cupon.findFirst({
        where: {
          codigo: data.cupon_codigo.toUpperCase(),
          activo: true,
        },
      });

      if (!cupon) {
        throw new BadRequestException('Cupón no válido');
      }

      // Validar fechas de vigencia
      const ahora = new Date();
      if (cupon.fecha_inicio && ahora < cupon.fecha_inicio) {
        throw new BadRequestException('El cupón aún no está vigente');
      }
      if (cupon.fecha_fin && ahora > cupon.fecha_fin) {
        throw new BadRequestException('El cupón ha expirado');
      }

      // Validar monto mínimo
      if (cupon.monto_minimo && subtotal < Number(cupon.monto_minimo)) {
        throw new BadRequestException(
          `El cupón requiere un monto mínimo de $${cupon.monto_minimo}`,
        );
      }

      // Validar usos máximos
      if (
        cupon.usos_maximos &&
        cupon.usos_actuales >= cupon.usos_maximos
      ) {
        throw new BadRequestException('El cupón ha alcanzado su límite de usos');
      }

      // Calcular descuento
      if (cupon.tipo_descuento === 'porcentaje') {
        descuento = subtotal * (Number(cupon.valor_descuento) / 100);
        // Aplicar descuento máximo si existe
        if (cupon.descuento_maximo && descuento > Number(cupon.descuento_maximo)) {
          descuento = Number(cupon.descuento_maximo);
        }
      } else {
        // tipo_descuento === 'monto'
        descuento = Number(cupon.valor_descuento);
      }

      // Asegurar que el descuento no exceda el subtotal
      descuento = Math.min(descuento, subtotal);
    }

    // Calcular costo de envío (Trujillo = 7, otros = 20, vacío = 0)
    const costoEnvio = data.costo_envio || 0;
    const total = subtotal - descuento + costoEnvio;

    // 5. Crear pedido, items y pago en una transacción SEGURA
    const resultado = await this.prisma.$transaction(async (prisma) => {
      // Crear el pedido
      const pedido = await prisma.pedido.create({
        data: {
          usuario_id: usuarioId,
          total,
          estado: 'pendiente',
          nombre_receptor: data.nombre_receptor,
          direccion_envio: data.direccion_envio,
          ciudad: data.ciudad,
          region: data.region,
          pais: data.pais,
          telefono_contacto: data.telefono_contacto,
          cupon_id: cupon?.id,
          metodo_pago: data.metodo_pago,
          voucher_url: data.voucher_url,
          notas: data.notas,
        },
      });

      // Crear items del pedido y descontar stock ATÓMICAMENTE
      for (const itemData of itemsConDatos) {
        // Crear item_pedido
        await prisma.item_pedido.create({
          data: {
            pedido_id: pedido.id,
            producto_id: itemData.productoId,
            variacion_id: itemData.variacionId,
            cantidad: itemData.cantidad,
            precio_unitario: itemData.precioUnitario,
          },
        });

        // CRÍTICO: Descontar stock de forma atómica con verificación de stock >= cantidad
        // Esto previene race conditions y stock negativo
        const resultado = await prisma.$executeRaw`
          UPDATE variacion_producto
          SET stock = stock - ${itemData.cantidad}
          WHERE id = ${itemData.variacionId}
          AND stock >= ${itemData.cantidad}
        `;

        // Si no se actualizó ninguna fila, significa que no hay stock suficiente
        if (resultado === 0) {
          throw new ConflictException(
            `Stock insuficiente para ${itemData.producto?.nombre} - ${itemData.variacion?.talla} ${itemData.variacion?.color}. ` +
              `Otro usuario puede haber comprado el último stock disponible.`,
          );
        }
      }

      // Incrementar usos del cupón si se usó
      if (cupon) {
        await prisma.cupon.update({
          where: { id: cupon.id },
          data: { usos_actuales: { increment: 1 } },
        });
      }

      // Crear pago simulado
      const pago = await prisma.pago_simulado.create({
        data: {
          pedido_id: pedido.id,
          metodo: 'simulado',
          estado_pago: 'pendiente',
        },
      });

      return { pedido, pago };
    });

    // 6. Obtener pedido completo con relaciones para la respuesta
    const pedidoCompleto = await this.obtenerPedidoCompleto(resultado.pedido.id);

    // 7. Enviar notificación por email (no bloquea la respuesta)
    try {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { nombre: true, apellido: true, email: true },
      });

      await this.emailService.enviarNotificacionNuevoPedido({
        pedidoId: resultado.pedido.id,
        clienteNombre: `${usuario?.nombre || data.nombre_receptor} ${usuario?.apellido || ''}`.trim(),
        clienteEmail: usuario?.email || '',
        total: Number(resultado.pedido.total),
        items: pedidoCompleto.items,
        direccion: data.direccion_envio,
        telefono: data.telefono_contacto,
        metodoPago: data.metodo_pago || 'No especificado',
        voucherUrl: data.voucher_url,
        notas: data.notas,
      });
    } catch (emailError) {
      this.logger.error('Error al enviar email de notificación:', emailError);
      // No afecta la respuesta del pedido
    }

    return pedidoCompleto;
  }

  /**
   * Listar todos los pedidos de un usuario
   */
  async listarPorUsuario(usuarioId: number) {
    const pedidos = await this.prisma.pedido.findMany({
      where: { usuario_id: usuarioId },
      include: {
        item_pedido: {
          include: {
            producto: true,
            variacion: true,
          },
        },
        pago_simulado: true,
      },
      orderBy: { creado_en: 'desc' },
    });

    return pedidos.map((pedido) => this.transformarPedido(pedido));
  }

  /**
   * Obtener un pedido por ID
   */
  async obtenerPorId(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        item_pedido: {
          include: {
            producto: true,
            variacion: true,
          },
        },
        pago_simulado: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return this.transformarPedido(pedido);
  }

  /**
   * Actualizar estado del pedido (solo admin)
   * - Envía email de confirmación si el estado cambia a "confirmado"
   */
  async actualizarEstado(id: number, data: ActualizarEstadoPedidoDto) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        item_pedido: {
          include: {
            producto: true,
            variacion: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const estadoAnterior = pedido.estado;

    await this.prisma.pedido.update({
      where: { id },
      data: { estado: data.estado },
    });

    // Enviar email de confirmación si el pedido cambia a confirmado
    if (data.estado === 'confirmado' && estadoAnterior !== 'confirmado') {
      try {
        const items = pedido.item_pedido.map((item: any) => ({
          producto: { nombre: item.producto?.nombre },
          talla: item.variacion?.talla,
          color: item.variacion?.color,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
        }));

        await this.emailService.enviarConfirmacionPedidoCliente({
          pedidoId: pedido.id,
          clienteNombre: `${pedido.usuario?.nombre || ''} ${pedido.usuario?.apellido || ''}`.trim(),
          clienteEmail: pedido.usuario?.email || '',
          total: Number(pedido.total),
          items,
          direccion: pedido.direccion_envio || '',
        });
      } catch (emailError) {
        this.logger.error('Error al enviar email de confirmación:', emailError);
      }
    }

    return this.obtenerPorId(id);
  }

  /**
   * Actualizar tracking del pedido (solo admin)
   * - Envía email de notificación de envío con tracking
   */
  async actualizarTracking(id: number, data: ActualizarTrackingPedidoDto) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    await this.prisma.pedido.update({
      where: { id },
      data: {
        codigo_tracking: data.codigo_tracking,
        agencia_envio: data.agencia_envio,
        tiempo_estimado_entrega: data.tiempo_estimado_entrega,
        estado: 'enviado', // Cambiar automáticamente a enviado al agregar tracking
      },
    });

    // Enviar email de notificación de envío
    try {
      await this.emailService.enviarNotificacionEnvioCliente({
        pedidoId: pedido.id,
        clienteNombre: `${pedido.usuario?.nombre || ''} ${pedido.usuario?.apellido || ''}`.trim(),
        clienteEmail: pedido.usuario?.email || '',
        tracking: data.codigo_tracking || 'No disponible',
        agenciaEnvio: data.agencia_envio,
      });
    } catch (emailError) {
      this.logger.error('Error al enviar email de tracking:', emailError);
    }

    return this.obtenerPorId(id);
  }

  /**
   * Cancelar un pedido (solo si está en estado "pendiente" o "confirmado")
   * - Restaura el stock de las variaciones
   * - No permite cancelación si el pedido ya fue pagado/enviado/entregado
   */
  async cancelarPedido(id: number, usuarioId: number) {
    // Obtener pedido con items
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        item_pedido: {
          include: {
            variacion: true,
            producto: true,
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar que el pedido pertenece al usuario
    if (pedido.usuario_id !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para cancelar este pedido');
    }

    // Validar que el pedido puede ser cancelado
    if (pedido.estado !== 'pendiente' && pedido.estado !== 'confirmado') {
      throw new BadRequestException(
        `No se puede cancelar un pedido en estado "${pedido.estado}". ` +
        'Solo se pueden cancelar pedidos en estado "pendiente" o "confirmado".',
      );
    }

    // Cancelar pedido y restaurar stock en transacción atómica
    await this.prisma.$transaction(async (prisma) => {
      // Actualizar estado del pedido
      await prisma.pedido.update({
        where: { id },
        data: { estado: 'cancelado' },
      });

      // Restaurar stock de cada variación ATÓMICAMENTE
      for (const item of pedido.item_pedido) {
        await prisma.$executeRaw`
          UPDATE variacion_producto
          SET stock = stock + ${item.cantidad}
          WHERE id = ${item.variacion_id}
        `;
      }
    });

    return {
      mensaje: 'Pedido cancelado exitosamente',
      pedido_id: pedido.id,
      estado: 'cancelado',
    };
  }

  /**
   * Obtener pedido completo con todas las relaciones
   */
  private async obtenerPedidoCompleto(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        item_pedido: {
          include: {
            producto: true,
            variacion: true,
          },
        },
        pago_simulado: true,
      },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return this.transformarPedido(pedido);
  }

  /**
   * Transformar pedido a formato JSON profesional
   */
  private transformarPedido(pedido: any) {
    const items = pedido.item_pedido.map((item: any) => ({
      id: item.id,
      producto_id: item.producto_id,
      nombre: item.producto?.nombre,
      precio_unitario: Number(item.precio_unitario),
      cantidad: item.cantidad,
      producto: {
        id: item.producto?.id,
        nombre: item.producto?.nombre,
        imagenes: item.producto?.imagenes || [],
        precio: Number(item.producto?.precio || 0),
      },
      variacion: {
        id: item.variacion?.id,
        talla: item.variacion?.talla,
        color: item.variacion?.color,
        sku: item.variacion?.sku,
      },
      color: item.variacion?.color,
      talla: item.variacion?.talla,
      subtotal: Number(item.precio_unitario) * item.cantidad,
    }));

    const pago = pedido.pago_simulado?.[0]
      ? {
          id: pedido.pago_simulado[0].id,
          metodo: pedido.pago_simulado[0].metodo,
          estado_pago: pedido.pago_simulado[0].estado_pago,
          referencia: pedido.pago_simulado[0].referencia,
        }
      : null;

    return {
      id: pedido.id,
      pedido_id: pedido.id,
      usuario_id: pedido.usuario_id,
      total: Number(pedido.total),
      estado: pedido.estado,
      numero_seguimiento: pedido.codigo_tracking,
      tracking: pedido.codigo_tracking,
      agencia_envio: pedido.agencia_envio,
      tiempo_estimado_entrega: pedido.tiempo_estimado_entrega,
      nombre_receptor: pedido.nombre_receptor,
      direccionEnvio: pedido.direccion_envio,
      direccion_envio: pedido.direccion_envio,
      ciudad: pedido.ciudad,
      region: pedido.region,
      pais: pedido.pais,
      telefono: pedido.telefono_contacto,
      telefono_contacto: pedido.telefono_contacto,
      metodoPago: pedido.metodo_pago,
      metodo_pago: pedido.metodo_pago,
      voucher_url: pedido.voucher_url,
      notas: pedido.notas,
      createdAt: pedido.creado_en,
      creado_en: pedido.creado_en,
      usuario: pedido.usuario ? {
        id: pedido.usuario.id,
        nombre: pedido.usuario.nombre,
        apellido: pedido.usuario.apellido,
        email: pedido.usuario.email,
      } : null,
      items,
      pago,
    };
  }

  /**
   * Obtener pedidos de un cliente por email (acceso público)
   * - Permite a los clientes ver sus pedidos sin autenticación
   * - Requiere email del cliente
   */
  async obtenerPedidosPorEmail(email: string) {
    // Buscar usuario por email
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new NotFoundException('No se encontraron pedidos para este email');
    }

    // Obtener todos los pedidos del usuario
    const pedidos = await this.prisma.pedido.findMany({
      where: { usuario_id: usuario.id },
      include: {
        item_pedido: {
          include: {
            producto: true,
            variacion: true,
          },
        },
        pago: true,
      },
      orderBy: {
        creado_en: 'desc',
      },
    });

    return pedidos.map((pedido) => ({
      id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      total: Number(pedido.total),
      estado: pedido.estado,
      tracking: pedido.codigo_tracking,
      agencia_envio: pedido.agencia_envio,
      tiempo_estimado_entrega: pedido.tiempo_estimado_entrega,
      nombre_receptor: pedido.nombre_receptor,
      direccion_envio: pedido.direccion_envio,
      ciudad: pedido.ciudad,
      region: pedido.region,
      pais: pedido.pais,
      telefono_contacto: pedido.telefono_contacto,
      creado_en: pedido.creado_en,
      items: pedido.item_pedido.map((item) => ({
        producto_nombre: item.producto.nombre,
        variacion: item.variacion
          ? `${item.variacion.talla} - ${item.variacion.color}`
          : 'Sin variación',
        cantidad: item.cantidad,
        precio_unitario: Number(item.precio_unitario),
        subtotal: Number(item.subtotal),
      })),
      pago: pedido.pago
        ? {
            metodo: pedido.pago.metodo_pago,
            estado: pedido.pago.estado,
            fecha: pedido.pago.fecha_pago,
          }
        : null,
    }));
  }
}
