import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
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

  /**
   * Obtener perfil del usuario autenticado
   */
  async obtenerPerfil(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        dni: true,
        direccion: true,
        email_verificado: true,
        rol: true,
        creado_en: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Actualizar perfil del usuario autenticado
   */
  async actualizarPerfil(usuarioId: number, data: ActualizarPerfilDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si intenta cambiar el email, verificar que no esté en uso
    if (data.email && data.email !== usuario.email) {
      const emailExiste = await this.prisma.usuario.findUnique({
        where: { email: data.email },
      });

      if (emailExiste) {
        throw new BadRequestException('El email ya está en uso');
      }

      // Si cambia el email, marcar como no verificado
      data['email_verificado'] = false;
    }

    // Si intenta cambiar el DNI, verificar que no esté en uso
    if (data.dni && data.dni !== usuario.dni) {
      const dniExiste = await this.prisma.usuario.findFirst({
        where: { dni: data.dni },
      });

      if (dniExiste) {
        throw new BadRequestException('El DNI ya está en uso');
      }
    }

    const usuarioActualizado = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        dni: true,
        direccion: true,
        email_verificado: true,
        rol: true,
        creado_en: true,
      },
    });

    return usuarioActualizado;
  }

  /**
   * Cambiar contraseña del usuario autenticado
   */
  async cambiarContrasena(usuarioId: number, data: CambiarContrasenaDto) {
    if (data.nuevaContrasena !== data.confirmarContrasena) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const contrasenaValida = await bcrypt.compare(
      data.contrasenaActual,
      usuario.contrasena,
    );

    if (!contrasenaValida) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const esIgual = await bcrypt.compare(data.nuevaContrasena, usuario.contrasena);
    if (esIgual) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(data.nuevaContrasena, 10);

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { contrasena: hashedPassword },
    });

    // Revocar todos los refresh tokens por seguridad
    await this.prisma.refresh_token.updateMany({
      where: { usuario_id: usuarioId },
      data: { revocado: true },
    });

    return {
      mensaje: 'Contraseña actualizada exitosamente',
    };
  }

  /**
   * Eliminar cuenta del usuario autenticado
   */
  async eliminarCuenta(usuarioId: number, contrasena: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña para confirmar eliminación
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!contrasenaValida) {
      throw new UnauthorizedException(
        'Contraseña incorrecta. No se puede eliminar la cuenta.',
      );
    }

    // Eliminar usuario (cascade eliminará sus relaciones)
    await this.prisma.usuario.delete({
      where: { id: usuarioId },
    });

    return {
      mensaje: 'Cuenta eliminada exitosamente',
    };
  }
}
