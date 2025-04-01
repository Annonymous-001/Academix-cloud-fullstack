/*
  Warnings:

  - You are about to alter the column `totalAmount` on the `Fee` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `BigInt`.
  - You are about to alter the column `paidAmount` on the `Fee` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `BigInt`.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "Fee" ALTER COLUMN "totalAmount" SET DATA TYPE BIGINT,
ALTER COLUMN "paidAmount" SET DEFAULT 0,
ALTER COLUMN "paidAmount" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE BIGINT;
