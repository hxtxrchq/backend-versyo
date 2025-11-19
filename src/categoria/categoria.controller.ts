import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('categorias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Roles('admin')
  @Post()
  crear(@Body() data: CrearCategoriaDto) {
    return this.categoriaService.crear(data);
  }

  @Roles('admin', 'cliente')
  @Get()
  listar() {
    return this.categoriaService.listar();
  }

  @Roles('admin', 'cliente')
  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.categoriaService.buscarPorId(Number(id));
  }

  @Roles('admin')
  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() data: ActualizarCategoriaDto) {
    return this.categoriaService.actualizar(Number(id), data);
  }

  @Roles('admin')
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.categoriaService.eliminar(Number(id));
  }
}
