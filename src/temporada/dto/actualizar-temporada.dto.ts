import { PartialType } from '@nestjs/mapped-types';
import { CrearTemporadaDto } from './crear-temporada.dto';

export class ActualizarTemporadaDto extends PartialType(CrearTemporadaDto) {}
