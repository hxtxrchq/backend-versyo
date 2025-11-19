import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('productos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Roles('admin')
  @Post()
  crear(@Body() data: CrearProductoDto) {
    return this.productoService.crear(data);
  }

  @Roles('admin', 'cliente')
  @Get()
  listar(
    @Query('categoria', new ParseIntPipe({ optional: true })) categoria?: number,
    @Query('temporada', new ParseIntPipe({ optional: true })) temporada?: number,
    @Query('precio_min', new ParseIntPipe({ optional: true })) precio_min?: number,
    @Query('precio_max', new ParseIntPipe({ optional: true })) precio_max?: number,
    @Query('buscar') buscar?: string,
    @Query('orden') orden?: string,
    @Query('pagina', new ParseIntPipe({ optional: true })) pagina?: number,
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
  ) {
    return this.productoService.listar({
      categoria,
      temporada,
      precio_min,
      precio_max,
      buscar,
      orden,
      pagina,
      limite,
    });
  }

  @Roles('admin', 'cliente')
  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.productoService.buscarPorId(Number(id));
  }

  @Roles('admin')
  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() data: ActualizarProductoDto) {
    return this.productoService.actualizar(Number(id), data);
  }

  @Roles('admin')
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.productoService.eliminar(Number(id));
  }
}
