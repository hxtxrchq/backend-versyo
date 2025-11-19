import { PartialType } from '@nestjs/mapped-types';
import { CrearVariacionDto } from './crear-variacion.dto';

export class ActualizarVariacionDto extends PartialType(CrearVariacionDto) {}
