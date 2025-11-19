import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class ActualizarPerfilDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  dni?: string;

  @IsString()
  @IsOptional()
  direccion?: string;
}
