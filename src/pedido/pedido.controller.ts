import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { ActualizarEstadoPedidoDto } from './dto/actualizar-estado-pedido.dto';
import { ActualizarTrackingPedidoDto } from './dto/actualizar-tracking-pedido.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('pedido')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  /**
   * POST /pedido/checkout
   * Crear pedido desde el carrito del usuario autenticado
   * Requiere autenticación JWT
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async checkout(@Request() req, @Body() data: CrearPedidoDto) {
    return this.pedidoService.checkout(req.user.id, data);
  }

  /**
   * GET /pedido/mis-pedidos
   * Listar todos los pedidos del usuario autenticado
   * Requiere autenticación JWT
   */
  @Get('mis-pedidos')
  @UseGuards(JwtAuthGuard)
  async misPedidos(@Request() req) {
    return this.pedidoService.listarPorUsuario(req.user.id);
  }

  /**
   * GET /pedido/:id
   * Obtener detalle de un pedido específico
   * Requiere autenticación JWT
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(@Param('id') id: string) {
    return this.pedidoService.obtenerPorId(+id);
  }

  /**
   * PATCH /pedido/:id/estado
   * Actualizar estado del pedido
   * Solo administradores
   */
  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async actualizarEstado(
    @Param('id') id: string,
    @Body() data: ActualizarEstadoPedidoDto,
  ) {
    return this.pedidoService.actualizarEstado(+id, data);
  }

  /**
   * PATCH /pedido/:id/tracking
   * Actualizar información de tracking
   * Solo administradores
   */
  @Patch(':id/tracking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async actualizarTracking(
    @Param('id') id: string,
    @Body() data: ActualizarTrackingPedidoDto,
  ) {
    return this.pedidoService.actualizarTracking(+id, data);
  }

  /**
   * PATCH /pedido/:id/cancelar
   * Cancelar un pedido (solo si está en estado "pendiente" o "confirmado")
   * Requiere autenticación JWT
   * Solo el propietario del pedido puede cancelarlo
   */
  @Patch(':id/cancelar')
  @UseGuards(JwtAuthGuard)
  async cancelarPedido(@Param('id') id: string, @Request() req) {
    return this.pedidoService.cancelarPedido(+id, req.user.id);
  }

  /**
   * GET /pedido/publico/consultar
   * Consultar pedidos por email (sin autenticación)
   * Permite a los clientes ver sus pedidos usando solo su email
   */
  @Get('publico/consultar')
  @Public()
  async consultarPedidosPorEmail(@Query('email') email: string) {
    return this.pedidoService.obtenerPedidosPorEmail(email);
  }
}
