import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ContactoDto } from './dto/contacto.dto';

@Injectable()
export class PublicoService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Obtener datos para la portada/home
   */
  async obtenerPortada() {
    // Productos destacados (últimos 8)
    const productos_destacados = await this.prisma.producto.findMany({
      where: {
        activo: true,
        destacado: true,
      },
      take: 8,
      orderBy: { creado_en: 'desc' },
      include: {
        categoria: true,
        temporada: true,
        variaciones: {
          take: 1,
          orderBy: { stock: 'desc' },
        },
      },
    });

    // Temporadas activas
    const temporadas_activas = await this.prisma.temporada.findMany({
      where: { activo: true },
      orderBy: { id: 'desc' },
    });

    // Categorías principales
    const categorias_principales = await this.prisma.categoria.findMany({
      orderBy: { id: 'asc' },
    });

    // Productos nuevos (últimos 12)
    const productos_nuevos = await this.prisma.producto.findMany({
      where: { activo: true },
      take: 12,
      orderBy: { creado_en: 'desc' },
      include: {
        categoria: true,
        temporada: true,
        variaciones: {
          take: 1,
          orderBy: { stock: 'desc' },
        },
      },
    });

    // Productos populares (basado en wishlist)
    const productos_populares = await this.prisma.producto.findMany({
      where: { activo: true },
      take: 12,
      include: {
        categoria: true,
        temporada: true,
        variaciones: {
          take: 1,
          orderBy: { stock: 'desc' },
        },
        _count: {
          select: { wishlist: true },
        },
      },
      orderBy: {
        wishlist: {
          _count: 'desc',
        },
      },
    });

    return {
      destacados: productos_destacados.map((p) => this.transformarProducto(p)),
      nuevos: productos_nuevos.map((p) => this.transformarProducto(p)),
      populares: productos_populares.map((p) => this.transformarProducto(p)),
      temporadas_activas,
      categorias_principales,
    };
  }

  /**
   * Listar productos con paginación y filtros
   */
  async listarProductos(filtros: any) {
    const {
      categoria,
      temporada,
      genero,
      talla,
      color,
      precio_min,
      precio_max,
      q,
      orden = 'recientes',
      pagina = 1,
      limite = 20,
    } = filtros;

    const skip = (Number(pagina) - 1) * Number(limite);
    const take = Number(limite);

    // Construir where dinámicamente
    const where: any = {
      activo: true, // Solo productos activos
    };

    if (q) {
      where.nombre = { contains: q, mode: 'insensitive' };
    }

    if (categoria) {
      where.categoria = { identificador: categoria };
    }

    if (temporada) {
      where.temporada_id = Number(temporada);
    }

    // Filtro por género: si es 'hombre' o 'mujer', incluir también 'ambos'
    if (genero && genero !== 'ambos') {
      where.genero = { in: [genero, 'ambos'] };
    } else if (genero === 'ambos') {
      where.genero = 'ambos';
    }

    if (precio_min || precio_max) {
      where.precio = {};
      if (precio_min) where.precio.gte = Number(precio_min);
      if (precio_max) where.precio.lte = Number(precio_max);
    }

    // Si filtran por talla o color, solo traer productos que tengan variaciones con esos valores
    if (talla || color) {
      const variacionWhere: any = {};
      if (talla) variacionWhere.talla = talla;
      if (color) variacionWhere.color = { contains: color, mode: 'insensitive' };

      where.variaciones = {
        some: variacionWhere,
      };
    }

    // Definir ordenamiento
    let orderBy: any = {};
    switch (orden) {
      case 'precio_asc':
        orderBy = { precio: 'asc' };
        break;
      case 'precio_desc':
        orderBy = { precio: 'desc' };
        break;
      case 'nombre_asc':
        orderBy = { nombre: 'asc' };
        break;
      case 'nombre_desc':
        orderBy = { nombre: 'desc' };
        break;
      case 'recientes':
      default:
        orderBy = { creado_en: 'desc' };
        break;
    }

    // Obtener productos y total
    const [productos, total] = await Promise.all([
      this.prisma.producto.findMany({
        where,
        include: {
          categoria: true,
          temporada: true,
          variaciones: {
            orderBy: [{ talla: 'asc' }, { color: 'asc' }],
          },
        },
        orderBy,
        skip,
        take,
      }),
      this.prisma.producto.count({ where }),
    ]);

    return {
      productos: productos.map((p) => this.transformarProducto(p)),
      paginacion: {
        total,
        pagina: Number(pagina),
        limite: Number(limite),
        total_paginas: Math.ceil(total / Number(limite)),
      },
    };
  }

  /**
   * Buscar productos por texto
   */
  async buscarProductos(q: string, limite = 10) {
    const productos = await this.prisma.producto.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { descripcion: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        categoria: true,
        variaciones: {
          take: 1,
          orderBy: { stock: 'desc' },
        },
      },
      take: Number(limite),
    });

    return productos.map((p) => this.transformarProducto(p));
  }

  /**
   * Obtener producto por slug
   */
  async obtenerPorSlug(slug: string) {
    const producto = await this.prisma.producto.findFirst({
      where: { 
        slug,
        activo: true,
      },
      include: {
        categoria: true,
        temporada: true,
        variaciones: {
          orderBy: [{ talla: 'asc' }, { color: 'asc' }],
        },
      },
    });

    if (!producto) return null;

    return this.transformarProducto(producto);
  }

  /**
   * Obtener producto por ID
   */
  async obtenerPorId(id: number) {
    const producto = await this.prisma.producto.findFirst({
      where: { 
        id,
        activo: true,
      },
      include: {
        categoria: true,
        temporada: true,
        variaciones: {
          orderBy: [{ talla: 'asc' }, { color: 'asc' }],
        },
      },
    });

    if (!producto) return null;

    return this.transformarProducto(producto);
  }

  /**
   * Productos por categoría
   */
  async productosPorCategoria(identificador: string, pagina = 1, limite = 20) {
    const skip = (Number(pagina) - 1) * Number(limite);
    const take = Number(limite);

    const [productos, total] = await Promise.all([
      this.prisma.producto.findMany({
        where: {
          activo: true,
          categoria: { identificador },
        },
        include: {
          categoria: true,
          temporada: true,
          variaciones: {
            orderBy: [{ talla: 'asc' }, { color: 'asc' }],
          },
        },
        orderBy: { creado_en: 'desc' },
        skip,
        take,
      }),
      this.prisma.producto.count({
        where: { 
          activo: true,
          categoria: { identificador },
        },
      }),
    ]);

    return {
      productos: productos.map((p) => this.transformarProducto(p)),
      paginacion: {
        total,
        pagina: Number(pagina),
        limite: Number(limite),
        total_paginas: Math.ceil(total / Number(limite)),
      },
    };
  }

  /**
   * Productos por temporada
   */
  async productosPorTemporada(temporadaId: number, pagina = 1, limite = 20) {
    const skip = (Number(pagina) - 1) * Number(limite);
    const take = Number(limite);

    const [productos, total] = await Promise.all([
      this.prisma.producto.findMany({
        where: { 
          activo: true,
          temporada_id: temporadaId,
        },
        include: {
          categoria: true,
          temporada: true,
          variaciones: {
            orderBy: [{ talla: 'asc' }, { color: 'asc' }],
          },
        },
        orderBy: { creado_en: 'desc' },
        skip,
        take,
      }),
      this.prisma.producto.count({
        where: { 
          activo: true,
          temporada_id: temporadaId,
        },
      }),
    ]);

    return {
      productos: productos.map((p) => this.transformarProducto(p)),
      paginacion: {
        total,
        pagina: Number(pagina),
        limite: Number(limite),
        total_paginas: Math.ceil(total / Number(limite)),
      },
    };
  }

  /**
   * Productos nuevos
   */
  async productosNuevos(limite = 12) {
    const productos = await this.prisma.producto.findMany({
      where: { activo: true },
      take: Number(limite),
      orderBy: { creado_en: 'desc' },
      include: {
        categoria: true,
        temporada: true,
        variaciones: {
          orderBy: [{ talla: 'asc' }, { color: 'asc' }],
        },
      },
    });

    return productos.map((p) => this.transformarProducto(p));
  }

  /**
   * Productos populares (por número de ventas - simulado con wishlist por ahora)
   */
  async productosPopulares(limite = 12) {
    const productos = await this.prisma.producto.findMany({
      where: { activo: true },
      take: Number(limite),
      include: {
        categoria: true,
        temporada: true,
        variaciones: {
          orderBy: [{ talla: 'asc' }, { color: 'asc' }],
        },
        _count: {
          select: { wishlist: true },
        },
      },
      orderBy: {
        wishlist: {
          _count: 'desc',
        },
      },
    });

    return productos.map((p) => this.transformarProducto(p));
  }

  /**
   * Listar categorías
   */
  async listarCategorias() {
    return this.prisma.categoria.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Listar temporadas activas
   */
  async listarTemporadasActivas() {
    return this.prisma.temporada.findMany({
      where: { activo: true },
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Obtener variaciones de un producto
   */
  async obtenerVariaciones(productoId: number) {
    return this.prisma.variacion_producto.findMany({
      where: { producto_id: productoId },
      orderBy: [{ talla: 'asc' }, { color: 'asc' }],
    });
  }

  /**
   * Transformar producto a formato JSON
   */
  private transformarProducto(producto: any) {
    const stock_total = producto.variaciones
      ? producto.variaciones.reduce((total: number, v: any) => total + (v.stock || 0), 0)
      : 0;

    return {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: Number(producto.precio),
      imagenes: producto.imagenes,
      slug: producto.slug,
      categoria: producto.categoria,
      temporada: producto.temporada,
      stock_total,
      variaciones: producto.variaciones?.map((v: any) => ({
        id: v.id,
        talla: v.talla,
        color: v.color,
        codigo_color: v.codigo_color,
        imagen_url: v.imagen_url,
        stock: v.stock,
        sku: v.sku,
      })),
      creado_en: producto.creado_en,
    };
  }

  /**
   * Enviar mensaje de contacto por email
   */
  async enviarContacto(data: ContactoDto) {
    const destinatario = process.env.CONTACT_EMAIL || process.env.GMAIL_USER;

    if (!destinatario) {
      throw new Error('No hay correo de contacto configurado');
    }

    await this.emailService.enviarCorreoContacto(
      destinatario,
      data.nombre,
      data.email,
      data.asunto,
      data.mensaje,
    );

    return {
      success: true,
      message: 'Mensaje de contacto enviado correctamente',
    };
  }
}
