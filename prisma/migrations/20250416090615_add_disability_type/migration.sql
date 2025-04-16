/*
  Warnings:

  - A unique constraint covering the columns `[IEMISCODE]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `IEMISCODE` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fatherName` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `motherName` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DisabilityType" AS ENUM ('NONE', 'VISION', 'HEARING', 'MOBILITY', 'COGNITIVE', 'SPEECH', 'MENTAL_HEALTH', 'OTHER');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "IEMISCODE" INTEGER NOT NULL,
ADD COLUMN     "disability" "DisabilityType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "fatherName" TEXT NOT NULL,
ADD COLUMN     "motherName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_IEMISCODE_key" ON "Student"("IEMISCODE");
