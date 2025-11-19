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
import { TemporadaService } from './temporada.service';
import { CrearTemporadaDto } from './dto/crear-temporada.dto';
import { ActualizarTemporadaDto } from './dto/actualizar-temporada.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('temporadas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemporadaController {
  constructor(private readonly temporadaService: TemporadaService) {}

  @Roles('admin')
  @Post()
  crear(@Body() data: CrearTemporadaDto) {
    return this.temporadaService.crear(data);
  }

  @Roles('admin', 'cliente')
  @Get()
  listar() {
    return this.temporadaService.listar();
  }

  @Roles('admin', 'cliente')
  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.temporadaService.buscarPorId(Number(id));
  }

  @Roles('admin')
  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() data: ActualizarTemporadaDto) {
    return this.temporadaService.actualizar(Number(id), data);
  }

  @Roles('admin')
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.temporadaService.eliminar(Number(id));
  }
}
