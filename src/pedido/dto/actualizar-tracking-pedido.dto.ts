import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ActualizarTrackingPedidoDto {
  @IsNotEmpty()
  @IsString()
  codigo_tracking: string;

  @IsOptional()
  @IsString()
  agencia_envio?: string;

  @IsOptional()
  @IsString()
  tiempo_estimado_entrega?: string;
}
