import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CrearVariacionDto {
  @IsNotEmpty()
  @IsString()
  talla: string;

  @IsNotEmpty()
  @IsString()
  color: string;

  @IsNumber()
  @IsNotEmpty()
  stock: number;

  @IsOptional()
  @IsString()
  sku?: string;
}
