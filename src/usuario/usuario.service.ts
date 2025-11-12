import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async crear(data: CrearUsuarioDto) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.contrasena, saltRounds);

    const usuario = await this.prisma.usuario.create({
      data: {
        ...data,
        contrasena: hashedPassword,
      },
    });

    // no devolvemos la contraseña
    const { contrasena, ...resto } = usuario;
    return resto;
  }

  async listar() {
    const usuarios = await this.prisma.usuario.findMany();
    return usuarios.map(({ contrasena, ...resto }) => resto);
  }

  async buscarPorId(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) return null;
    const { contrasena, ...resto } = usuario;
    return resto;
  }

  async actualizar(id: number, data: ActualizarUsuarioDto) {
    if (data.contrasena) {
      const saltRounds = 10;
      data.contrasena = await bcrypt.hash(data.contrasena, saltRounds);
    }

    const usuario = await this.prisma.usuario.update({
      where: { id },
      data,
    });

    const { contrasena, ...resto } = usuario;
    return resto;
  }

  async eliminar(id: number) {
    return this.prisma.usuario.delete({ where: { id } });
  }
}
