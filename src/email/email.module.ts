import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Global() // Hace que EmailService esté disponible en todos los módulos
@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService], // Exporta el servicio para que otros módulos lo usen
})
export class EmailModule {}
