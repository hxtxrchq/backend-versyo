import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Delete,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /upload/image
   * Subir una sola imagen
   * Requiere autenticación (admin)
   */
  @Post('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const url = await this.uploadService.uploadImage(file, 'versyo/productos');
    return { url };
  }

  /**
   * POST /upload/images
   * Subir múltiples imágenes (máximo 10)
   * Requiere autenticación (admin)
   */
  @Post('images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 archivos
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos');
    }

    const urls = await this.uploadService.uploadMultipleImages(
      files,
      'versyo/productos',
    );
    return { urls };
  }

  /**
   * DELETE /upload/image
   * Eliminar una imagen de Cloudinary
   * Requiere autenticación (admin)
   */
  @Delete('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteImage(
    @Body('imageUrl') imageUrl: string,
  ): Promise<{ mensaje: string }> {
    if (!imageUrl) {
      throw new BadRequestException('URL de imagen no proporcionada');
    }

    const deleted = await this.uploadService.deleteImage(imageUrl);

    if (deleted) {
      return { mensaje: 'Imagen eliminada exitosamente' };
    } else {
      throw new BadRequestException('Error al eliminar la imagen');
    }
  }

  /**
   * DELETE /upload/images
   * Eliminar múltiples imágenes de Cloudinary
   * Requiere autenticación (admin)
   */
  @Delete('images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteMultipleImages(
    @Body('imageUrls') imageUrls: string[],
  ): Promise<{ mensaje: string }> {
    if (!imageUrls || imageUrls.length === 0) {
      throw new BadRequestException('URLs de imágenes no proporcionadas');
    }

    const deleted = await this.uploadService.deleteMultipleImages(imageUrls);

    if (deleted) {
      return {
        mensaje: `${imageUrls.length} imágenes eliminadas exitosamente`,
      };
    } else {
      throw new BadRequestException('Error al eliminar las imágenes');
    }
  }
}
