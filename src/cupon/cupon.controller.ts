import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { CuponService } from './cupon.service';
import { CrearCuponDto } from './dto/crear-cupon.dto';
import { ActualizarCuponDto } from './dto/actualizar-cupon.dto';
import { ValidarCuponDto } from './dto/validar-cupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cupon')
@UseGuards(JwtAuthGuard)
export class CuponController {
  constructor(private readonly cuponService: CuponService) {}

  /**
   * POST /cupon
   * Crear cupón (solo admin)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async crear(@Body() crearCuponDto: CrearCuponDto) {
    return this.cuponService.crear(crearCuponDto);
  }

  /**
   * GET /cupon
   * Listar todos los cupones (solo admin)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async listarTodos() {
    return this.cuponService.listarTodos();
  }

  /**
   * GET /cupon/:id
   * Obtener cupón por ID (solo admin)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.cuponService.obtenerPorId(id);
  }

  /**
   * PATCH /cupon/:id
   * Actualizar cupón (solo admin)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async actualizar(@Param('id', ParseIntPipe) id: number, @Body() actualizarCuponDto: ActualizarCuponDto) {
    return this.cuponService.actualizar(id, actualizarCuponDto);
  }

  /**
   * DELETE /cupon/:id
   * Eliminar cupón (solo admin)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.cuponService.eliminar(id);
  }

  /**
   * POST /cupon/validar
   * Validar cupón (usuarios autenticados)
   */
  @Post('validar')
  async validar(@Body() validarCuponDto: ValidarCuponDto, @Query('monto') monto: number) {
    return this.cuponService.validar(validarCuponDto.codigo, Number(monto));
  }
}
