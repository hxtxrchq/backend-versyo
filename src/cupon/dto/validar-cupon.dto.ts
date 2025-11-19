import { IsString, MinLength } from 'class-validator';

export class ValidarCuponDto {
  @IsString()
  @MinLength(3)
  codigo: string;
}
