import { Controller, Post, Get, Delete, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard) // Requiere autenticación
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /**
   * POST /wishlist/agregar/:producto_id
   * Agregar producto a wishlist
   */
  @Post('agregar/:producto_id')
  async agregar(@Param('producto_id', ParseIntPipe) producto_id: number, @Request() req: any) {
    return this.wishlistService.agregar(req.user.usuario_id, producto_id);
  }

  /**
   * GET /wishlist
   * Obtener wishlist del usuario
   */
  @Get()
  async obtener(@Request() req: any) {
    return this.wishlistService.obtener(req.user.usuario_id);
  }

  /**
   * DELETE /wishlist/:id
   * Eliminar producto de wishlist
   */
  @Delete(':id')
  async eliminar(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.wishlistService.eliminar(id, req.user.usuario_id);
  }

  /**
   * GET /wishlist/favorito/:producto_id
   * Verificar si un producto está en favoritos
   */
  @Get('favorito/:producto_id')
  async esFavorito(@Param('producto_id', ParseIntPipe) producto_id: number, @Request() req: any) {
    return this.wishlistService.esFavorito(producto_id, req.user.usuario_id);
  }
}
