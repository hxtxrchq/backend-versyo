import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  crear(@Body() data: CrearUsuarioDto) {
    return this.usuarioService.crear(data);
  }

  @Get()
  listar() {
    return this.usuarioService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.usuarioService.buscarPorId(Number(id));
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() data: ActualizarUsuarioDto) {
    return this.usuarioService.actualizar(Number(id), data);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.usuarioService.eliminar(Number(id));
  }
}
