import { Module } from '@nestjs/common';
import { ProductoController } from './producto.controller';
import { ProductoService } from './producto.service';
import { VariacionModule } from './variacion/variacion.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, VariacionModule],
  controllers: [ProductoController],
  providers: [ProductoService],
  exports: [ProductoService],
})
export class ProductoModule {}
