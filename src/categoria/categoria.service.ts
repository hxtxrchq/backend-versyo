import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';

@Injectable()
export class CategoriaService {
  constructor(private prisma: PrismaService) {}

  crear(data: CrearCategoriaDto) {
    return this.prisma.categoria.create({ data });
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
