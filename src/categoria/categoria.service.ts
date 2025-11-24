import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';

@Injectable()
export class CategoriaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Genera un identificador único a partir del nombre
   */
  private generarIdentificador(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
      .trim()
      .replace(/\s+/g, '-'); // Reemplazar espacios por guiones
  }

  async crear(data: CrearCategoriaDto) {
    const identificador = this.generarIdentificador(data.nombre);
    
    // Verificar si el identificador ya existe
    const existente = await this.prisma.categoria.findUnique({
      where: { identificador },
    });

    if (existente) {
      // Agregar un número al final para hacerlo único
      const timestamp = Date.now();
      return this.prisma.categoria.create({
        data: {
          ...data,
          identificador: `${identificador}-${timestamp}`,
        },
      });
    }

    return this.prisma.categoria.create({
      data: {
        ...data,
        identificador,
      },
    });
  }

  listar() {
    return this.prisma.categoria.findMany();
  }

  buscarPorId(id: number) {
    return this.prisma.categoria.findUnique({ where: { id } });
  }

  actualizar(id: number, data: ActualizarCategoriaDto) {
    return this.prisma.categoria.update({ where: { id }, data });
  }

  eliminar(id: number) {
    return this.prisma.categoria.delete({ where: { id } });
  }
}
