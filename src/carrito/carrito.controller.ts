import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AgregarItemCarritoDto } from './dto/agregar-item-carrito.dto';
import { ActualizarItemCarritoDto } from './dto/actualizar-item-carrito.dto';

@Controller('carrito')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  // Ver carrito del usuario autenticado
  @Roles('cliente', 'admin')
  @Get()
  obtenerCarrito(@Req() req: any) {
    const usuarioId = req.user.id;
    return this.carritoService.obtenerCarrito(usuarioId);
  }

  // Agregar item al carrito
  @Roles('cliente', 'admin')
  @Post('items')
  agregarItem(@Req() req: any, @Body() data: AgregarItemCarritoDto) {
    const usuarioId = req.user.id;
    return this.carritoService.agregarItem(usuarioId, data);
  }

  // Actualizar cantidad de un item
  @Roles('cliente', 'admin')
  @Patch('items/:id')
  actualizarCantidad(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: ActualizarItemCarritoDto,
  ) {
    const usuarioId = req.user.id;
    return this.carritoService.actualizarCantidad(usuarioId, Number(id), data);
  }

  // Eliminar un item del carrito
  @Roles('cliente', 'admin')
  @Delete('items/:id')
  eliminarItem(@Req() req: any, @Param('id') id: string) {
    const usuarioId = req.user.id;
    return this.carritoService.eliminarItem(usuarioId, Number(id));
  }

  // Vaciar carrito completo
  @Roles('cliente', 'admin')
  @Delete('vaciar')
  vaciarCarrito(@Req() req: any) {
    const usuarioId = req.user.id;
    return this.carritoService.vaciarCarrito(usuarioId);
  }
}
