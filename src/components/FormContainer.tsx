import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

export const FormContainer = async ({
  type,
  table,
  id,
  data,
}: FormContainerProps) => {
  let relatedData = {};

  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;
      case "class":
        const classGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;
      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects: teacherSubjects };
        break;
      case "student":
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const studentClasses = await prisma.class.findMany({
          include: { _count: { select: { students: true } } },
        });
        relatedData = { classes: studentClasses, grades: studentGrades };
        break;
      case "exam":
        const examLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: { id: true, name: true },
        });
        relatedData = { lessons: examLessons };
        break;
      case "lesson":
        const [lessonSubjects, lessonClasses, lessonTeachers] = await Promise.all([
          prisma.subject.findMany({
            select: { id: true, name: true },
          }),
          prisma.class.findMany({
            select: { id: true, name: true },
          }),
          prisma.teacher.findMany({
            select: { id: true, name: true, surname: true },
          }),
        ]);
        relatedData = { 
          subjects: lessonSubjects, 
          classes: lessonClasses, 
          teachers: lessonTeachers 
        };
        break;
      case "assignment":
        const assignmentLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: { 
            id: true, 
            name: true,
            subject: { select: { name: true } },
            class: { select: { name: true } }
          },
        });
        relatedData = { lessons: assignmentLessons };
        break;
      case "result":
        const [resultStudents, resultExams, resultAssignments] = await Promise.all([
          prisma.student.findMany({
            where: {
              ...(role === "teacher" ? { 
                class: {
                  lessons: {
                    some: { teacherId: currentUserId! }
                  }
                }
              } : {}),
            },
            select: { 
              id: true, 
              name: true,
              surname: true 
            },
          }),
          prisma.exam.findMany({
            where: {
              lesson: {
                ...(role === "teacher" ? { teacherId: currentUserId! } : {})
              }
            },
            select: { 
              id: true, 
              title: true 
            },
          }),
          prisma.assignment.findMany({
            where: {
              lesson: {
                ...(role === "teacher" ? { teacherId: currentUserId! } : {})
              }
            },
            select: { 
              id: true, 
              title: true 
            },
          }),
        ]);
        relatedData = { 
          students: resultStudents, 
          exams: resultExams, 
          assignments: resultAssignments 
        };
        break;
      case "event":
        const eventClasses = await prisma.class.findMany({
          select: { 
            id: true, 
            name: true 
          },
        });
        relatedData = { classes: eventClasses };
        break;
      case "announcement":
        const announcementClasses = await prisma.class.findMany({
          select: { 
            id: true, 
            name: true 
          },
        });
        relatedData = { classes: announcementClasses };
        break;
      case "parent":
        if (type === "update" && data?.id) {
          const parentWithStudents = await prisma.parent.findUnique({
            where: { id: data.id },
            include: {
              students: {
                select: {
                  id: true,
                  name: true,
                  surname: true
                }
              }
            }
          });
          relatedData = { students: parentWithStudents?.students || [] };
        }
        break;
      default:
        break;
    }
  }

  return (
    <FormModal
      type={type}
      table={table}
      id={id}
      data={data}
      relatedData={relatedData}
    />
  );
};

export default FormContainer;
