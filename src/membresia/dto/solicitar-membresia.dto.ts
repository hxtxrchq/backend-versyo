import { IsEmail, IsOptional } from 'class-validator';

export class SolicitarMembresiaDto {
  @IsOptional()
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email?: string;
}
