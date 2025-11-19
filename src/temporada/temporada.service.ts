import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearTemporadaDto } from './dto/crear-temporada.dto';
import { ActualizarTemporadaDto } from './dto/actualizar-temporada.dto';

@Injectable()
export class TemporadaService {
  constructor(private prisma: PrismaService) {}

  crear(data: CrearTemporadaDto) {
  const inicio = data.inicio ? new Date(data.inicio) : null;
  const fin = data.fin ? new Date(data.fin) : null;

  return this.prisma.temporada.create({
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion,
      activo: data.activo ?? true,
      inicio,
      fin,
    },
  });
}


  listar() {
    return this.prisma.temporada.findMany();
  }

  buscarPorId(id: number) {
    return this.prisma.temporada.findUnique({ where: { id } });
  }

  actualizar(id: number, data: ActualizarTemporadaDto) {
    return this.prisma.temporada.update({ where: { id }, data });
  }

  eliminar(id: number) {
    return this.prisma.temporada.delete({ where: { id } });
  }
}
