-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "apellido" VARCHAR(150),
ADD COLUMN     "codigo_verificacion" VARCHAR(10),
ADD COLUMN     "codigo_verificacion_exp" TIMESTAMPTZ(6);
