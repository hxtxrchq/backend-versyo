-- Agregar precio_oferta y cambiar destacado a recomendado

-- 1. Agregar columna precio_oferta
ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "precio_oferta" DECIMAL(12,2);

-- 2. Renombrar destacado a recomendado
ALTER TABLE "producto" RENAME COLUMN "destacado" TO "recomendado";

-- 3. Actualizar índice
DROP INDEX IF EXISTS "producto_destacado_idx";
CREATE INDEX IF NOT EXISTS "producto_recomendado_idx" ON "producto"("recomendado");
