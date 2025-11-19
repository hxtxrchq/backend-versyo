import { PartialType } from '@nestjs/mapped-types';
import { CrearCuponDto } from './crear-cupon.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class ActualizarCuponDto extends PartialType(CrearCuponDto) {
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
