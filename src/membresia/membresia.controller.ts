import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MembresiaService } from './membresia.service';
import { SolicitarMembresiaDto } from './dto/solicitar-membresia.dto';
import { ConfirmarMembresiaDto } from './dto/confirmar-membresia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    rol: string;
  };
}

@Controller('membresia')
export class MembresiaController {
  constructor(private readonly membresiaService: MembresiaService) {}

  /**
   * POST /membresia/solicitar
   * Solicitar membresía - Usuario autenticado envía su email para recibir instrucciones
   */
  @Post('solicitar')
  @UseGuards(JwtAuthGuard)
  async solicitarMembresia(
    @Request() req: RequestWithUser,
    @Body() data: SolicitarMembresiaDto,
  ) {
    return this.membresiaService.solicitarMembresia(req.user.id, data);
  }

  /**
   * GET /membresia/mis-solicitudes
   * Obtener solicitudes del usuario autenticado
   */
  @Get('mis-solicitudes')
  @UseGuards(JwtAuthGuard)
  async misSolicitudes(@Request() req: RequestWithUser) {
    return this.membresiaService.misSolicitudes(req.user.id);
  }

  /**
   * GET /membresia/verificar
   * Verificar si el usuario tiene membresía activa
   */
  @Get('verificar')
  @UseGuards(JwtAuthGuard)
  async verificarMembresia(@Request() req: RequestWithUser) {
    return this.membresiaService.verificarMembresia(req.user.id);
  }

  /**
   * GET /membresia/admin/solicitudes
   * Listar todas las solicitudes (Admin)
   */
  @Get('admin/solicitudes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async listarSolicitudes(@Query('estado') estado?: string) {
    return this.membresiaService.listarSolicitudes(estado);
  }

  /**
   * PATCH /membresia/admin/confirmar
   * Confirmar pago de membresía (Admin)
   */
  @Patch('admin/confirmar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async confirmarMembresia(@Body() data: ConfirmarMembresiaDto) {
    return this.membresiaService.confirmarMembresia(data);
  }

  /**
   * PATCH /membresia/admin/rechazar/:id
   * Rechazar solicitud de membresía (Admin)
   */
  @Patch('admin/rechazar/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async rechazarMembresia(
    @Param('id') id: string,
    @Body() body: { motivo?: string },
  ) {
    return this.membresiaService.rechazarMembresia(+id, body.motivo);
  }
}
