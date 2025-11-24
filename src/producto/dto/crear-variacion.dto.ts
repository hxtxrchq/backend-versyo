import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CrearVariacionDto {
  @IsOptional()
  @IsString()
  talla?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  codigo_color?: string; // Código hexadecimal del color (ej: #FF5733)

  @IsOptional()
  @IsString()
  imagen_url?: string;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsString()
  sku?: string;
}
