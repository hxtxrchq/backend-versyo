import { IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @Length(6, 6, { message: 'El código debe tener 6 dígitos' })
  codigo: string;
}
