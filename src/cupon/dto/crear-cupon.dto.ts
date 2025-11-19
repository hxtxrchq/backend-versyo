import { IsString, IsEnum, IsNumber, IsDateString, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';

export enum TipoDescuento {
  PORCENTAJE = 'porcentaje',
  MONTO_FIJO = 'monto_fijo',
}

export class CrearCuponDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  codigo: string;

  @IsEnum(TipoDescuento)
  tipo_descuento: TipoDescuento;

  @IsNumber()
  @Min(0)
  valor_descuento: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_minimo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento_maximo?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usos_maximos?: number;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;
}
