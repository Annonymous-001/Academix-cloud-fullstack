/*
  Warnings:

  - A unique constraint covering the columns `[parentId]` on the table `Parent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[StudentId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teacherId]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `parentId` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `StudentId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "parentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "StudentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "teacherId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Parent_parentId_key" ON "Parent"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_StudentId_key" ON "Student"("StudentId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_teacherId_key" ON "Teacher"("teacherId");
