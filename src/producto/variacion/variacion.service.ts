import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearVariacionDto } from './dto/crear-variacion.dto';
import { ActualizarVariacionDto } from './dto/actualizar-variacion.dto';

@Injectable()
export class VariacionService {
  constructor(private prisma: PrismaService) {}

  async crear(productoId: number, data: CrearVariacionDto) {
    // Validar que el producto exista
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
    });

    if (!producto) {
      throw new NotFoundException('El producto no existe');
    }

    return this.prisma.variacion_producto.create({
      data: {
        talla: data.talla,
        color: data.color,
        stock: data.stock,
        sku: data.sku,
        producto_id: productoId,
      },
    });
  }

  listar(productoId: number) {
    return this.prisma.variacion_producto.findMany({
      where: { producto_id: productoId },
    });
  }

  async buscarPorId(id: number) {
    const variacion = await this.prisma.variacion_producto.findUnique({
      where: { id },
    });

    if (!variacion) throw new NotFoundException('La variación no existe');

    return variacion;
  }

  async actualizar(id: number, data: ActualizarVariacionDto) {
    await this.buscarPorId(id); // valida existencia

    return this.prisma.variacion_producto.update({
      where: { id },
      data,
    });
  }

  async eliminar(id: number) {
    await this.buscarPorId(id); // valida existencia

    return this.prisma.variacion_producto.delete({
      where: { id },
    });
  }
}
