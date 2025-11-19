import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class CambiarContrasenaDto {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  contrasenaActual: string;

  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  nuevaContrasena: string;

  @IsString()
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  confirmarContrasena: string;
}
