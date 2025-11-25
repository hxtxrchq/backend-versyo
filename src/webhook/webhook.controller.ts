import { Controller, Post, HttpCode, HttpStatus, Headers, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  @Post('deploy')
  @HttpCode(HttpStatus.OK)
  async handleDeploy(@Headers('x-github-event') githubEvent: string) {
    // Solo procesar push events
    if (githubEvent !== 'push') {
      return { message: 'Event ignored' };
    }

    this.logger.log('🚀 Iniciando deploy automático...');

    try {
      // Ejecutar git pull
      const { stdout: pullOutput } = await execPromise('git pull origin main');
      this.logger.log(`Git pull: ${pullOutput}`);

      // Instalar dependencias
      const { stdout: installOutput } = await execPromise('npm install');
      this.logger.log(`NPM install: ${installOutput}`);

      // Compilar
      const { stdout: buildOutput } = await execPromise('npm run build');
      this.logger.log(`Build: ${buildOutput}`);

      // Reiniciar PM2 (en background para no interrumpir la respuesta)
      setTimeout(async () => {
        try {
          await execPromise('pm2 restart versyo-backend');
          this.logger.log('✅ PM2 reiniciado correctamente');
        } catch (error) {
          this.logger.error('Error al reiniciar PM2:', error);
        }
      }, 2000);

      return {
        success: true,
        message: 'Deploy completado correctamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Error durante el deploy:', error);
      return {
        success: false,
        message: 'Error durante el deploy',
        error: error.message,
      };
    }
  }
}
