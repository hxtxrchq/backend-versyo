import { IsEmail, IsNotEmpty, IsOptional, MinLength, IsString } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  contrasena: string;

  @IsOptional()
  telefono?: string;
}
