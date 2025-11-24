import {
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CrearVariacionDto } from './crear-variacion.dto';

export class CrearProductoDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty()
  @IsNumber()
  precio: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @IsOptional()
  @IsNumber()
  categoria_id?: number;

  @IsOptional()
  @IsNumber()
  temporada_id?: number;

  @IsOptional()
  @IsString()
  genero?: string; // hombre, mujer, ambos

  @IsOptional()
  @IsBoolean()
  tiene_variaciones?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearVariacionDto)
  variaciones?: CrearVariacionDto[];
}
