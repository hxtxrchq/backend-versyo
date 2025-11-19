import { Module } from '@nestjs/common';
import { VariacionController } from './variacion.controller';
import { VariacionService } from './variacion.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VariacionController],
  providers: [VariacionService],
  exports: [VariacionService],
})
export class VariacionModule {}
