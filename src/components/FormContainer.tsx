import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";
import { Class, Lesson, Student } from "@prisma/client";

type ClassSelect = Pick<Class, 'id' | 'name'>;

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
    | "announcement"
    | "fee"
    | "payment"
    | "finance"
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  relatedData?: any;
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
      case "fee":
        const feeStudents = await prisma.student.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { students: feeStudents };
        break;
      case "payment":
        relatedData = {
          fees: await prisma.fee.findMany({
            where: {
              status: {
                in: ['UNPAID', 'PARTIAL', 'OVERDUE']  // Only show fees that need payment
              },
              // Only include fees with remaining balance
              totalAmount: {
                gt: 0  // totalAmount > 0
              }
            },
            select: { 
              id: true, 
              totalAmount: true,
              paidAmount: true,
              dueDate: true,
              status: true,
              student: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  class: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: [
              { status: 'desc' },  // OVERDUE first, then PARTIAL, then UNPAID
              { dueDate: 'asc' }   // Earliest due date first
            ]
          })
        };
        break;
      case "attendance":
        // Get classes based on role
        let availableClasses: ClassSelect[] = [];
        if (role === "teacher" && currentUserId) {
          // For teachers who are supervisors, only show their supervised class
          availableClasses = await prisma.class.findMany({
            where: {
              OR: [
                { supervisorId: currentUserId },
                { lessons: { some: { teacherId: currentUserId } } }
              ]
            },
            select: {
              id: true,
              name: true
            }
          });
        } else if (role === "admin") {
          // Admin can see all classes
          availableClasses = await prisma.class.findMany({
            select: {
              id: true,
              name: true
            }
          });
        }

        // Get lessons for the available classes
        const availableLessons = await prisma.lesson.findMany({
          where: {
            classId: {
              in: availableClasses.map(c => c.id)
            },
            ...(role === "teacher" && currentUserId ? { teacherId: currentUserId } : {})
          },
          select: {
            id: true,
            name: true,
            classId: true
          }
        });

        // Get students for the available classes
        const availableStudents = await prisma.student.findMany({
          where: {
            classId: {
              in: availableClasses.map(c => c.id)
            }
          },
          select: {
            id: true,
            name: true,
            surname: true,
            StudentId: true,
            classId: true,
            class: {
              select: {
                name: true
              }
            }
          }
        });

        relatedData = { 
          classes: availableClasses,
          lessons: availableLessons,
          students: availableStudents
        };
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
