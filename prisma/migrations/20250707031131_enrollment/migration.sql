/*
  Warnings:

  - You are about to drop the column `lessonId` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `gradeId` on the `Student` table. All the data in the column will be lost.
  - Added the required column `classId` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `Exam` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_classId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherAttendance" DROP CONSTRAINT "TeacherAttendance_teacherId_fkey";

-- DropIndex
DROP INDEX "Student_IEMISCODE_key";

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "lessonId",
ADD COLUMN     "classId" INTEGER NOT NULL,
ADD COLUMN     "subjectId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" ALTER COLUMN "day" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "classId",
DROP COLUMN "gradeId";

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_year_key" ON "Enrollment"("studentId", "year");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("StudentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
