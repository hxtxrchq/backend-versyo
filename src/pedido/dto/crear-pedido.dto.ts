import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearPedidoDto {
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
}
