import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin') // Todos los endpoints requieren rol admin
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/estadisticas
   * Obtener estadísticas generales
   */
  @Get('estadisticas')
  obtenerEstadisticas() {
    return this.adminService.obtenerEstadisticas();
  }

  /**
   * GET /admin/productos
   * Listar todos los productos con paginación
   */
  @Get('productos')
  listarProductos(
    @Query('pagina', ParseIntPipe) pagina: number = 1,
    @Query('limite', ParseIntPipe) limite: number = 20,
  ) {
    return this.adminService.listarProductos(pagina, limite);
  }

  /**
   * PATCH /admin/productos/:id/estado
   * Activar/desactivar producto
   */
  @Patch('productos/:id/estado')
  cambiarEstadoProducto(
    @Param('id', ParseIntPipe) id: number,
    @Body('activo') activo: boolean,
  ) {
    return this.adminService.cambiarEstadoProducto(id, activo);
  }

  /**
   * GET /admin/pedidos
   * Listar todos los pedidos con filtros
   */
  @Get('pedidos')
  listarTodosPedidos(
    @Query('estado') estado?: string,
    @Query('pagina', ParseIntPipe) pagina: number = 1,
    @Query('limite', ParseIntPipe) limite: number = 20,
  ) {
    return this.adminService.listarTodosPedidos(estado, pagina, limite);
  }

  /**
   * GET /admin/pedidos/:id
   * Obtener detalles de un pedido
   */
  @Get('pedidos/:id')
  obtenerPedido(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.obtenerPedido(id);
  }

  /**
   * PATCH /admin/pedidos/:id/estado
   * Actualizar estado del pedido
   */
  @Patch('pedidos/:id/estado')
  actualizarEstadoPedido(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ) {
    return this.adminService.actualizarEstadoPedido(id, estado);
  }

  /**
   * PATCH /admin/pedidos/:id/tracking
   * Actualizar tracking del pedido
   */
  @Patch('pedidos/:id/tracking')
  actualizarTrackingPedido(
    @Param('id', ParseIntPipe) id: number,
    @Body('codigo_tracking') codigo_tracking: string,
    @Body('agencia_envio') agencia_envio?: string,
  ) {
    return this.adminService.actualizarTrackingPedido(
      id,
      codigo_tracking,
      agencia_envio,
    );
  }
}
