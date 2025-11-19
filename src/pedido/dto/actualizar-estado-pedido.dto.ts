import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ActualizarEstadoPedidoDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['pendiente', 'confirmado', 'en_preparacion', 'enviado', 'entregado', 'cancelado'])
  estado: string;
}
