import { Module } from '@nestjs/common';
import { MembresiaController } from './membresia.controller';
import { MembresiaService } from './membresia.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [MembresiaController],
  providers: [MembresiaService],
  exports: [MembresiaService],
})
export class MembresiaModule {}
