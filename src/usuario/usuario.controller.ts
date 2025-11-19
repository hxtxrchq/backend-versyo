import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  /**
   * GET /usuario/perfil
   * Obtener perfil del usuario autenticado
   */
  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  obtenerPerfil(@Request() req) {
    return this.usuarioService.obtenerPerfil(req.user.id);
  }

  /**
   * PATCH /usuario/perfil
   * Actualizar perfil del usuario autenticado
   */
  @Patch('perfil')
  @UseGuards(JwtAuthGuard)
  actualizarPerfil(@Request() req, @Body() data: ActualizarPerfilDto) {
    return this.usuarioService.actualizarPerfil(req.user.id, data);
  }

  /**
   * PATCH /usuario/cambiar-contrasena
   * Cambiar contraseña del usuario autenticado
   */
  @Patch('cambiar-contrasena')
  @UseGuards(JwtAuthGuard)
  cambiarContrasena(@Request() req, @Body() data: CambiarContrasenaDto) {
    return this.usuarioService.cambiarContrasena(req.user.id, data);
  }

  /**
   * DELETE /usuario/cuenta
   * Eliminar cuenta del usuario autenticado (requiere confirmación con contraseña)
   */
  @Delete('cuenta')
  @UseGuards(JwtAuthGuard)
  eliminarCuenta(@Request() req, @Body('contrasena') contrasena: string) {
    return this.usuarioService.eliminarCuenta(req.user.id, contrasena);
  }

  // ===== ENDPOINTS DE ADMINISTRACIÓN =====

  /**
   * POST /usuario/admin/crear
   * Crear usuario (solo admin)
   */
  @Post('admin/crear')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  crear(@Body() data: CrearUsuarioDto) {
    return this.usuarioService.crear(data);
  }

  /**
   * GET /usuario/admin/listar
   * Listar todos los usuarios (solo admin)
   */
  @Get('admin/listar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listar() {
    return this.usuarioService.listar();
  }

  /**
   * GET /usuario/admin/:id
   * Obtener usuario por ID (solo admin)
   */
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  buscarPorId(@Param('id') id: string) {
    return this.usuarioService.buscarPorId(Number(id));
  }

  /**
   * PATCH /usuario/admin/:id
   * Actualizar usuario por ID (solo admin)
   */
  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  actualizar(@Param('id') id: string, @Body() data: ActualizarUsuarioDto) {
    return this.usuarioService.actualizar(Number(id), data);
  }

  /**
   * DELETE /usuario/admin/:id
   * Eliminar usuario por ID (solo admin)
   */
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  eliminar(@Param('id') id: string) {
    return this.usuarioService.eliminar(Number(id));
  }
}
