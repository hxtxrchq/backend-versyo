import { Module } from '@nestjs/common';
import { TemporadaController } from './temporada.controller';
import { TemporadaService } from './temporada.service';

@Module({
  controllers: [TemporadaController],
  providers: [TemporadaService]
})
export class TemporadaModule {}
