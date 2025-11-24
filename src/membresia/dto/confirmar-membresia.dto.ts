import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class ConfirmarMembresiaDto {
  @IsInt({ message: 'El ID de solicitud debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID de solicitud es requerido' })
  solicitudId: number;

  @IsString({ message: 'La URL de la boleta debe ser texto' })
  @IsNotEmpty({ message: 'La URL de la boleta es requerida' })
  boletaUrl: string;
}
