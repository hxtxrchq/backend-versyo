import { Controller, Get, Query, Param, ParseIntPipe, Post, Body } from '@nestjs/common';
import { PublicoService } from './publico.service';
import { Public } from '../auth/decorators/public.decorator';
import { ContactoDto } from './dto/contacto.dto';

@Controller('publico')
@Public() // Todo el controlador es público
export class PublicoController {
  constructor(private readonly publicoService: PublicoService) {}

  /**
   * GET /publico/portada
   * Datos para la portada/home
   */
  @Get('portada')
  async obtenerPortada() {
    return this.publicoService.obtenerPortada();
  }

  /**
   * GET /publico/productos?categoria=hombre&talla=M&precio_min=100&precio_max=500&orden=precio_asc&pagina=1&limite=20
   * Listar productos con filtros y paginación
   */
  @Get('productos')
  async listarProductos(@Query() filtros: any) {
    return this.publicoService.listarProductos(filtros);
  }

  /**
   * GET /publico/productos/buscar?q=camisa&limite=10
   * Buscar productos por texto
   */
  @Get('productos/buscar')
  async buscarProductos(@Query('q') q: string, @Query('limite') limite?: number) {
    return this.publicoService.buscarProductos(q, limite);
  }

  /**
   * GET /publico/productos/slug/:slug
   * Obtener producto por slug
   */
  @Get('productos/slug/:slug')
  async obtenerPorSlug(@Param('slug') slug: string) {
    return this.publicoService.obtenerPorSlug(slug);
  }

  /**
   * GET /publico/productos/categoria/:identificador?pagina=1&limite=20
   * Productos por categoría
   */
  @Get('productos/categoria/:identificador')
  async productosPorCategoria(
    @Param('identificador') identificador: string,
    @Query('pagina') pagina?: number,
    @Query('limite') limite?: number,
  ) {
    return this.publicoService.productosPorCategoria(identificador, pagina, limite);
  }

  /**
   * GET /publico/productos/temporada/:id?pagina=1&limite=20
   * Productos por temporada
   */
  @Get('productos/temporada/:id')
  async productosPorTemporada(
    @Param('id', ParseIntPipe) id: number,
    @Query('pagina') pagina?: number,
    @Query('limite') limite?: number,
  ) {
    return this.publicoService.productosPorTemporada(id, pagina, limite);
  }

  /**
   * GET /publico/productos/nuevos?limite=12
   * Productos nuevos
   */
  @Get('productos/nuevos')
  async productosNuevos(@Query('limite') limite?: number) {
    return this.publicoService.productosNuevos(limite);
  }

  /**
   * GET /publico/productos/populares?limite=12
   * Productos populares
   */
  @Get('productos/populares')
  async productosPopulares(@Query('limite') limite?: number) {
    return this.publicoService.productosPopulares(limite);
  }

  /**
   * GET /publico/categorias
   * Listar todas las categorías
   */
  @Get('categorias')
  async listarCategorias() {
    return this.publicoService.listarCategorias();
  }

  /**
   * GET /publico/temporadas/activas
   * Listar temporadas activas
   */
  @Get('temporadas/activas')
  async listarTemporadasActivas() {
    return this.publicoService.listarTemporadasActivas();
  }

  /**
   * GET /publico/productos/:id/variaciones
   * Obtener variaciones de un producto
   */
  @Get('productos/:id/variaciones')
  async obtenerVariaciones(@Param('id', ParseIntPipe) id: number) {
    return this.publicoService.obtenerVariaciones(id);
  }

  /**
   * POST /publico/contacto
   * Enviar mensaje de contacto
   */
  @Post('contacto')
  async enviarContacto(@Body() data: ContactoDto) {
    return this.publicoService.enviarContacto(data);
  }
}
