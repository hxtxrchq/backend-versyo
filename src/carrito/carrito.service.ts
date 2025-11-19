import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgregarItemCarritoDto } from './dto/agregar-item-carrito.dto';
import { ActualizarItemCarritoDto } from './dto/actualizar-item-carrito.dto';

@Injectable()
export class CarritoService {
  constructor(private prisma: PrismaService) {}

  // Buscar carrito activo o crearlo
  private async obtenerOCrearCarrito(usuarioId: number) {
    let carrito = await this.prisma.carrito.findFirst({
      where: { usuario_id: usuarioId, estado: 'activo' },
    });

    if (!carrito) {
      carrito = await this.prisma.carrito.create({
        data: { usuario_id: usuarioId, estado: 'activo' },
      });
    }

    return carrito;
  }

  // Agregar item al carrito
  async agregarItem(usuarioId: number, data: AgregarItemCarritoDto) {
    const { variacion_id, cantidad = 1 } = data;

    // 1. Verificar que exista la variación
    const variacion = await this.prisma.variacion_producto.findUnique({
      where: { id: variacion_id },
      include: { producto: true },
    });

    if (!variacion) {
      throw new NotFoundException('La variación seleccionada no existe');
    }

    if (!variacion.stock || variacion.stock < cantidad) {
      throw new BadRequestException('No hay stock suficiente para esta variación');
    }

    // 2. Obtener/crear carrito del usuario
    const carrito = await this.obtenerOCrearCarrito(usuarioId);

    // 3. Ver si ya existe un item con la misma variación
    const itemExistente = await this.prisma.item_carrito.findFirst({
      where: {
        carrito_id: carrito.id,
        variacion_id: variacion_id,
      },
    });

    const precioUnitario = variacion.producto.precio; // Decimal

    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + cantidad;

      if (variacion.stock < nuevaCantidad) {
        throw new BadRequestException('No hay stock suficiente para aumentar la cantidad');
      }

      return this.prisma.item_carrito.update({
        where: { id: itemExistente.id },
        data: { cantidad: nuevaCantidad },
      });
    }

    // 4. Crear item nuevo
    return this.prisma.item_carrito.create({
      data: {
        carrito_id: carrito.id,
        producto_id: variacion.producto_id,
        variacion_id,
        cantidad,
        precio_unitario: precioUnitario,
      },
    });
  }

  // Obtener carrito del usuario con detalle
  async obtenerCarrito(usuarioId: number) {
    const carrito = await this.prisma.carrito.findFirst({
      where: { usuario_id: usuarioId, estado: 'activo' },
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
      return {
        carrito_id: null,
        total_items: 0,
        total_costo: 0,
        items: [],
      };
    }

    const items = carrito.item_carrito.map((item) => {
      const precio = Number(item.precio_unitario); // Decimal → number
      const subtotal = precio * item.cantidad;

      return {
        item_id: item.id,
        producto_id: item.producto_id,
        nombre: item.producto?.nombre,
        precio: precio,
        cantidad: item.cantidad,
        subtotal,
        imagen_principal: Array.isArray(item.producto?.imagenes)
          ? (item.producto!.imagenes as any[])[0]
          : null,
        variacion: {
          id: item.variacion.id,
          talla: item.variacion.talla,
          color: item.variacion.color,
          sku: item.variacion.sku,
          stock_disponible: item.variacion.stock,
        },
      };
    });

    const total_costo = items.reduce((acc, it) => acc + it.subtotal, 0);
    const total_items = items.reduce((acc, it) => acc + it.cantidad, 0);

    return {
      carrito_id: carrito.id,
      total_items,
      total_costo,
      items,
    };
  }

  // Actualizar cantidad de un item
  async actualizarCantidad(usuarioId: number, itemId: number, data: ActualizarItemCarritoDto) {
    const item = await this.prisma.item_carrito.findUnique({
      where: { id: itemId },
      include: {
        carrito: true,
        variacion: true,
      },
    });

    if (!item) throw new NotFoundException('El item no existe');

    if (item.carrito?.usuario_id !== usuarioId) {
      throw new ForbiddenException('No puedes modificar este carrito');
    }

    if (!item.variacion.stock || item.variacion.stock < data.cantidad) {
      throw new BadRequestException('No hay stock suficiente para esta variación');
    }

    return this.prisma.item_carrito.update({
      where: { id: itemId },
      data: { cantidad: data.cantidad },
    });
  }

  // Eliminar un item del carrito
  async eliminarItem(usuarioId: number, itemId: number) {
    const item = await this.prisma.item_carrito.findUnique({
      where: { id: itemId },
      include: { carrito: true },
    });

    if (!item) throw new NotFoundException('El item no existe');

    if (item.carrito?.usuario_id !== usuarioId) {
      throw new ForbiddenException('No puedes modificar este carrito');
    }

    await this.prisma.item_carrito.delete({ where: { id: itemId } });

    return { mensaje: 'Item eliminado del carrito' };
  }

  // Vaciar carrito
  async vaciarCarrito(usuarioId: number) {
    const carrito = await this.prisma.carrito.findFirst({
      where: { usuario_id: usuarioId, estado: 'activo' },
    });

    if (!carrito) return { mensaje: 'El carrito ya está vacío' };

    await this.prisma.item_carrito.deleteMany({
      where: { carrito_id: carrito.id },
    });

    return { mensaje: 'Carrito vaciado correctamente' };
  }
}
