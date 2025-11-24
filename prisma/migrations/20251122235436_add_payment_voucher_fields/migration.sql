-- AlterTable
ALTER TABLE "pedido" ADD COLUMN     "metodo_pago" VARCHAR(50),
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "voucher_url" VARCHAR(500);
