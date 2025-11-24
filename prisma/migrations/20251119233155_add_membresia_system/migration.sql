/*
  Warnings:

  - You are about to drop the column `membresia_activada_en` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the `pago_membresia` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pago_membresia" DROP CONSTRAINT "pago_membresia_usuario_id_fkey";

-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "membresia_activada_en",
ADD COLUMN     "fecha_membresia" TIMESTAMPTZ(6);

-- DropTable
DROP TABLE "pago_membresia";

-- CreateTable
CREATE TABLE "solicitud_membresia" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "email_solicitante" VARCHAR(200) NOT NULL,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    "boleta_url" VARCHAR(500),
    "comprobante_enviado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procesado_en" TIMESTAMPTZ(6),

    CONSTRAINT "solicitud_membresia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitud_membresia_usuario_id_idx" ON "solicitud_membresia"("usuario_id");

-- CreateIndex
CREATE INDEX "solicitud_membresia_estado_idx" ON "solicitud_membresia"("estado");

-- CreateIndex
CREATE INDEX "solicitud_membresia_email_solicitante_idx" ON "solicitud_membresia"("email_solicitante");

-- AddForeignKey
ALTER TABLE "solicitud_membresia" ADD CONSTRAINT "solicitud_membresia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
