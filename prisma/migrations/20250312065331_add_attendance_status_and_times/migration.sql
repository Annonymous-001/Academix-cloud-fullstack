/*
  Warnings:

  - You are about to drop the column `present` on the `Attendance` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "present",
ADD COLUMN     "inTime" TIMESTAMP(3),
ADD COLUMN     "outTime" TIMESTAMP(3),
ADD COLUMN     "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT';
