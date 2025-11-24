-- AlterTable
ALTER TABLE "producto" ADD COLUMN     "genero" VARCHAR(20) DEFAULT 'ambos';

-- CreateIndex
CREATE INDEX "producto_genero_idx" ON "producto"("genero");
