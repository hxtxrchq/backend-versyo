import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';

export class CrearUsuarioDto {
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

  @IsOptional()
  @IsIn(['cliente', 'admin'])
  rol?: string;
}
