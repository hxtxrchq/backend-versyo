import { IsInt, Min } from 'class-validator';

export class ActualizarItemCarritoDto {
  @IsInt()
  @Min(1)
  cantidad: number;
}
