import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ContactoDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  asunto: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  mensaje: string;
}
