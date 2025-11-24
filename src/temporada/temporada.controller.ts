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
export class TemporadaController {
  constructor(private readonly temporadaService: TemporadaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  crear(@Body() data: CrearTemporadaDto) {
    return this.temporadaService.crear(data);
  }

  @Get()
  listar() {
    return this.temporadaService.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.temporadaService.buscarPorId(Number(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  actualizar(@Param('id') id: string, @Body() data: ActualizarTemporadaDto) {
    return this.temporadaService.actualizar(Number(id), data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  eliminar(@Param('id') id: string) {
    return this.temporadaService.eliminar(Number(id));
  }
}
