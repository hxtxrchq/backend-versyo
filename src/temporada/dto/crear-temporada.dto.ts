import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CrearTemporadaDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @IsOptional()
  @IsDateString()
  inicio?: string;

  @IsOptional()
  @IsDateString()
  fin?: string;
}
