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
  private readonly isConfigured: boolean;

  constructor() {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    this.isConfigured = !!(gmailUser && gmailPassword);

    if (!this.isConfigured) {
      this.logger.warn('⚠️ GMAIL_USER o GMAIL_APP_PASSWORD no configurados. Los emails no se enviarán (modo desarrollo).');
      // Crear un transporter "dummy" que no falla pero tampoco envía
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
      });
    } else {
      // Configurar transportador de Gmail
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPassword,
        },
      });
      this.logger.log('✅ Email service configurado correctamente');
    }
  }

  /**
   * Verificar si el servicio de email está configurado
   */
  private checkEmailConfig(metodo: string): boolean {
    if (!this.isConfigured) {
      this.logger.warn(`[${metodo}] Email no configurado - operación omitida`);
      return false;
    }
    return true;
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
    if (!this.checkEmailConfig('enviarConfirmacionPedido')) {
      this.logger.log(`📧 [DEV] Confirmación de pedido omitida para ${emailDestino}`);
      return;
    }

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
    if (!this.checkEmailConfig('enviarVerificacionEmail')) {
      this.logger.log(`📧 [DEV] Verificación de email omitida para ${emailDestino}`);
      return;
    }

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
    if (!this.checkEmailConfig('enviarRecuperacionContrasena')) {
      this.logger.log(`📧 [DEV] Recuperación de contraseña omitida para ${emailDestino}`);
      return;
    }

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
   * Enviar código de verificación de 6 dígitos por email
   */
  async enviarCodigoVerificacion(
    emailDestino: string,
    nombreUsuario: string,
    codigo: string,
  ): Promise<void> {
    const logoPath = this.getLogoPath();

    const content = `
      <h2>🔐 Código de Verificación</h2>
      <p>Hola <strong>${nombreUsuario}</strong>,</p>
      <p>Has solicitado verificar tu cuenta en <strong>Versyo</strong>. Utiliza el siguiente código de verificación:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="background: linear-gradient(135deg, #40b1a9 0%, #287474 100%); display: inline-block; padding: 20px 40px; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">${codigo}</span>
        </div>
      </div>

      <div class="highlight-box" style="background-color: #fff3cd; border-left-color: #ffc107;">
        <p style="margin: 0;"><strong>⚠️ Este código expira en 15 minutos</strong></p>
      </div>

      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #666;">
        Ingresa este código en la página de verificación para activar tu cuenta.
      </p>
      
      <p style="font-size: 14px; color: #999; margin-top: 20px;">
        Si no solicitaste este código, puedes ignorar este correo de forma segura.
      </p>
    `;

    // Si no hay configuración de email, solo loguear y retornar
    if (!this.checkEmailConfig('enviarCodigoVerificacion')) {
      this.logger.log(`📧 [DEV] Código de verificación para ${emailDestino}: ${codigo}`);
      return;
    }

    try {
      const mailOptions = {
        from: `Versyo Store <${this.fromEmail}>`,
        to: emailDestino,
        subject: '🔐 Código de verificación - Versyo',
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
      this.logger.log(`Código de verificación enviado a ${emailDestino}`);
    } catch (error) {
      this.logger.error(`Error al enviar código de verificación: ${error.message}`);
      // No lanzar error para no bloquear el flujo, solo loguear
      this.logger.warn(`Email no enviado, pero proceso continúa. Configura GMAIL_USER y GMAIL_APP_PASSWORD para habilitar emails.`);
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

  /**
   * Enviar instrucciones de membresía con QR de pago
   */
  async enviarInstruccionesMembresia(emailDestino: string, nombreUsuario: string): Promise<void> {
    try {
      const content = `
        <h2>¡Hola ${nombreUsuario}! 👋</h2>
        
        <p>Para poder adquirir tu <strong>Membresía Versyo</strong> deberás realizar un pago de:</p>
        
        <div class="highlight-box">
          <h3 style="margin: 0; color: #0c3434;">💳 Monto a pagar: S/ 60.00 soles</h3>
        </div>
        
        <p>Escanea el siguiente código QR para realizar el pago:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="cid:qr-membresia" alt="QR de Pago" style="max-width: 300px; border: 4px solid #40b1a9; border-radius: 8px;" />
        </div>
        
        <div class="divider"></div>
        
        <h3 style="color: #0c3434;">📋 Pasos siguientes:</h3>
        <ol style="font-size: 16px; line-height: 1.8;">
          <li>Realiza el pago escaneando el código QR con Yape</li>
          <li><strong>IMPORTANTE:</strong> En el mensaje de Yape escribe: <span style="background-color: #fff3cd; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Asunto: Membresia Versyo</span></li>
          <li>Una vez pagado, envía tu <strong>boleta o comprobante</strong> a este mismo correo: 
            <a href="mailto:versyostore@gmail.com" style="color: #40b1a9; font-weight: bold;">versyostore@gmail.com</a>
          </li>
          <li>Tu membresía será confirmada en un plazo de <strong>1 hora</strong> ⏱️</li>
        </ol>
        
        <div class="highlight-box">
          <h3 style="margin: 0 0 10px 0; color: #0c3434;">🎁 Beneficios de tu Membresía:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Acceso a contenido exclusivo para miembros</li>
            <li>Un montón de descuentos en productos seleccionados</li>
            <li>Ofertas especiales antes que nadie</li>
            <li>Membresía de por vida - ¡Pago único!</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px;">
          Si tienes alguna duda, no dudes en responder este correo. ¡Estamos aquí para ayudarte! 😊
        </p>
        
        <p style="margin-top: 30px;">
          <strong>Saludos cordiales,</strong><br>
          El equipo de Versyo Store
        </p>
      `;

      // Preparar attachments
      const attachments: any[] = [
        {
          filename: 'logo.png',
          path: this.getLogoPath(),
          cid: 'logo',
        },
      ];

      // Agregar QR solo si existe
      const qrPath = this.getQRPath();
      if (fs.existsSync(qrPath)) {
        attachments.push({
          filename: 'qr-membresia.png',
          path: qrPath,
          cid: 'qr-membresia',
        });
      } else {
        this.logger.warn('QR de membresía no encontrado, se enviará email sin QR');
      }

      const mailOptions = {
        from: `Versyo Store <${this.fromEmail}>`,
        to: emailDestino,
        subject: '💳 Instrucciones para Adquirir tu Membresía Versyo',
        html: this.getBaseTemplate(content),
        attachments,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de instrucciones de membresía enviado a ${emailDestino}`);
    } catch (error) {
      this.logger.error(`Error al enviar instrucciones de membresía: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enviar confirmación de membresía activada
   */
  async enviarConfirmacionMembresia(emailDestino: string, nombreUsuario: string): Promise<void> {
    try {
      const content = `
        <h2>¡Felicidades ${nombreUsuario}! 🎉</h2>
        
        <div class="highlight-box">
          <h3 style="margin: 0; color: #0c3434;">✅ Tu Membresía Versyo ha sido activada exitosamente</h3>
        </div>
        
        <p>Tu pago ha sido verificado y confirmado. Ahora eres parte de nuestra <strong>comunidad exclusiva de miembros</strong>.</p>
        
        <div class="divider"></div>
        
        <h3 style="color: #0c3434;">🎁 Beneficios que ahora tienes disponibles:</h3>
        <ul style="font-size: 16px; line-height: 1.8;">
          <li><strong>Acceso ilimitado</strong> a contenido exclusivo para miembros</li>
          <li><strong>Descuentos especiales</strong> en productos seleccionados</li>
          <li><strong>Ofertas VIP</strong> antes que nadie</li>
          <li><strong>Prioridad</strong> en soporte y atención</li>
        </ul>
        
        <div class="highlight-box" style="background-color: #fff5e6; border-left-color: #ff9800;">
          <p style="margin: 0; font-size: 16px;">
            <strong>🎊 ¡Recuerda!</strong> Tu membresía es <strong>de por vida</strong>. No tendrás que renovarla ni realizar pagos adicionales.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://versyo-store.com" class="button">Explorar Beneficios Ahora</a>
        </div>
        
        <p style="margin-top: 30px;">
          Gracias por confiar en Versyo Store. ¡Disfruta de todos los beneficios que hemos preparado para ti! 🌟
        </p>
        
        <p style="margin-top: 30px;">
          <strong>Saludos cordiales,</strong><br>
          El equipo de Versyo Store
        </p>
      `;

      const mailOptions = {
        from: `Versyo Store <${this.fromEmail}>`,
        to: emailDestino,
        subject: '🎉 ¡Tu Membresía Versyo está Activa!',
        html: this.getBaseTemplate(content),
        attachments: [
          {
            filename: 'logo.png',
            path: this.getLogoPath(),
            cid: 'logo',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de confirmación de membresía enviado a ${emailDestino}`);
    } catch (error) {
      this.logger.error(`Error al enviar confirmación de membresía: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener la ruta correcta del QR de membresía
   */
  private getQRPath(): string {
    // Intentar en dist primero (producción)
    const distPath = path.join(process.cwd(), 'dist', 'src', 'public', 'images', 'qr-membresia.png');
    if (fs.existsSync(distPath)) {
      return distPath;
    }

    // Intentar en src (desarrollo)
    const srcPath = path.join(process.cwd(), 'src', 'public', 'images', 'qr-membresia.png');
    if (fs.existsSync(srcPath)) {
      return srcPath;
    }

    // Si no existe, loguear advertencia y devolver ruta por defecto
    this.logger.warn('QR de membresía no encontrado, por favor agrega el archivo qr-membresia.png en src/public/images/');
    return srcPath;
  }

  /**
   * Enviar correo de contacto desde el formulario del sitio web
   */
  async enviarCorreoContacto(
    destinatario: string,
    nombreRemitente: string,
    emailRemitente: string,
    asunto: string,
    mensaje: string,
  ): Promise<void> {
    const content = `
      <h2>Nuevo Mensaje de Contacto</h2>
      <p><strong>De:</strong> ${nombreRemitente}</p>
      <p><strong>Email:</strong> ${emailRemitente}</p>
      <p><strong>Asunto:</strong> ${asunto}</p>
      <div style="margin-top: 20px; padding: 20px; background-color: #f9f9f9; border-left: 4px solid #40b1a9; border-radius: 4px;">
        <p style="white-space: pre-wrap;">${mensaje}</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
      <p style="font-size: 14px; color: #666666;">
        Este mensaje fue enviado desde el formulario de contacto de Versyo Store.
        Puedes responder directamente a <strong>${emailRemitente}</strong>
      </p>
    `;

    const htmlContent = this.getBaseTemplate(content);

    try {
      await this.transporter.sendMail({
        from: `"Versyo Store - Contacto" <${this.fromEmail}>`,
        to: destinatario,
        replyTo: emailRemitente,
        subject: `[Contacto] ${asunto}`,
        html: htmlContent,
      });

      this.logger.log(`Correo de contacto enviado a ${destinatario} desde ${emailRemitente}`);
    } catch (error) {
      this.logger.error('Error al enviar correo de contacto:', error);
      throw new Error('No se pudo enviar el mensaje de contacto');
    }
  }

  /**
   * Enviar notificación de nuevo pedido a la tienda
   */
  async enviarNotificacionNuevoPedido(pedidoData: {
    pedidoId: number;
    clienteNombre: string;
    clienteEmail: string;
    total: number;
    items: any[];
    direccion: string;
    telefono: string;
    metodoPago: string;
    voucherUrl?: string;
    notas?: string;
  }): Promise<void> {
    const itemsHtml = pedidoData.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${item.producto?.nombre || 'Producto'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.talla || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.color || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.cantidad}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">S/ ${(Number(item.precio_unitario) * item.cantidad).toFixed(2)}</td>
        </tr>
      `,
      )
      .join('');

    const voucherSection = pedidoData.voucherUrl
      ? `
      <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
        <h3 style="color: #0c3434; margin-top: 0;">Comprobante de Pago</h3>
        <p style="margin-bottom: 15px;"><strong>Método:</strong> ${pedidoData.metodoPago === 'yape' ? 'Yape' : 'Transferencia BCP'}</p>
        <div style="text-align: center;">
          <img src="${pedidoData.voucherUrl}" alt="Comprobante" style="max-width: 400px; width: 100%; height: auto; border-radius: 8px; border: 2px solid #40b1a9;" />
        </div>
        <p style="text-align: center; margin-top: 10px;">
          <a href="${pedidoData.voucherUrl}" target="_blank" style="color: #40b1a9; text-decoration: none;">Ver imagen completa</a>
        </p>
      </div>
    `
      : '';

    const notasSection = pedidoData.notas
      ? `
      <div style="margin-top: 20px; padding: 15px; background-color: #fff8e1; border-left: 4px solid #ffc107; border-radius: 4px;">
        <p style="margin: 0;"><strong>Notas del cliente:</strong></p>
        <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${pedidoData.notas}</p>
      </div>
    `
      : '';

    const content = `
      <h2 style="color: #0c3434;">🎉 Nuevo Pedido Recibido</h2>
      <div style="background-color: #e8f5f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #0c3434; margin-top: 0;">Pedido #${pedidoData.pedidoId}</h3>
        <p style="margin: 5px 0;"><strong>Cliente:</strong> ${pedidoData.clienteNombre}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${pedidoData.clienteEmail}</p>
        <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${pedidoData.telefono}</p>
        <p style="margin: 5px 0;"><strong>Total:</strong> <span style="font-size: 20px; color: #40b1a9; font-weight: bold;">S/ ${pedidoData.total.toFixed(2)}</span></p>
      </div>

      <div style="margin-top: 30px;">
        <h3 style="color: #0c3434;">Productos del Pedido</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #40b1a9;">Producto</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #40b1a9;">Talla</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #40b1a9;">Color</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #40b1a9;">Cant.</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #40b1a9;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
        <h3 style="color: #0c3434; margin-top: 0;">Dirección de Envío</h3>
        <p style="margin: 5px 0;">${pedidoData.direccion}</p>
      </div>

      ${voucherSection}
      ${notasSection}

      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
      <p style="font-size: 14px; color: #666666; text-align: center;">
        Accede al panel de administración para gestionar este pedido y confirmar el pago.
      </p>
    `;

    const htmlContent = this.getBaseTemplate(content);

    try {
      await this.transporter.sendMail({
        from: `"Versyo Store - Pedidos" <${this.fromEmail}>`,
        to: 'versyostore@gmail.com',
        subject: `🛍️ Nuevo Pedido #${pedidoData.pedidoId} - ${pedidoData.clienteNombre}`,
        html: htmlContent,
      });

      this.logger.log(`Notificación de pedido #${pedidoData.pedidoId} enviada a versyostore@gmail.com`);
    } catch (error) {
      this.logger.error('Error al enviar notificación de pedido:', error);
      // No lanzamos error para no bloquear la creación del pedido
    }
  }

  /**
   * Enviar confirmación de pedido al cliente
   */
  async enviarConfirmacionPedidoCliente(pedidoData: {
    pedidoId: number;
    clienteNombre: string;
    clienteEmail: string;
    total: number;
    items: any[];
    direccion: string;
    tracking?: string;
  }): Promise<void> {
    const itemsHtml = pedidoData.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${item.producto?.nombre || 'Producto'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.talla || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.color || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.cantidad}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">S/ ${(Number(item.precio_unitario) * item.cantidad).toFixed(2)}</td>
        </tr>
      `,
      )
      .join('');

    const content = `
      <h2 style="color: #0c3434;">✅ ¡Tu pedido ha sido confirmado!</h2>
      <p style="font-size: 16px;">Hola <strong>${pedidoData.clienteNombre}</strong>,</p>
      <p style="font-size: 16px;">
        Tu pago ha sido verificado y tu pedido <strong>#${pedidoData.pedidoId}</strong> ha sido confirmado. 
        Estamos preparando tus productos para el envío.
      </p>

      <div style="background-color: #e8f5f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #0c3434; margin-top: 0;">Resumen del Pedido</h3>
        <p style="margin: 5px 0;"><strong>Número de pedido:</strong> #${pedidoData.pedidoId}</p>
        <p style="margin: 5px 0;"><strong>Total:</strong> <span style="font-size: 20px; color: #40b1a9;">S/ ${pedidoData.total.toFixed(2)}</span></p>
      </div>

      <div style="margin-top: 30px;">
        <h3 style="color: #0c3434;">Productos Confirmados</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #40b1a9;">Producto</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #40b1a9;">Talla</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #40b1a9;">Color</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #40b1a9;">Cant.</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #40b1a9;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
        <h3 style="color: #0c3434; margin-top: 0;">Dirección de Envío</h3>
        <p style="margin: 5px 0;">${pedidoData.direccion}</p>
      </div>

      <div style="margin-top: 30px; padding: 20px; background-color: #fff8e1; border-left: 4px solid #ffc107; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px;">
          <strong>📦 Próximo paso:</strong> Te enviaremos otro correo cuando tu pedido sea enviado con el código de seguimiento.
        </p>
      </div>

      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
      <p style="font-size: 14px; color: #666666; text-align: center;">
        Puedes revisar el estado de tu pedido en cualquier momento desde tu cuenta en Versyo Store.
      </p>
    `;

    const htmlContent = this.getBaseTemplate(content);

    try {
      await this.transporter.sendMail({
        from: `"Versyo Store" <${this.fromEmail}>`,
        to: pedidoData.clienteEmail,
        subject: `✅ Pedido #${pedidoData.pedidoId} Confirmado - Versyo Store`,
        html: htmlContent,
      });

      this.logger.log(`Confirmación de pedido #${pedidoData.pedidoId} enviada a ${pedidoData.clienteEmail}`);
    } catch (error) {
      this.logger.error('Error al enviar confirmación de pedido:', error);
    }
  }

  /**
   * Enviar notificación de envío al cliente
   */
  async enviarNotificacionEnvioCliente(pedidoData: {
    pedidoId: number;
    clienteNombre: string;
    clienteEmail: string;
    tracking: string;
    agenciaEnvio?: string;
  }): Promise<void> {
    const content = `
      <h2 style="color: #0c3434;">📦 ¡Tu pedido está en camino!</h2>
      <p style="font-size: 16px;">Hola <strong>${pedidoData.clienteNombre}</strong>,</p>
      <p style="font-size: 16px;">
        Tu pedido <strong>#${pedidoData.pedidoId}</strong> ha sido enviado y está en camino hacia ti.
      </p>

      <div style="background-color: #e8f5f3; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="color: #0c3434; margin-top: 0;">Información de Seguimiento</h3>
        <p style="margin: 10px 0;"><strong>Agencia de envío:</strong> ${pedidoData.agenciaEnvio || 'Olva Courier'}</p>
        <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; font-size: 14px; color: #666;">Código de seguimiento:</p>
          <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #40b1a9; font-family: monospace;">
            ${pedidoData.tracking}
          </p>
        </div>
      </div>

      <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
        <h3 style="color: #0c3434; margin-top: 0;">¿Cómo rastrear tu pedido?</h3>
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li style="margin: 10px 0;">Ingresa al sitio web de ${pedidoData.agenciaEnvio || 'la agencia de envío'}</li>
          <li style="margin: 10px 0;">Busca la opción "Rastrear envío" o "Tracking"</li>
          <li style="margin: 10px 0;">Ingresa el código de seguimiento mostrado arriba</li>
          <li style="margin: 10px 0;">Podrás ver la ubicación actual y el estado de tu pedido</li>
        </ol>
      </div>

      <div style="margin-top: 30px; padding: 20px; background-color: #fff8e1; border-left: 4px solid #ffc107; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px;">
          <strong>📍 Recuerda:</strong> El tiempo estimado de entrega es de 2-5 días hábiles según tu ubicación.
          Te notificaremos cuando el pedido haya sido entregado.
        </p>
      </div>

      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
      <p style="font-size: 14px; color: #666666; text-align: center;">
        Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo.
      </p>
    `;

    const htmlContent = this.getBaseTemplate(content);

    try {
      await this.transporter.sendMail({
        from: `"Versyo Store" <${this.fromEmail}>`,
        to: pedidoData.clienteEmail,
        subject: `📦 Tu pedido #${pedidoData.pedidoId} ha sido enviado - Tracking: ${pedidoData.tracking}`,
        html: htmlContent,
      });

      this.logger.log(`Notificación de envío del pedido #${pedidoData.pedidoId} enviada a ${pedidoData.clienteEmail}`);
    } catch (error) {
      this.logger.error('Error al enviar notificación de envío:', error);
    }
  }
}

