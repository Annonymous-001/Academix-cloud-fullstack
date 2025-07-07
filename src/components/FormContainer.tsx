import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";
import { Class, Lesson, Student } from "@prisma/client";
import dynamic from "next/dynamic";
import { Dispatch, SetStateAction } from "react";

type ClassSelect = Pick<Class, 'id' | 'name'>;

const TeacherAttendanceForm = dynamic(() => import("./forms/TeacherattendanceForm"), {
  loading: () => <h1>Loading...</h1>,
});

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
  teacherattendance: (setOpen, type, data, relatedData) => (
    <TeacherAttendanceForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
};

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
    | "teacherattendance"
    | "accountant"
    | "bulkFee"
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

  const session = await auth();
  const userId = session.userId;
  const currentUserId = userId;
  const role = (session.sessionClaims?.metadata as { role?: string })?.role;

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
          select: { id: true, name: true },
        });
        relatedData = { classes: studentClasses, grades: studentGrades };
        break;
      case "exam":
        const [examSubjects, examClasses] = await Promise.all([
          prisma.subject.findMany({
            select: { id: true, name: true },
          }),
          prisma.class.findMany({
            select: { id: true, name: true },
          }),
        ]);
        relatedData = { subjects: examSubjects, classes: examClasses };
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
        // Use Enrollment to get students and their classes
        const [resultEnrollments, resultExams, resultAssignments] = await Promise.all([
          prisma.enrollment.findMany({
            where: {
              ...(role === "teacher" ? {
                class: {
                  lessons: {
                    some: { teacherId: currentUserId! }
                  }
                }
              } : {}),
            },
            include: {
              student: {
                select: { id: true, name: true, surname: true, StudentId: true }
              },
              class: {
                select: { name: true }
              }
            }
          }),
          prisma.exam.findMany({
            where: {
              ...(role === "teacher" ? {
                subject: {
                  teachers: {
                    some: { id: currentUserId! }
                  }
                }
              } : {})
            },
            select: { id: true, title: true },
          }),
          prisma.assignment.findMany({
            where: {
              lesson: {
                ...(role === "teacher" ? { teacherId: currentUserId! } : {})
              }
            },
            select: { id: true, title: true },
          }),
        ]);
        // Flatten students from enrollments for the form
        const resultStudents = resultEnrollments.map(e => ({
          id: e.student.id,
          name: e.student.name,
          surname: e.student.surname,
          StudentId: e.student.StudentId,
          className: e.class.name
        }));
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
          where: {
            enrollments: {
              some: {
                year: 2082
              }
            }
          },
          select: { id: true, name: true, surname: true, StudentId: true },
        });
        relatedData = { students: feeStudents };
        break;
      case "bulkFee":
        // For bulk fee creation, we don't need additional data
        relatedData = { classId: data?.classId, className: data?.className };
        break;
      case "payment":
        relatedData = {
          fees: await prisma.fee.findMany({
            where: {
              status: {
                in: ['UNPAID', 'PARTIAL', 'OVERDUE']  // Only show fees that need payment
              },
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
                  StudentId: true
                  // Removed class
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

        // Get students for the available classes and year (latest year)
        const latestYear = await prisma.enrollment.aggregate({
          _max: { year: true }
        });
        const availableStudents = await prisma.student.findMany({
          where: {
            enrollments: {
              some: {
                classId: { in: availableClasses.map(c => c.id) },
                year: latestYear._max.year ?? undefined,
                leftAt: null
              }
            }
          },
          include: {
            enrollments: {
              where: {
                classId: { in: availableClasses.map(c => c.id) },
                year: latestYear._max.year ?? undefined,
                leftAt: null
              },
              include: {
                class: true
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
      case "teacherattendance":
        const teacherAttendanceTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: teacherAttendanceTeachers };
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
