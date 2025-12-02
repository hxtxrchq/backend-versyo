import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

let cachedApp;

async function bootstrap() {
  if (!cachedApp) {
    try {
      console.log('[Vercel] Inicializando NestJS app...');
      console.log('[Vercel] DATABASE_URL:', process.env.DATABASE_URL ? 'configurado ✓' : 'NO CONFIGURADO ✗');
      console.log('[Vercel] JWT_SECRET:', process.env.JWT_SECRET ? 'configurado ✓' : 'NO CONFIGURADO ✗');
      
      const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
      });

      // Configuración de CORS
      app.enableCors({
        origin: [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          'https://versyo.chiqo.site',
          'http://localhost:5173',
          /\.vercel\.app$/,
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      });

      // Validación global de DTOs
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
      );

      await app.init();
      console.log('[Vercel] NestJS app inicializada correctamente ✓');
      
      cachedApp = app;
    } catch (error) {
      console.error('[Vercel] Error al inicializar NestJS:', error);
      throw error;
    }
  }
  return cachedApp;
}

export default async function handler(req, res) {
  try {
    const app = await bootstrap();
    const server = app.getHttpAdapter().getInstance();
    return server(req, res);
  } catch (error) {
    console.error('[Vercel] Error en handler:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      hint: 'Verifica que todas las variables de entorno estén configuradas en Vercel',
    });
  }
}
