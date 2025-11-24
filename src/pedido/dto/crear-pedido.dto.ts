import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ItemPedidoDto {
  @IsNumber()
  productoId: number;

  @IsOptional()
  @IsNumber()
  variacionId?: number;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precioUnitario: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  talla?: string;
}

export class CrearPedidoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  items: ItemPedidoDto[];

  @IsNotEmpty()
  @IsString()
  nombre_receptor: string;

  @IsNotEmpty()
  @IsString()
  direccion_envio: string;

  @IsNotEmpty()
  @IsString()
  ciudad: string;

  @IsNotEmpty()
  @IsString()
  region: string;

  @IsNotEmpty()
  @IsString()
  pais: string;

  @IsNotEmpty()
  @IsString()
  telefono_contacto: string;

  @IsOptional()
  @IsString()
  cupon_codigo?: string;

  @IsOptional()
  @IsString()
  metodo_pago?: string;

  @IsOptional()
  @IsString()
  voucher_url?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsNumber()
  costo_envio?: number;
}
