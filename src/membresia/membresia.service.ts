import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SolicitarMembresiaDto } from './dto/solicitar-membresia.dto';
import { ConfirmarMembresiaDto } from './dto/confirmar-membresia.dto';

@Injectable()
export class MembresiaService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Solicitar membresía - Usuario envía su email para recibir instrucciones de pago
   */
  async solicitarMembresia(
    usuarioId: number,
    data: SolicitarMembresiaDto,
  ) {
    // Verificar que el usuario existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si ya tiene membresía
    if (usuario.tiene_membresia) {
      throw new ConflictException('Ya tienes una membresía activa');
    }

    // Verificar si ya tiene una solicitud pendiente
    const solicitudPendiente = await this.prisma.solicitud_membresia.findFirst({
      where: {
        usuario_id: usuarioId,
        estado: 'pendiente',
      },
    });

    if (solicitudPendiente) {
      throw new ConflictException(
        'Ya tienes una solicitud de membresía pendiente. Revisa tu correo para las instrucciones de pago.',
      );
    }

    // Usar el email del usuario si no se proporciona uno
    const emailDestino = data.email || usuario.email;

    // Crear nueva solicitud
    const solicitud = await this.prisma.solicitud_membresia.create({
      data: {
        usuario_id: usuarioId,
        email_solicitante: emailDestino,
        estado: 'pendiente',
      },
    });

    // Enviar email con instrucciones de pago
    await this.emailService.enviarInstruccionesMembresia(
      emailDestino,
      usuario.nombre,
    );

    return {
      success: true,
      message:
        'Solicitud creada exitosamente. Revisa tu correo para las instrucciones de pago.',
      solicitud: {
        id: solicitud.id,
        estado: solicitud.estado,
        email: solicitud.email_solicitante,
        creado_en: solicitud.creado_en,
      },
    };
  }

  /**
   * Confirmar pago de membresía (Admin)
   * El admin recibe el comprobante por email y confirma manualmente
   */
  async confirmarMembresia(data: ConfirmarMembresiaDto) {
    // Buscar la solicitud
    const solicitud = await this.prisma.solicitud_membresia.findUnique({
      where: { id: data.solicitudId },
      include: { usuario: true },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud de membresía no encontrada');
    }

    if (solicitud.estado !== 'pendiente') {
      throw new BadRequestException(
        'Esta solicitud ya fue procesada anteriormente',
      );
    }

    // Actualizar usuario con membresía
    await this.prisma.usuario.update({
      where: { id: solicitud.usuario_id },
      data: {
        tiene_membresia: true,
        fecha_membresia: new Date(),
      },
    });

    // Actualizar solicitud
    await this.prisma.solicitud_membresia.update({
      where: { id: data.solicitudId },
      data: {
        estado: 'confirmada',
        boleta_url: data.boletaUrl,
        comprobante_enviado: true,
        procesado_en: new Date(),
      },
    });

    // Enviar email de confirmación al usuario
    await this.emailService.enviarConfirmacionMembresia(
      solicitud.email_solicitante,
      solicitud.usuario.nombre,
    );

    return {
      success: true,
      message: 'Membresía confirmada exitosamente',
      usuario: {
        id: solicitud.usuario.id,
        nombre: solicitud.usuario.nombre,
        email: solicitud.usuario.email,
        tiene_membresia: true,
      },
    };
  }

  /**
   * Rechazar solicitud de membresía (Admin)
   */
  async rechazarMembresia(solicitudId: number, motivo?: string) {
    const solicitud = await this.prisma.solicitud_membresia.findUnique({
      where: { id: solicitudId },
      include: { usuario: true },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud de membresía no encontrada');
    }

    if (solicitud.estado !== 'pendiente') {
      throw new BadRequestException('Esta solicitud ya fue procesada');
    }

    await this.prisma.solicitud_membresia.update({
      where: { id: solicitudId },
      data: {
        estado: 'rechazada',
        procesado_en: new Date(),
      },
    });

    return {
      success: true,
      message: 'Solicitud rechazada',
    };
  }

  /**
   * Listar todas las solicitudes de membresía (Admin)
   */
  async listarSolicitudes(estado?: string) {
    const where = estado ? { estado } : {};

    const solicitudes = await this.prisma.solicitud_membresia.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            tiene_membresia: true,
          },
        },
      },
      orderBy: {
        creado_en: 'desc',
      },
    });

    return solicitudes.map((solicitud) => ({
      id: solicitud.id,
      email_solicitante: solicitud.email_solicitante,
      estado: solicitud.estado,
      comprobante_enviado: solicitud.comprobante_enviado,
      boleta_url: solicitud.boleta_url,
      creado_en: solicitud.creado_en,
      procesado_en: solicitud.procesado_en,
      usuario: solicitud.usuario,
    }));
  }

  /**
   * Obtener solicitudes del usuario autenticado
   */
  async misSolicitudes(usuarioId: number) {
    const solicitudes = await this.prisma.solicitud_membresia.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { creado_en: 'desc' },
    });

    return solicitudes.map((solicitud) => ({
      id: solicitud.id,
      email: solicitud.email_solicitante,
      estado: solicitud.estado,
      comprobante_enviado: solicitud.comprobante_enviado,
      creado_en: solicitud.creado_en,
      procesado_en: solicitud.procesado_en,
    }));
  }

  /**
   * Verificar si un usuario tiene membresía activa
   */
  async verificarMembresia(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        email: true,
        tiene_membresia: true,
        fecha_membresia: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      tiene_membresia: usuario.tiene_membresia,
      fecha_membresia: usuario.fecha_membresia,
    };
  }
}
