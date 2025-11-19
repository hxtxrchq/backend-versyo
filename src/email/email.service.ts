import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail = process.env.GMAIL_USER || 'versyostore@gmail.com';

  constructor() {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      this.logger.warn('GMAIL_USER o GMAIL_APP_PASSWORD no configurados en variables de entorno');
    }

    // Configurar transportador de Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });
  }

  /**
   * Obtener la ruta correcta del logo
   * Busca primero en la carpeta dist (producción) y luego en src (desarrollo)
   */
  private getLogoPath(): string {
    // Intentar en dist primero (producción)
    const distPath = path.join(process.cwd(), 'dist', 'src', 'public', 'images', 'logo.png');
    if (fs.existsSync(distPath)) {
      return distPath;
    }

    // Intentar en src (desarrollo)
    const srcPath = path.join(process.cwd(), 'src', 'public', 'images', 'logo.png');
    if (fs.existsSync(srcPath)) {
      return srcPath;
    }

    // Si no existe en ningún lado, devolver la ruta de src y loguear advertencia
    this.logger.warn('Logo no encontrado en ninguna ubicación, usando ruta por defecto');
    return srcPath;
  }

  /**
   * Obtener template base HTML con los colores de Versyo
   */
  private getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Versyo Store</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #40b1a9 0%, #0c3434 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.6;
    }
    .content h2 {
      color: #0c3434;
      margin-top: 0;
    }
    .content p {
      font-size: 16px;
      margin: 15px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 30px;
      background: linear-gradient(135deg, #40b1a9 0%, #287474 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
      transition: all 0.3s ease;
    }
    .button:hover {
      background: linear-gradient(135deg, #2c7c74 0%, #144c4c 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(40, 177, 169, 0.3);
    }
    .footer {
      background-color: #0c3434;
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
      font-size: 14px;
    }
    .footer a {
      color: #40b1a9;
      text-decoration: none;
    }
    .divider {
      border-top: 2px solid #40b1a9;
      margin: 30px 0;
    }
    strong {
      color: #206561;
    }
    .highlight-box {
      background-color: #f0fffe;
      border-left: 4px solid #40b1a9;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="cid:logo" alt="Versyo Store" class="logo" />
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>Versyo Store</strong></p>
      <p>Tu tienda de confianza</p>
      <p>
        <a href="${process.env.FRONTEND_URL}">Visitar tienda</a> |
        <a href="${process.env.FRONTEND_URL}/contacto">Contacto</a> |
        <a href="${process.env.FRONTEND_URL}/politicas">Políticas</a>
      </p>
      <p style="font-size: 12px; margin-top: 20px; color: #888;">
        © ${new Date().getFullYear()} Versyo Store. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Enviar email de confirmación de pedido
   */
  async enviarConfirmacionPedido(
    emailDestino: string,
    nombreCliente: string,
    numeroPedido: string,
  ): Promise<void> {
    try {
      const logoPath = this.getLogoPath();
      const pedidosUrl = process.env.FRONTEND_PEDIDOS_URL || `${process.env.FRONTEND_URL}/mis-pedidos`;

      const content = `
        <h2>🎉 ¡Pedido Confirmado!</h2>
        <p>Hola <strong>${nombreCliente}</strong>,</p>
        <p>Gracias por confiar en nosotros. Tu pedido <strong>#${numeroPedido}</strong> ha sido confirmado con éxito. 🎉</p>
        
        <div class="highlight-box">
          <p><strong>Número de Pedido:</strong> #${numeroPedido}</p>
          <p><strong>Estado:</strong> Confirmado ✅</p>
        </div>

        <p>Te notificaremos cuando tu pedido sea enviado. Si necesitas ayuda, no dudes en contactarnos.</p>
        
        <div style="text-align: center;">
          <a href="${pedidosUrl}" class="button">Ver mi pedido</a>
        </div>

        <div class="divider"></div>
        
        <p style="font-size: 14px; color: #666;">
          Este es un correo automático. Si tienes alguna duda, puedes contactarnos a través de nuestro sitio web.
        </p>
      `;

      const mailOptions = {
        from: `Versyo Store <${this.fromEmail}>`,
        to: emailDestino,
        subject: `✅ Pedido #${numeroPedido} confirmado - Versyo`,
        html: this.getBaseTemplate(content),
        attachments: [
          {
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de confirmación enviado a ${emailDestino} para pedido #${numeroPedido}`);
    } catch (error) {
      this.logger.error(`Error al enviar email de confirmación: ${error.message}`);
      // No lanzamos error para no bloquear el flujo del pedido
    }
  }

  /**
   * Enviar email de envío de pedido (con tracking) - Olva Courier
   */
  async enviarNotificacionEnvio(
    emailDestino: string,
    nombreCliente: string,
    numeroPedido: string,
    agenciaEnvio: string,
    codigoTracking: string,
  ): Promise<void> {
    try {
      const logoPath = this.getLogoPath();
      const pedidosUrl = process.env.FRONTEND_PEDIDOS_URL || `${process.env.FRONTEND_URL}/mis-pedidos`;

      const content = `
        <h2>🚚 ¡Tu Pedido Está en Camino!</h2>
        <p>Hola <strong>${nombreCliente}</strong>,</p>
        <p>Nos complace informarte que tu pedido <strong>#${numeroPedido}</strong> ya ha sido enviado 🚚.</p>
        
        <div class="highlight-box">
          <p><strong>Número de Pedido:</strong> #${numeroPedido}</p>
          <p><strong>Agencia de Envío:</strong> Olva Courier</p>
          <p><strong>Código de Seguimiento:</strong> <span style="font-size: 18px; color: #40b1a9; font-weight: bold;">${codigoTracking}</span></p>
        </div>

        <p>Puedes rastrear tu paquete usando ese código en el sitio web de la agencia de envío.</p>
        
        <div style="text-align: center;">
          <a href="${pedidosUrl}" class="button">Rastrear mi envío</a>
        </div>

        <div class="divider"></div>
        
        <p style="font-size: 14px; color: #666;">
          Si tienes alguna duda sobre tu envío, no dudes en contactarnos.
        </p>
      `;

      const mailOptions = {
        from: `Versyo Store <${this.fromEmail}>`,
        to: emailDestino,
        subject: `🚚 Pedido #${numeroPedido} en camino - Versyo`,
        html: this.getBaseTemplate(content),
        attachments: [
          {
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de envío enviado a ${emailDestino} para pedido #${numeroPedido}`);
    } catch (error) {
      this.logger.error(`Error al enviar email de envío: ${error.message}`);
    }
  }

  /**
   * Enviar email de verificación de cuenta
   */
  async enviarVerificacionEmail(
    emailDestino: string,
    nombreUsuario: string,
    tokenVerificacion: string,
  ): Promise<void> {
    const urlVerificacion = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email/${tokenVerificacion}`;
    const logoPath = this.getLogoPath();

    const content = `
      <h2>✉️ Verifica tu cuenta</h2>
      <p>Hola <strong>${nombreUsuario}</strong>,</p>
      <p>Gracias por registrarte en <strong>Versyo</strong>. Para completar tu registro, por favor verifica tu dirección de correo electrónico.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${urlVerificacion}" class="button">Valida aquí tu cuenta</a>
      </div>

      <div class="highlight-box">
        <p style="margin: 0; font-size: 14px;">Este enlace expira en 24 horas por razones de seguridad.</p>
      </div>

      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #666;">
        Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
        <a href="${urlVerificacion}" style="color: #40b1a9; word-break: break-all;">${urlVerificacion}</a>
      </p>
      
      <p style="font-size: 14px; color: #999; margin-top: 20px;">
        Si no solicitaste esta verificación, puedes ignorar este correo.
      </p>
    `;

    try {
      const mailOptions = {
        from: `Versyo Store <${this.fromEmail}>`,
        to: emailDestino,
        subject: '✉️ Verifica tu cuenta en Versyo',
        html: this.getBaseTemplate(content),
        attachments: [
          {
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de verificación enviado a ${emailDestino}`);
    } catch (error) {
      this.logger.error(`Error al enviar email de verificación: ${error.message}`);
      throw error; // En este caso sí lanzamos el error porque es crítico
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  async enviarRecuperacionContrasena(
    emailDestino: string,
    nombreUsuario: string,
    tokenRecuperacion: string,
  ): Promise<void> {
    const urlRecuperacion = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password/${tokenRecuperacion}`;
    const logoPath = this.getLogoPath();

    const content = `
      <h2>🔒 Recuperación de Contraseña</h2>
      <p>Hola <strong>${nombreUsuario}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en <strong>Versyo</strong>.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${urlRecuperacion}" class="button">Restablecer Contraseña</a>
      </div>

      <div class="highlight-box" style="background-color: #fff3cd; border-left-color: #ffc107;">
        <p style="margin: 0;"><strong>⚠️ Importante:</strong> Este enlace expira en 1 hora por razones de seguridad.</p>
      </div>

      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #666;">
        Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
        <a href="${urlRecuperacion}" style="color: #40b1a9; word-break: break-all;">${urlRecuperacion}</a>
      </p>
      
      <p style="font-size: 14px; color: #999; margin-top: 20px;">
        <strong>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</strong>
      </p>
    `;

    try {
      const mailOptions = {
        from: `Versyo Store <${this.fromEmail}>`,
        to: emailDestino,
        subject: '🔒 Recuperación de contraseña - Versyo',
        html: this.getBaseTemplate(content),
        attachments: [
          {
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de recuperación enviado a ${emailDestino}`);
    } catch (error) {
      this.logger.error(`Error al enviar email de recuperación: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enviar email de bienvenida después de verificar cuenta
   */
  async enviarBienvenida(
    emailDestino: string,
    nombreUsuario: string,
  ): Promise<void> {
    const logoPath = this.getLogoPath();

    const content = `
      <h2>🎉 ¡Bienvenido a Versyo!</h2>
      <p>Hola <strong>${nombreUsuario}</strong>,</p>
      <p>¡Tu cuenta ha sido verificada con éxito! Ya puedes disfrutar de todas las funcionalidades de Versyo.</p>
      
      <div class="highlight-box">
        <p style="margin: 0;">✅ <strong>Cuenta activada</strong> - Ya puedes realizar compras y disfrutar de promociones exclusivas.</p>
      </div>

      <p>Estamos emocionados de tenerte con nosotros. Explora nuestra colección y encuentra lo que buscas.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Explorar Productos</a>
      </div>

      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #666;">
        Si tienes alguna pregunta, nuestro equipo está aquí para ayudarte.
      </p>
    `;

    try {
      const mailOptions = {
        from: `Versyo Store <${this.fromEmail}>`,
        to: emailDestino,
        subject: '🎉 ¡Bienvenido a Versyo!',
        html: this.getBaseTemplate(content),
        attachments: [
          {
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de bienvenida enviado a ${emailDestino}`);
    } catch (error) {
      this.logger.error(`Error al enviar email de bienvenida: ${error.message}`);
    }
  }
}
