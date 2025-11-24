/*
  Warnings:

  - You are about to alter the column `talla` on the `variacion_producto` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `color` on the `variacion_producto` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `sku` on the `variacion_producto` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "variacion_producto" ADD COLUMN     "codigo_color" VARCHAR(7),
ADD COLUMN     "imagen_url" VARCHAR(500),
ALTER COLUMN "talla" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "color" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "sku" SET DATA TYPE VARCHAR(100);
