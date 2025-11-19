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
import { VariacionService } from './variacion.service';
import { CrearVariacionDto } from './dto/crear-variacion.dto';
import { ActualizarVariacionDto } from './dto/actualizar-variacion.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('productos/:productoId/variaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VariacionController {
  constructor(private readonly variacionService: VariacionService) {}

  @Roles('admin')
  @Post()
  crear(
    @Param('productoId') productoId: string,
    @Body() data: CrearVariacionDto,
  ) {
    return this.variacionService.crear(Number(productoId), data);
  }

  @Roles('admin', 'cliente')
  @Get()
  listar(@Param('productoId') productoId: string) {
    return this.variacionService.listar(Number(productoId));
  }

  @Roles('admin', 'cliente')
  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.variacionService.buscarPorId(Number(id));
  }

  @Roles('admin')
  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() data: ActualizarVariacionDto,
  ) {
    return this.variacionService.actualizar(Number(id), data);
  }

  @Roles('admin')
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.variacionService.eliminar(Number(id));
  }
}
