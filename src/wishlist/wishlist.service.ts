import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  /**
   * Agregar producto a la wishlist
   */
  async agregar(usuario_id: number, producto_id: number) {
    // Verificar que el producto existe
    const producto = await this.prisma.producto.findUnique({
      where: { id: producto_id },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Verificar si ya existe en wishlist
    const existe = await this.prisma.wishlist.findFirst({
      where: {
        usuario_id,
        producto_id,
      },
    });

    if (existe) {
      throw new ConflictException('El producto ya está en tu lista de deseos');
    }

    // Agregar a wishlist
    return this.prisma.wishlist.create({
      data: {
        usuario_id,
        producto_id,
      },
      include: {
        producto: {
          include: {
            categoria: true,
            temporada: true,
            variaciones: {
              take: 1,
              orderBy: { stock: 'desc' },
            },
          },
        },
      },
    });
  }

  /**
   * Obtener wishlist del usuario
   */
  async obtener(usuario_id: number) {
    const wishlist = await this.prisma.wishlist.findMany({
      where: { usuario_id },
      include: {
        producto: {
          include: {
            categoria: true,
            temporada: true,
            variaciones: {
              orderBy: [{ talla: 'asc' }, { color: 'asc' }],
            },
          },
        },
      },
      orderBy: { agregado_en: 'desc' },
    });

    return wishlist.map((item) => ({
      id: item.id,
      producto: this.transformarProducto(item.producto),
      agregado_en: item.agregado_en,
    }));
  }

  /**
   * Eliminar de wishlist
   */
  async eliminar(id: number, usuario_id: number) {
    // Verificar que el item existe y pertenece al usuario
    const item = await this.prisma.wishlist.findFirst({
      where: { id, usuario_id },
    });

    if (!item) {
      throw new NotFoundException('Item de wishlist no encontrado');
    }

    await this.prisma.wishlist.delete({
      where: { id },
    });

    return { mensaje: 'Producto eliminado de tu lista de deseos' };
  }

  /**
   * Verificar si un producto está en favoritos
   */
  async esFavorito(producto_id: number, usuario_id: number) {
    const existe = await this.prisma.wishlist.findFirst({
      where: {
        usuario_id,
        producto_id,
      },
    });

    return { es_favorito: !!existe };
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
        stock: v.stock,
        sku: v.sku,
      })),
      creado_en: producto.creado_en,
    };
  }
}
