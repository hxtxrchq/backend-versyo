-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "membresia_activada_en" TIMESTAMPTZ(6),
ADD COLUMN     "tiene_membresia" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "pago_membresia" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "codigo_verificacion" VARCHAR(100) NOT NULL,
    "metodo_pago" VARCHAR(50),
    "comprobante_url" VARCHAR(500),
    "estado" VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    "verificado_por_admin" BOOLEAN NOT NULL DEFAULT false,
    "notas_admin" TEXT,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificado_en" TIMESTAMPTZ(6),

    CONSTRAINT "pago_membresia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pago_membresia_codigo_verificacion_key" ON "pago_membresia"("codigo_verificacion");

-- CreateIndex
CREATE INDEX "pago_membresia_usuario_id_idx" ON "pago_membresia"("usuario_id");

-- CreateIndex
CREATE INDEX "pago_membresia_codigo_verificacion_idx" ON "pago_membresia"("codigo_verificacion");

-- CreateIndex
CREATE INDEX "pago_membresia_estado_idx" ON "pago_membresia"("estado");

-- CreateIndex
CREATE INDEX "pago_membresia_creado_en_idx" ON "pago_membresia"("creado_en");

-- CreateIndex
CREATE INDEX "usuario_tiene_membresia_idx" ON "usuario"("tiene_membresia");

-- AddForeignKey
ALTER TABLE "pago_membresia" ADD CONSTRAINT "pago_membresia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
