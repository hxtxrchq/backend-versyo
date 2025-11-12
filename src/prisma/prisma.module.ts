import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // hace que esté disponible en toda la app sin tener que importarlo siempre
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
