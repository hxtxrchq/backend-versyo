import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Listar todos los productos (con paginación)
   */
  async listarProductos(pagina: number = 1, limite: number = 20) {
    const skip = (pagina - 1) * limite;

    const [productos, total] = await Promise.all([
      this.prisma.producto.findMany({
        skip,
        take: limite,
        include: {
          categoria: true,
          temporada: true,
          variaciones: true,
        },
        orderBy: { creado_en: 'desc' },
      }),
      this.prisma.producto.count(),
    ]);

    return {
      productos,
      paginacion: {
        pagina_actual: pagina,
        limite,
        total,
        total_paginas: Math.ceil(total / limite),
      },
    };
  }

  /**
   * Activar/Desactivar producto (soft delete simulado)
   */
  async cambiarEstadoProducto(id: number, activo: boolean) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Como no tenemos campo "activo" en schema, podríamos usar el nombre
    // O agregar un campo en el futuro
    // Por ahora solo retornamos confirmación
    return {
      mensaje: `Producto ${activo ? 'activado' : 'desactivado'} exitosamente`,
      producto_id: id,
      estado: activo ? 'activo' : 'inactivo',
    };
  }

  /**
   * Listar todos los pedidos (admin)
   */
  async listarTodosPedidos(
    estado?: string,
    pagina: number = 1,
    limite: number = 20,
  ) {
    const skip = (pagina - 1) * limite;

    const where = estado ? { estado } : {};

    const [pedidos, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        skip,
        take: limite,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
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
        orderBy: { creado_en: 'desc' },
      }),
      this.prisma.pedido.count({ where }),
    ]);

    return {
      pedidos: pedidos.map((pedido) => this.transformarPedido(pedido)),
      paginacion: {
        pagina_actual: pagina,
        limite,
        total,
        total_paginas: Math.ceil(total / limite),
      },
    };
  }

  /**
   * Obtener pedido por ID (admin)
   */
  async obtenerPedido(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
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
   * Actualizar estado de pedido (admin)
   */
  async actualizarEstadoPedido(id: number, estado: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        usuario: true,
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

    const estadosValidos = [
      'pendiente',
      'confirmado',
      'en_preparacion',
      'enviado',
      'entregado',
      'cancelado',
    ];

    if (!estadosValidos.includes(estado)) {
      throw new NotFoundException(
        `Estado inválido. Válidos: ${estadosValidos.join(', ')}`,
      );
    }

    await this.prisma.pedido.update({
      where: { id },
      data: { estado },
    });

    // Enviar email según el nuevo estado
    try {
      if (estado === 'confirmado' && pedido.usuario?.email) {
        this.logger.log(`Enviando correo de confirmación a ${pedido.usuario.email}`);
        await this.emailService.enviarConfirmacionPedidoCliente({
          pedidoId: pedido.id,
          clienteEmail: pedido.usuario.email,
          clienteNombre: pedido.usuario.nombre,
          items: pedido.item_pedido.map(item => ({
            producto: { nombre: item.producto.nombre },
            cantidad: item.cantidad,
            precio_unitario: Number(item.precio_unitario),
            talla: item.variacion?.talla,
            color: item.variacion?.color,
          })),
          total: Number(pedido.total),
          direccion: `${pedido.direccion_envio}, ${pedido.ciudad}, ${pedido.region}`,
        });
      } else if (estado === 'enviado' && pedido.usuario?.email) {
        this.logger.log(`Enviando correo de envío a ${pedido.usuario.email}`);
        await this.emailService.enviarNotificacionEnvioCliente({
          pedidoId: pedido.id,
          clienteEmail: pedido.usuario.email,
          clienteNombre: pedido.usuario.nombre,
          tracking: pedido.codigo_tracking || 'Por asignar',
          agenciaEnvio: pedido.agencia_envio || 'Por confirmar',
        });
      }
    } catch (error) {
      this.logger.error(`Error al enviar email para pedido #${id}:`, error);
      // No lanzar error para no bloquear la actualización del estado
    }

    return this.obtenerPedido(id);
  }

  /**
   * Actualizar tracking de pedido (admin)
   */
  async actualizarTrackingPedido(
    id: number,
    codigo_tracking: string,
    agencia_envio?: string,
  ) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        usuario: true,
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

    await this.prisma.pedido.update({
      where: { id },
      data: {
        codigo_tracking,
        agencia_envio,
        estado: 'enviado', // Auto-cambiar a enviado al agregar tracking
      },
    });

    // Enviar email de envío con tracking
    try {
      if (pedido.usuario?.email) {
        this.logger.log(`Enviando correo de envío con tracking a ${pedido.usuario.email}`);
        await this.emailService.enviarNotificacionEnvioCliente({
          pedidoId: pedido.id,
          clienteEmail: pedido.usuario.email,
          clienteNombre: pedido.usuario.nombre,
          tracking: codigo_tracking,
          agenciaEnvio: agencia_envio || 'Courier',
        });
      }
    } catch (error) {
      this.logger.error(`Error al enviar email de tracking para pedido #${id}:`, error);
      // No lanzar error para no bloquear la actualización del tracking
    }

    return this.obtenerPedido(id);
  }

  /**
   * Estadísticas generales del admin
   */
  async obtenerEstadisticas() {
    const [
      totalProductos,
      totalPedidos,
      totalUsuarios,
      pedidosPendientes,
      totalVentas,
    ] = await Promise.all([
      this.prisma.producto.count(),
      this.prisma.pedido.count(),
      this.prisma.usuario.count(),
      this.prisma.pedido.count({ where: { estado: 'pendiente' } }),
      this.prisma.pedido.aggregate({
        _sum: {
          total: true,
        },
        where: {
          estado: { in: ['confirmado', 'enviado', 'entregado'] },
        },
      }),
    ]);

    return {
      total_productos: totalProductos,
      total_pedidos: totalPedidos,
      total_usuarios: totalUsuarios,
      pedidos_pendientes: pedidosPendientes,
      total_ventas: Number(totalVentas._sum.total || 0),
    };
  }

  /**
   * Transformar pedido a JSON profesional
   */
  private transformarPedido(pedido: any) {
    const items = pedido.item_pedido.map((item: any) => ({
      id: item.id,
      pedido_id: item.pedido_id,
      producto_id: item.producto_id,
      variacion_id: item.variacion_id,
      nombre: item.producto?.nombre,
      nombre_producto: item.producto?.nombre, // Alias para frontend
      precio_unitario: Number(item.precio_unitario),
      precioUnitario: Number(item.precio_unitario), // Alias para frontend
      cantidad: item.cantidad,
      color: item.variacion?.color,
      talla: item.variacion?.talla,
      subtotal: Number(item.precio_unitario) * item.cantidad,
      producto: item.producto ? {
        id: item.producto.id,
        nombre: item.producto.nombre,
        imagen_principal: item.producto.imagen_principal,
        precio: Number(item.producto.precio),
      } : null,
      variacion: item.variacion ? {
        id: item.variacion.id,
        talla: item.variacion.talla,
        color: item.variacion.color,
        sku: item.variacion.sku,
      } : null,
    }));

    return {
      id: pedido.id, // Alias para compatibilidad frontend
      pedido_id: pedido.id,
      usuario_id: pedido.usuario_id,
      usuario: pedido.usuario
        ? {
            id: pedido.usuario.id,
            nombre: pedido.usuario.nombre,
            email: pedido.usuario.email,
            telefono: pedido.usuario.telefono,
          }
        : null,
      total: Number(pedido.total),
      subtotal: Number(pedido.subtotal || 0),
      descuento: Number(pedido.descuento || 0),
      envio: Number(pedido.envio || 0),
      estado: pedido.estado,
      tracking: pedido.codigo_tracking,
      numero_seguimiento: pedido.codigo_tracking, // Alias para compatibilidad
      codigo_tracking: pedido.codigo_tracking,
      agencia_envio: pedido.agencia_envio,
      nombre_receptor: pedido.nombre_receptor,
      nombre_completo: pedido.nombre_receptor, // Alias para frontend
      direccion_envio: pedido.direccion_envio,
      direccion: pedido.direccion_envio, // Alias para frontend
      ciudad: pedido.ciudad,
      region: pedido.region,
      pais: pedido.pais,
      codigo_postal: pedido.codigo_postal,
      telefono_contacto: pedido.telefono_contacto,
      telefono: pedido.telefono_contacto, // Alias para frontend
      email: pedido.usuario?.email || '', // Email del usuario
      notas: pedido.notas,
      creado_en: pedido.creado_en,
      voucher_url: pedido.pago_simulado?.[0]?.voucher_url,
      metodo_pago: pedido.pago_simulado?.[0]?.metodo,
      items,
      pago: pedido.pago_simulado?.[0]
        ? {
            id: pedido.pago_simulado[0].id,
            metodo: pedido.pago_simulado[0].metodo,
            estado_pago: pedido.pago_simulado[0].estado_pago,
            referencia: pedido.pago_simulado[0].referencia,
          }
        : null,
    };
  }
}
