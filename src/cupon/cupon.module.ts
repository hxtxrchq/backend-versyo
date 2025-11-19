import { Module } from '@nestjs/common';
import { CuponController } from './cupon.controller';
import { CuponService } from './cupon.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CuponController],
  providers: [CuponService],
  exports: [CuponService], // Export para usar en pedido
})
export class CuponModule {}
