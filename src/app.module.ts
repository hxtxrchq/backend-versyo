import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';
import { CategoriaModule } from './categoria/categoria.module';
import { TemporadaModule } from './temporada/temporada.module';
import { ProductoModule } from './producto/producto.module';
import { CarritoModule } from './carrito/carrito.module';
import { PedidoModule } from './pedido/pedido.module';
import { PublicoModule } from './publico/publico.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CuponModule } from './cupon/cupon.module';
import { UploadModule } from './upload/upload.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import { MembresiaModule } from './membresia/membresia.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [
    // Rate limiting: 100 solicitudes por minuto (60000ms)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 100, // 100 solicitudes por minuto
      },
    ]),
    PrismaModule,
    UsuarioModule,
    AuthModule,
    CategoriaModule,
    TemporadaModule,
    ProductoModule,
    CarritoModule,
    PedidoModule,
    PublicoModule,
    WishlistModule,
    CuponModule,
    UploadModule,
    AdminModule,
    EmailModule,
    MembresiaModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Aplicar ThrottlerGuard globalmente
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
