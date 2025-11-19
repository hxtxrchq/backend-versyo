import {
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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
}
