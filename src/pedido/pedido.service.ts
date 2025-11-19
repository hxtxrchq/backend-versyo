import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { ActualizarEstadoPedidoDto } from './dto/actualizar-estado-pedido.dto';
import { ActualizarTrackingPedidoDto } from './dto/actualizar-tracking-pedido.dto';

@Injectable()
export class PedidoService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Crear un pedido desde el carrito del usuario (CHECKOUT)
   * - Valida stock de variaciones
   * - Valida y aplica cupón (opcional)
   * - Descuenta stock
   * - Crea pedido, items y pago simulado
   * - Limpia el carrito
   */
  async checkout(usuarioId: number, data: CrearPedidoDto) {
    // 1. Obtener carrito activo del usuario con items
    const carrito = await this.prisma.carrito.findFirst({
      where: {
        usuario_id: usuarioId,
        estado: 'activo',
      },
      include: {
        item_carrito: {
          include: {
            producto: true,
            variacion: true,
          },
        },
      },
    });

    if (!carrito) {
      throw new NotFoundException('No se encontró un carrito activo');
    }

    if (!carrito.item_carrito || carrito.item_carrito.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // 2. Validar stock de cada variación
    for (const item of carrito.item_carrito) {
      if (!item.variacion) {
        throw new NotFoundException(
          `Variación con ID ${item.variacion_id} no encontrada`,
        );
      }

      const stockDisponible = item.variacion.stock || 0;
      if (stockDisponible < item.cantidad) {
        throw new ConflictException(
          `Stock insuficiente para ${item.producto?.nombre} - ${item.variacion.talla} ${item.variacion.color}. ` +
            `Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}`,
        );
      }
    }

    // 3. Calcular subtotal
    const subtotal = carrito.item_carrito.reduce(
      (sum, item) => sum + Number(item.precio_unitario) * item.cantidad,
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

    const total = subtotal - descuento;

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
        },
      });

      // Crear items del pedido y descontar stock ATÓMICAMENTE
      for (const item of carrito.item_carrito) {
        // Crear item_pedido
        await prisma.item_pedido.create({
          data: {
            pedido_id: pedido.id,
            producto_id: item.producto_id,
            variacion_id: item.variacion_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
          },
        });

        // CRÍTICO: Descontar stock de forma atómica con verificación de stock >= cantidad
        // Esto previene race conditions y stock negativo
        const resultado = await prisma.$executeRaw`
          UPDATE variacion_producto
          SET stock = stock - ${item.cantidad}
          WHERE id = ${item.variacion_id}
          AND stock >= ${item.cantidad}
        `;

        // Si no se actualizó ninguna fila, significa que no hay stock suficiente
        if (resultado === 0) {
          throw new ConflictException(
            `Stock insuficiente para ${item.producto?.nombre} - ${item.variacion?.talla} ${item.variacion?.color}. ` +
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

      // Limpiar items del carrito
      await prisma.item_carrito.deleteMany({
        where: { carrito_id: carrito.id },
      });

      return { pedido, pago };
    });

    // 6. Obtener pedido completo con relaciones para la respuesta
    return this.obtenerPedidoCompleto(resultado.pedido.id);
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
            nombre: true,
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
      data: { estado: data.estado },
    });

    // Enviar email de confirmación si el pedido es confirmado
    if (data.estado === 'confirmado') {
      await this.emailService.enviarConfirmacionPedido(
        pedido.usuario.email,
        pedido.usuario.nombre,
        pedido.id.toString(),
      );
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
    await this.emailService.enviarNotificacionEnvio(
      pedido.usuario.email,
      pedido.usuario.nombre,
      pedido.id.toString(),
      data.agencia_envio || 'No especificada',
      data.codigo_tracking || 'No disponible',
    );

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
      producto_id: item.producto_id,
      nombre: item.producto?.nombre,
      precio_unitario: Number(item.precio_unitario),
      cantidad: item.cantidad,
      variacion: {
        id: item.variacion?.id,
        talla: item.variacion?.talla,
        color: item.variacion?.color,
        sku: item.variacion?.sku,
      },
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
      pedido_id: pedido.id,
      usuario_id: pedido.usuario_id,
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
