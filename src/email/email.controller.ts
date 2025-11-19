import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * POST /email/test/confirmacion
   * Endpoint de prueba para enviar email de confirmación de pedido
   */
  @Post('test/confirmacion')
  @Public()
  async testConfirmacion(
    @Body()
    body: {
      email: string;
      nombreCliente: string;
      numeroPedido: string;
    },
  ) {
    await this.emailService.enviarConfirmacionPedido(
      body.email,
      body.nombreCliente,
      body.numeroPedido,
    );

    return {
      success: true,
      message: `Email de confirmación enviado a ${body.email}`,
    };
  }

  /**
   * POST /email/test/envio
   * Endpoint de prueba para enviar email de notificación de envío
   */
  @Post('test/envio')
  @Public()
  async testEnvio(
    @Body()
    body: {
      email: string;
      nombreCliente: string;
      numeroPedido: string;
      codigoTracking: string;
    },
  ) {
    await this.emailService.enviarNotificacionEnvio(
      body.email,
      body.nombreCliente,
      body.numeroPedido,
      'Olva Courier',
      body.codigoTracking,
    );

    return {
      success: true,
      message: `Email de envío enviado a ${body.email}`,
    };
  }

  /**
   * POST /email/test/verificacion
   * Endpoint de prueba para enviar email de verificación de cuenta
   */
  @Post('test/verificacion')
  @Public()
  async testVerificacion(
    @Body()
    body: {
      email: string;
      nombreUsuario: string;
      token: string;
    },
  ) {
    await this.emailService.enviarVerificacionEmail(
      body.email,
      body.nombreUsuario,
      body.token,
    );

    return {
      success: true,
      message: `Email de verificación enviado a ${body.email}`,
    };
  }

  /**
   * POST /email/test/bienvenida
   * Endpoint de prueba para enviar email de bienvenida
   */
  @Post('test/bienvenida')
  @Public()
  async testBienvenida(
    @Body()
    body: {
      email: string;
      nombreUsuario: string;
    },
  ) {
    await this.emailService.enviarBienvenida(body.email, body.nombreUsuario);

    return {
      success: true,
      message: `Email de bienvenida enviado a ${body.email}`,
    };
  }
}
