import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { createSlug } from './utils/slug.util';
import { generarSKU } from './utils/sku-generator';

@Injectable()
export class ProductoService {
  constructor(private prisma: PrismaService) {}

  async crear(data: CrearProductoDto) {
    // Si tiene categoría, validar que exista
    if (data.categoria_id) {
      const categoria = await this.prisma.categoria.findUnique({
        where: { id: data.categoria_id },
      });
      if (!categoria) throw new NotFoundException('La categoría no existe');
    }

    // Si tiene temporada, validar que exista
    if (data.temporada_id) {
      const temporada = await this.prisma.temporada.findUnique({
        where: { id: data.temporada_id },
      });
      if (!temporada) throw new NotFoundException('La temporada no existe');
    }

    // Generar slug único basado en el nombre
    const slug = await this.generarSlugUnico(data.nombre);

    // Crear producto con variaciones si las tiene
    const producto = await this.prisma.producto.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        imagenes: data.imagenes,
        categoria_id: data.categoria_id,
        temporada_id: data.temporada_id,
        genero: data.genero || 'ambos',
        slug,
        // Si tiene variaciones, crearlas con SKU auto-generado si no se proporciona
        ...(data.tiene_variaciones && data.variaciones?.length
          ? {
              variaciones: {
                create: data.variaciones.map((v) => ({
                  talla: v.talla,
                  color: v.color,
                  codigo_color: v.codigo_color,
                  imagen_url: v.imagen_url,
                  stock: v.stock,
                  sku: v.sku || 'TEMP', // Temporal, se actualizará después
                })),
              },
            }
          : {}),
      },
      include: {
        variaciones: true,
        categoria: true,
        temporada: true,
      },
    });

    // Actualizar SKUs de variaciones con el ID del producto si no se proporcionaron
    if (data.tiene_variaciones && data.variaciones?.length && producto.variaciones?.length) {
      for (const variacion of producto.variaciones) {
        if (variacion.sku === 'TEMP') {
          const nuevoSKU = generarSKU(producto.id, variacion.color, variacion.talla);
          await this.prisma.variacion_producto.update({
            where: { id: variacion.id },
            data: { sku: nuevoSKU },
          });
          variacion.sku = nuevoSKU; // Actualizar en el objeto retornado
        }
      }
    }

    return producto;
  }

  async listar(filtros?: {
    categoria?: number;
    temporada?: number;
    genero?: string;
    precio_min?: number;
    precio_max?: number;
    buscar?: string;
    orden?: string;
    pagina?: number;
    limite?: number;
    admin?: boolean;
  }) {
    const pagina = filtros?.pagina || 1;
    const limite = filtros?.limite || 20;
    const skip = (pagina - 1) * limite;

    // Construir WHERE dinámico
    const where: any = {};

    // Filtrar solo productos activos si no es admin
    if (!filtros?.admin) {
      where.activo = true;
    }

    if (filtros?.categoria) {
      where.categoria_id = filtros.categoria;
    }

    if (filtros?.temporada) {
      where.temporada_id = filtros.temporada;
    }

    // Filtro por género: si es 'hombre' o 'mujer', incluir también 'ambos'
    if (filtros?.genero && filtros.genero !== 'ambos') {
      where.genero = { in: [filtros.genero, 'ambos'] };
    } else if (filtros?.genero === 'ambos') {
      where.genero = 'ambos';
    }

    if (filtros?.precio_min || filtros?.precio_max) {
      where.precio = {};
      if (filtros.precio_min) {
        where.precio.gte = filtros.precio_min;
      }
      if (filtros.precio_max) {
        where.precio.lte = filtros.precio_max;
      }
    }

    // Búsqueda por nombre o descripción
    if (filtros?.buscar) {
      where.OR = [
        { nombre: { contains: filtros.buscar, mode: 'insensitive' } },
        { descripcion: { contains: filtros.buscar, mode: 'insensitive' } },
      ];
    }

    // Construir ORDER BY dinámico
    let orderBy: any = { creado_en: 'desc' }; // Default: más recientes

    if (filtros?.orden) {
      switch (filtros.orden) {
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
        case 'newest':
          orderBy = { creado_en: 'desc' };
          break;
        default:
          orderBy = { creado_en: 'desc' };
      }
    }

    const [productos, total] = await Promise.all([
      this.prisma.producto.findMany({
        where,
        skip,
        take: limite,
        orderBy,
        include: {
          categoria: true,
          temporada: true,
          variaciones: {
            orderBy: [{ talla: 'asc' }, { color: 'asc' }],
          },
        },
      }),
      this.prisma.producto.count({ where }),
    ]);

    return {
      productos: productos.map((producto) =>
        this.transformarProducto(producto),
      ),
      paginacion: {
        pagina_actual: pagina,
        limite,
        total,
        total_paginas: Math.ceil(total / limite),
      },
    };
  }

  async buscarPorId(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        temporada: true,
        variaciones: {
          orderBy: [{ talla: 'asc' }, { color: 'asc' }],
        },
      },
    });

    if (!producto) {
      throw new NotFoundException('El producto no existe');
    }

    return this.transformarProducto(producto);
  }

  async actualizar(id: number, data: ActualizarProductoDto) {
    const producto = await this.prisma.producto.findUnique({ 
      where: { id },
      include: { variaciones: true }
    });
    if (!producto) throw new NotFoundException('El producto no existe');

    // Si se actualiza el nombre, regenerar el slug
    let slug: string | undefined;
    if (data.nombre && data.nombre !== producto.nombre) {
      slug = await this.generarSlugUnico(data.nombre, id);
    }

    // Preparar datos de actualización (solo incluir campos que vienen en data)
    const updateData: any = {};
    
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.precio !== undefined) updateData.precio = data.precio;
    if (data.imagenes !== undefined) updateData.imagenes = data.imagenes;
    if (data.genero !== undefined) updateData.genero = data.genero;
    // Nota: tiene_variaciones no existe en el schema, se determina por la existencia de variaciones
    if (slug) updateData.slug = slug;

    // Manejar relaciones con connect/disconnect
    if (data.categoria_id !== undefined) {
      updateData.categoria = data.categoria_id 
        ? { connect: { id: data.categoria_id } }
        : { disconnect: true };
    }

    if (data.temporada_id !== undefined) {
      updateData.temporada = data.temporada_id
        ? { connect: { id: data.temporada_id } }
        : { disconnect: true };
    }

    // Si tiene variaciones, eliminar las existentes y crear las nuevas
    if (data.tiene_variaciones && data.variaciones?.length) {
      // Eliminar variaciones existentes
      await this.prisma.variacion_producto.deleteMany({
        where: { producto_id: id },
      });

      // Crear las nuevas variaciones
      updateData.variaciones = {
        create: data.variaciones.map((v) => ({
          talla: v.talla,
          color: v.color,
          codigo_color: v.codigo_color,
          imagen_url: v.imagen_url,
          stock: v.stock,
          sku: v.sku || generarSKU(id, v.color, v.talla),
        })),
      };
    } else if (!data.tiene_variaciones) {
      // Si ya no tiene variaciones, eliminar todas
      await this.prisma.variacion_producto.deleteMany({
        where: { producto_id: id },
      });
    }

    return this.prisma.producto.update({
      where: { id },
      data: updateData,
      include: {
        variaciones: true,
        categoria: true,
        temporada: true,
      },
    });
  }

  async eliminar(id: number) {
    return this.prisma.producto.delete({ where: { id } });
  }

  /**
   * Genera un slug único basado en el nombre del producto
   * Si el slug ya existe, agrega un sufijo incremental (ej: og-black-1, og-black-2)
   * 
   * @param nombre - Nombre del producto
   * @param excludeId - ID del producto a excluir en la búsqueda (útil para actualizaciones)
   * @returns Slug único generado
   */
  private async generarSlugUnico(
    nombre: string,
    excludeId?: number,
  ): Promise<string> {
    const slugBase = createSlug(nombre);
    let slug = slugBase;
    let contador = 0;

    // Verificar si el slug ya existe
    while (true) {
      const existente = await this.prisma.producto.findFirst({
        where: {
          slug,
          ...(excludeId && { id: { not: excludeId } }), // Excluir el producto actual si es una actualización
        },
      });

      if (!existente) {
        // Slug disponible
        break;
      }

      // Slug ocupado, intentar con sufijo incremental
      contador++;
      slug = `${slugBase}-${contador}`;
    }

    return slug;
  }

  /**
   * Transforma el producto para devolver un JSON profesional para eCommerce
   * - Convierte precio de Decimal a número
   * - Calcula stock_total sumando el stock de todas las variaciones
   * - Remueve campos null innecesarios
   * - Formatea variaciones con ordenamiento
   */
  private transformarProducto(producto: any) {
    const {
      id,
      nombre,
      descripcion,
      precio,
      precio_oferta,
      sku,
      imagenes,
      slug,
      genero,
      creado_en,
      categoria,
      temporada,
      variaciones,
      activo,
      recomendado,
      nuevo,
    } = producto;

    // Calcular stock_total sumando el stock de todas las variaciones
    const stock_total = variaciones
      ? variaciones.reduce((total: number, v: any) => total + (v.stock || 0), 0)
      : 0;

    // Construir objeto base sin campos null innecesarios
    const productoTransformado: any = {
      id,
      nombre,
      precio: Number(precio), // Convertir Decimal a número
    };

    // Solo incluir campos opcionales si tienen valor
    if (descripcion) productoTransformado.descripcion = descripcion;
    if (precio_oferta) productoTransformado.precio_oferta = Number(precio_oferta);
    if (sku) productoTransformado.sku = sku;
    if (imagenes) productoTransformado.imagenes = imagenes;
    if (slug) productoTransformado.slug = slug;
    if (genero) productoTransformado.genero = genero;
    if (creado_en) productoTransformado.creado_en = creado_en;
    if (activo !== undefined) productoTransformado.activo = activo;
    if (recomendado !== undefined) productoTransformado.recomendado = recomendado;
    if (nuevo !== undefined) productoTransformado.nuevo = nuevo;

    // Incluir relaciones
    if (categoria) productoTransformado.categoria = categoria;
    if (temporada) productoTransformado.temporada = temporada;

    // Incluir stock_total calculado
    productoTransformado.stock_total = stock_total;

    // Transformar variaciones (remover producto_id innecesario)
    if (variaciones && variaciones.length > 0) {
      productoTransformado.variaciones = variaciones.map((v: any) => ({
        id: v.id,
        talla: v.talla,
        color: v.color,
        codigo_color: v.codigo_color,
        imagen_url: v.imagen_url,
        stock: v.stock,
        sku: v.sku,
      }));
    }

    return productoTransformado;
  }

  async listarDestacados(limite: number = 12) {
    const productos = await this.prisma.producto.findMany({
      where: {
        activo: true,
        recomendado: true,
      },
      take: limite,
      orderBy: { creado_en: 'desc' },
      include: {
        categoria: true,
        temporada: true,
        variaciones: {
          orderBy: [{ talla: 'asc' }, { color: 'asc' }],
        },
      },
    });

    return productos.map((producto) => this.transformarProducto(producto));
  }

  async actualizarEstado(id: number, activo: boolean) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    const productoActualizado = await this.prisma.producto.update({
      where: { id },
      data: { activo },
      include: {
        categoria: true,
        temporada: true,
        variaciones: true,
      },
    });

    return this.transformarProducto(productoActualizado);
  }

  async actualizarDestacado(id: number, recomendado: boolean) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    const productoActualizado = await this.prisma.producto.update({
      where: { id },
      data: { recomendado },
      include: {
        categoria: true,
        temporada: true,
        variaciones: true,
      },
    });

    return this.transformarProducto(productoActualizado);
  }
}
