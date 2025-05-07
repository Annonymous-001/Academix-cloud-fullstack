/*
  Warnings:

  - Added the required column `classId` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('BUS', 'SALARY', 'MAINTENANCE', 'SUPPLIES', 'UTILITIES', 'OTHER');

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_lessonId_fkey";

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "classId" INTEGER NOT NULL,
ALTER COLUMN "lessonId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Finance" (
    "id" SERIAL NOT NULL,
    "expenseType" "ExpenseType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
