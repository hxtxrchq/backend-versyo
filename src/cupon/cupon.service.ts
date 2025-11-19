import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCuponDto } from './dto/crear-cupon.dto';
import { ActualizarCuponDto } from './dto/actualizar-cupon.dto';

@Injectable()
export class CuponService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear cupón (solo admin)
   */
  async crear(crearCuponDto: CrearCuponDto) {
    const { codigo, tipo_descuento, valor_descuento, monto_minimo, descuento_maximo, usos_maximos, fecha_inicio, fecha_fin } = crearCuponDto;

    // Validar que el código no exista
    const existe = await this.prisma.cupon.findUnique({
      where: { codigo: codigo.toUpperCase() },
    });

    if (existe) {
      throw new ConflictException('El código de cupón ya existe');
    }

    // Validar porcentaje
    if (tipo_descuento === 'porcentaje' && valor_descuento > 100) {
      throw new BadRequestException('El porcentaje no puede ser mayor a 100');
    }

    // Validar fechas
    if (fecha_inicio && fecha_fin) {
      const inicio = new Date(fecha_inicio);
      const fin = new Date(fecha_fin);
      if (fin <= inicio) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }

    return this.prisma.cupon.create({
      data: {
        codigo: codigo.toUpperCase(),
        tipo_descuento,
        valor_descuento,
        monto_minimo: monto_minimo || null,
        descuento_maximo: descuento_maximo || null,
        usos_maximos: usos_maximos || null,
        usos_actuales: 0,
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
        activo: true,
      },
    });
  }

  /**
   * Listar todos los cupones (solo admin)
   */
  async listarTodos() {
    return this.prisma.cupon.findMany({
      orderBy: { creado_en: 'desc' },
    });
  }

  /**
   * Obtener cupón por ID (solo admin)
   */
  async obtenerPorId(id: number) {
    const cupon = await this.prisma.cupon.findUnique({
      where: { id },
    });

    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    return cupon;
  }

  /**
   * Actualizar cupón (solo admin)
   */
  async actualizar(id: number, actualizarCuponDto: ActualizarCuponDto) {
    const cupon = await this.prisma.cupon.findUnique({
      where: { id },
    });

    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    const { codigo, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, ...resto } = actualizarCuponDto;

    // Si cambia el código, validar que no exista
    if (codigo && codigo.toUpperCase() !== cupon.codigo) {
      const existe = await this.prisma.cupon.findUnique({
        where: { codigo: codigo.toUpperCase() },
      });

      if (existe) {
        throw new ConflictException('El código de cupón ya existe');
      }
    }

    // Validar porcentaje
    if (tipo_descuento === 'porcentaje' && valor_descuento && valor_descuento > 100) {
      throw new BadRequestException('El porcentaje no puede ser mayor a 100');
    }

    // Validar fechas
    if (fecha_inicio && fecha_fin) {
      const inicio = new Date(fecha_inicio);
      const fin = new Date(fecha_fin);
      if (fin <= inicio) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }

    return this.prisma.cupon.update({
      where: { id },
      data: {
        codigo: codigo ? codigo.toUpperCase() : undefined,
        tipo_descuento,
        valor_descuento,
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : undefined,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : undefined,
        ...resto,
      },
    });
  }

  /**
   * Eliminar cupón (solo admin)
   */
  async eliminar(id: number) {
    const cupon = await this.prisma.cupon.findUnique({
      where: { id },
    });

    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    await this.prisma.cupon.delete({
      where: { id },
    });

    return { mensaje: 'Cupón eliminado correctamente' };
  }

  /**
   * Validar cupón (usuarios)
   */
  async validar(codigo: string, monto_compra: number) {
    const cupon = await this.prisma.cupon.findUnique({
      where: { codigo: codigo.toUpperCase() },
    });

    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    // Validar que esté activo
    if (!cupon.activo) {
      throw new BadRequestException('Cupón inactivo');
    }

    // Validar fechas
    const ahora = new Date();
    if (cupon.fecha_inicio && ahora < cupon.fecha_inicio) {
      throw new BadRequestException('Cupón aún no válido');
    }

    if (cupon.fecha_fin && ahora > cupon.fecha_fin) {
      throw new BadRequestException('Cupón expirado');
    }

    // Validar usos
    if (cupon.usos_maximos && cupon.usos_actuales >= cupon.usos_maximos) {
      throw new BadRequestException('Cupón sin usos disponibles');
    }

    // Validar monto mínimo
    if (cupon.monto_minimo && monto_compra < Number(cupon.monto_minimo)) {
      throw new BadRequestException(`Monto mínimo de compra: $${cupon.monto_minimo}`);
    }

    // Calcular descuento
    let descuento = 0;
    if (cupon.tipo_descuento === 'porcentaje') {
      descuento = (monto_compra * Number(cupon.valor_descuento)) / 100;
      if (cupon.descuento_maximo && descuento > Number(cupon.descuento_maximo)) {
        descuento = Number(cupon.descuento_maximo);
      }
    } else {
      descuento = Number(cupon.valor_descuento);
    }

    return {
      valido: true,
      cupon: {
        id: cupon.id,
        codigo: cupon.codigo,
        tipo_descuento: cupon.tipo_descuento,
        valor_descuento: Number(cupon.valor_descuento),
      },
      descuento,
      monto_final: monto_compra - descuento,
    };
  }

  /**
   * Aplicar cupón (incrementar usos)
   */
  async aplicar(codigo: string) {
    const cupon = await this.prisma.cupon.findUnique({
      where: { codigo: codigo.toUpperCase() },
    });

    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    return this.prisma.cupon.update({
      where: { id: cupon.id },
      data: {
        usos_actuales: { increment: 1 },
      },
    });
  }
}
