import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class AgregarItemCarritoDto {
  @IsNotEmpty()
  @IsInt()
  variacion_id: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number = 1;
}
