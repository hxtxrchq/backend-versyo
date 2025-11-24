import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  /**
   * Registro de usuario con envío de email de verificación
   */
  async register(data: RegisterDto) {
    const existe = await this.prisma.usuario.findUnique({
      where: { email: data.email },
    });
    if (existe) throw new BadRequestException('Este correo electrónico ya está registrado. Por favor, inicia sesión.');

    const hashed = await bcrypt.hash(data.contrasena, 10);

    const nuevoUsuario = await this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        contrasena: hashed,
        telefono: data.telefono,
        rol: 'cliente',
        email_verificado: false,
      },
    });

    // Generar token de verificación
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');
    const expiraEn = new Date();
    expiraEn.setHours(expiraEn.getHours() + 24); // 24 horas

    await this.prisma.email_verification_token.create({
      data: {
        usuario_id: nuevoUsuario.id,
        token: tokenVerificacion,
        expira_en: expiraEn,
      },
    });

    // Enviar email de verificación
    await this.emailService.enviarVerificacionEmail(
      nuevoUsuario.email,
      nuevoUsuario.nombre,
      tokenVerificacion,
    );

    // Generar access token y refresh token
    const payload = {
      id: nuevoUsuario.id,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generarRefreshToken(nuevoUsuario.id);

    return {
      accessToken,
      refreshToken,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        email_verificado: nuevoUsuario.email_verificado,
      },
      mensaje: 'Registro exitoso. Por favor verifica tu email.',
    };
  }

  /**
   * Login de usuario con generación de refresh token
   */
  async login(data: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (!usuario) throw new UnauthorizedException('El correo electrónico no está registrado');

    const valid = await bcrypt.compare(data.contrasena, usuario.contrasena);
    if (!valid) throw new UnauthorizedException('Contraseña incorrecta');

    // Generar access token y refresh token
    const payload = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generarRefreshToken(usuario.id);

    return {
      accessToken,
      refreshToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        email_verificado: usuario.email_verificado,
      },
    };
  }

  /**
   * Verificar email del usuario
   */
  async verificarEmail(token: string) {
    const tokenRecord = await this.prisma.email_verification_token.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Token de verificación inválido');
    }

    if (new Date() > tokenRecord.expira_en) {
      throw new BadRequestException('Token de verificación expirado');
    }

    if (tokenRecord.usuario.email_verificado) {
      throw new BadRequestException('El email ya ha sido verificado');
    }

    // Actualizar usuario como verificado
    await this.prisma.usuario.update({
      where: { id: tokenRecord.usuario_id },
      data: { email_verificado: true },
    });

    // Eliminar token usado
    await this.prisma.email_verification_token.delete({
      where: { id: tokenRecord.id },
    });

    // Enviar email de bienvenida
    await this.emailService.enviarBienvenida(
      tokenRecord.usuario.email,
      tokenRecord.usuario.nombre,
    );

    return {
      mensaje: 'Email verificado exitosamente',
      email_verificado: true,
    };
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async solicitarRecuperacionContrasena(data: ForgotPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (!usuario) {
      // Por seguridad, no revelar si el email existe o no
      return {
        mensaje:
          'Si el email existe, recibirás un correo con instrucciones para recuperar tu contraseña.',
      };
    }

    // Generar token de recuperación
    const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
    const expiraEn = new Date();
    expiraEn.setHours(expiraEn.getHours() + 1); // 1 hora

    await this.prisma.password_reset_token.create({
      data: {
        usuario_id: usuario.id,
        token: tokenRecuperacion,
        expira_en: expiraEn,
        usado: false,
      },
    });

    // Enviar email de recuperación
    await this.emailService.enviarRecuperacionContrasena(
      usuario.email,
      usuario.nombre,
      tokenRecuperacion,
    );

    return {
      mensaje:
        'Si el email existe, recibirás un correo con instrucciones para recuperar tu contraseña.',
    };
  }

  /**
   * Restablecer contraseña con token
   */
  async restablecerContrasena(token: string, data: ResetPasswordDto) {
    if (data.contrasena !== data.confirmarContrasena) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const tokenRecord = await this.prisma.password_reset_token.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Token de recuperación inválido');
    }

    if (new Date() > tokenRecord.expira_en) {
      throw new BadRequestException('Token de recuperación expirado');
    }

    if (tokenRecord.usado) {
      throw new BadRequestException('Token de recuperación ya utilizado');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(data.contrasena, 10);

    // Actualizar contraseña
    await this.prisma.usuario.update({
      where: { id: tokenRecord.usuario_id },
      data: { contrasena: hashedPassword },
    });

    // Marcar token como usado
    await this.prisma.password_reset_token.update({
      where: { id: tokenRecord.id },
      data: { usado: true },
    });

    // Revocar todos los refresh tokens del usuario por seguridad
    await this.prisma.refresh_token.updateMany({
      where: { usuario_id: tokenRecord.usuario_id },
      data: { revocado: true },
    });

    return {
      mensaje: 'Contraseña restablecida exitosamente',
    };
  }

  /**
   * Generar refresh token para el usuario
   */
  async generarRefreshToken(usuarioId: number): Promise<string> {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 30); // 30 días

    await this.prisma.refresh_token.create({
      data: {
        usuario_id: usuarioId,
        token: refreshToken,
        expira_en: expiraEn,
        revocado: false,
      },
    });

    return refreshToken;
  }

  /**
   * Renovar access token usando refresh token
   */
  async renovarAccessToken(refreshToken: string) {
    const tokenRecord = await this.prisma.refresh_token.findUnique({
      where: { token: refreshToken },
      include: { usuario: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (tokenRecord.revocado) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    if (new Date() > tokenRecord.expira_en) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Generar nuevo access token
    const payload = {
      id: tokenRecord.usuario.id,
      email: tokenRecord.usuario.email,
      rol: tokenRecord.usuario.rol,
    };
    const nuevoAccessToken = this.jwtService.sign(payload);

    // Implementar rotación de refresh tokens (opcional pero recomendado)
    // Revocar el refresh token actual y generar uno nuevo
    await this.prisma.refresh_token.update({
      where: { id: tokenRecord.id },
      data: { revocado: true },
    });

    const nuevoRefreshToken = await this.generarRefreshToken(
      tokenRecord.usuario.id,
    );

    return {
      accessToken: nuevoAccessToken,
      refreshToken: nuevoRefreshToken,
    };
  }

  /**
   * Logout: revocar refresh token
   */
  async logout(refreshToken: string) {
    const tokenRecord = await this.prisma.refresh_token.findUnique({
      where: { token: refreshToken },
    });

    if (tokenRecord) {
      await this.prisma.refresh_token.update({
        where: { id: tokenRecord.id },
        data: { revocado: true },
      });
    }

    return { mensaje: 'Sesión cerrada correctamente' };
  }

  /**
   * Enviar código de verificación de 6 dígitos por email
   */
  async enviarCodigoVerificacion(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.email_verificado) {
      throw new BadRequestException('El email ya está verificado');
    }

    // Generar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEn = new Date();
    expiraEn.setMinutes(expiraEn.getMinutes() + 15); // Expira en 15 minutos

    // Guardar código en la base de datos
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        codigo_verificacion: codigo,
        codigo_verificacion_exp: expiraEn,
      },
    });

    // Enviar email con el código
    await this.emailService.enviarCodigoVerificacion(
      usuario.email,
      usuario.nombre,
      codigo,
    );

    return {
      mensaje: 'Código de verificación enviado a tu email',
      expiraEn: expiraEn.toISOString(),
    };
  }

  /**
   * Verificar código de 6 dígitos
   */
  async verificarCodigo(usuarioId: number, codigo: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.email_verificado) {
      throw new BadRequestException('El email ya está verificado');
    }

    if (!usuario.codigo_verificacion || !usuario.codigo_verificacion_exp) {
      throw new BadRequestException(
        'No hay código de verificación. Solicita uno nuevo.',
      );
    }

    if (new Date() > usuario.codigo_verificacion_exp) {
      throw new BadRequestException(
        'El código ha expirado. Solicita uno nuevo.',
      );
    }

    if (usuario.codigo_verificacion !== codigo) {
      throw new BadRequestException('Código incorrecto');
    }

    // Marcar email como verificado y limpiar código
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        email_verificado: true,
        codigo_verificacion: null,
        codigo_verificacion_exp: null,
      },
    });

    return {
      mensaje: 'Email verificado correctamente',
      email_verificado: true,
    };
  }
}
