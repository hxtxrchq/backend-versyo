import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://versyo.chiqo.site',
      'http://localhost:5173', // Vite dev server
      /\.vercel\.app$/, // Permite cualquier dominio de Vercel
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en DTOs
      forbidNonWhitelisted: true, // Lanza error si se envían propiedades no permitidas
      transform: true, // Transforma automáticamente tipos primitivos
      transformOptions: {
        enableImplicitConversion: true, // Convierte strings a números automáticamente
      },
    }),
  );

  // Puerto del servidor
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // Necesario para Vercel

  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 Backend Versyo Store                        ║
║                                                   ║
║   ✅ Servidor corriendo en: http://localhost:${port}  ║
║   ✅ CORS configurado                            ║
║   ✅ Rate Limiting activo (5 req/min)            ║
║   ✅ Validación global habilitada                ║
║   ✅ Cloudinary configurado                      ║
║   ✅ Gmail Email configurado                     ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
}
bootstrap();
