import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  constructor() {
    // Configurar Cloudinary con variables de entorno
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Subir una imagen a Cloudinary
   * @param file - Archivo a subir (Express.Multer.File)
   * @param folder - Carpeta en Cloudinary (opcional, default: 'versyo')
   * @returns URL de la imagen subida
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'versyo',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo (solo imágenes)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, WEBP)',
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'El archivo es demasiado grande. Tamaño máximo: 5MB',
      );
    }

    try {
      // Subir a Cloudinary usando stream
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' }, // Límite de tamaño
              { quality: 'auto:good' }, // Optimización automática
              { fetch_format: 'auto' }, // Formato automático (WebP si es compatible)
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });

      return result.secure_url;
    } catch (error) {
      console.error('Error al subir imagen a Cloudinary:', error);
      throw new BadRequestException('Error al subir la imagen');
    }
  }

  /**
   * Subir múltiples imágenes a Cloudinary
   * @param files - Array de archivos
   * @param folder - Carpeta en Cloudinary
   * @returns Array de URLs de las imágenes subidas
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'versyo',
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos');
    }

    // Validar máximo de archivos (10 imágenes)
    if (files.length > 10) {
      throw new BadRequestException('Máximo 10 imágenes por vez');
    }

    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Eliminar una imagen de Cloudinary
   * @param imageUrl - URL de la imagen a eliminar
   * @returns true si se eliminó correctamente
   */
  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extraer public_id de la URL de Cloudinary
      const parts = imageUrl.split('/');
      const publicIdWithExtension = parts[parts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];
      const folder = parts[parts.length - 2];

      const fullPublicId = `${folder}/${publicId}`;

      await cloudinary.uploader.destroy(fullPublicId);
      return true;
    } catch (error) {
      console.error('Error al eliminar imagen de Cloudinary:', error);
      return false;
    }
  }

  /**
   * Eliminar múltiples imágenes de Cloudinary
   * @param imageUrls - Array de URLs de imágenes
   * @returns true si todas se eliminaron correctamente
   */
  async deleteMultipleImages(imageUrls: string[]): Promise<boolean> {
    try {
      const deletePromises = imageUrls.map((url) => this.deleteImage(url));
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error al eliminar imágenes de Cloudinary:', error);
      return false;
    }
  }
}
