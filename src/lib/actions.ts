"use server";


import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  LessonSchema,
  AssignmentSchema,
  ResultSchema,
  EventSchema,
  AnnouncementSchema,
  ParentSchema,
  AccountantSchema,
  FeeSchema,
  PaymentSchema,
  AttendanceSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { calculateFeeStatus } from "./feeHelpers";
import { revalidatePath } from "next/cache";

const clerk=clerkClient();

type CurrentState = { success: boolean; error: boolean };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};


export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    // Get the highest current teacher ID to determine the next number
    const highestTeacher = await prisma.teacher.findFirst({
      orderBy: {
        teacherId: 'desc'
      },
      select: {
        teacherId: true
      }
    });
    
    // Generate the next teacher ID
    let teacherId;
    if (!highestTeacher || !highestTeacher.teacherId) {
      // If no teachers exist yet, start with 1480730003
      teacherId = "1480730003";
    } else {
      // Extract the first digit and increment it
      const firstDigit = parseInt(highestTeacher.teacherId.charAt(0));
      const nextDigit = firstDigit + 1;
      teacherId = `${nextDigit}480730003`;
    }
  
    // Create user in Clerk
    const user = await clerk.users.createUser({
      emailAddress: data.email ? [data.email] : [], // Clerk requires an array
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "teacher" },
    });

    console.log("Clerk user created successfully:", user.id);
    console.log("Prisma query execution...");

    try {
      // Store teacher details in the database
      await prisma.teacher.create({
        data: {
          id: user.id, // Clerk assigns a unique ID
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address,
          img: data.img || null,
          bloodType: data.bloodType,
          sex: data.sex,
          birthday: data.birthday,
          teacherId: teacherId, // Add the hardcoded teacher ID with incremented first digit
          subjects: {
            connect: data.subjects?.map((subjectId: string) => ({
              id: parseInt(subjectId),
            })),
          },
        },
      });

      return { success: true, error: false };
    } catch (prismaError: any) {
      console.error("Prisma error:", prismaError);

      // Rollback - Delete user from Clerk if Prisma fails
      await clerk.users.deleteUser(user.id);
      console.log("Clerk user deleted due to Prisma failure:", user.id);

      return { success: false, error: true, message: prismaError.message };
    }
  } catch (clerkError: any) {
    console.error("Clerk error:", clerkError);
    return { success: false, error: true, message: clerkError.message };
  }
};


export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerk.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });
    const currentTeacher = await prisma.teacher.findUnique({
      where: { id: data.id },
      select: { img: true }
    });
console.log("teacher updated in clerk ",user.id)
    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        // ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        ...(data.img ? { img: data.img } : { img: currentTeacher?.img }),
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  console.log(id);
  try {
    await clerk.users.deleteUser(id);
    const teacherExists = await prisma.teacher.findUnique({
      where: { id: id },
    });
    
    if (!teacherExists) {
      console.error("Teacher not found in database:", id);
      return { success: false, error: true, message: "Teacher not found" };
    }
    
    await prisma.teacher.delete({
      where: {
        id: id,
      }
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  console.log(data);
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

    // Generate unique student ID with format YYYYMMDDXX001
    // Where YYYYMMDD is current date, XX are name initials
    const today = new Date();
    const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const nameInitials = `${data.name.charAt(0)}${data.surname.charAt(0)}`.toUpperCase();
    
    // Generate random 3 digits for the end of the ID
    const randomDigits = Math.floor(Math.random() * 900) + 100; // Random number between 100-999
    
    // Create the student ID with format YYYYMMDDXX[random 3 digits]
    const studentId = `${dateString}${nameInitials}${randomDigits}`;

    // Create user in Clerk
    const user = await clerk.users.createUser({
      emailAddress: data.email ? [data.email] : [],
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"student"}
    });

    console.log("Clerk user created successfully:", user.id);
    console.log("Prisma query execution...");

    try {
      // Store student details in the database
      await prisma.student.create({
        data: {
          id: user.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address,
          img: data.img || null,
          bloodType: data.bloodType,
          sex: data.sex,
          birthday: data.birthday,
          gradeId: data.gradeId,
          classId: data.classId,
          StudentId: studentId, // Add the generated student ID with random digits
        },
      });

      return { success: true, error: false };
    } catch (prismaError: any) {
      console.error("Prisma error:", prismaError);

      // Rollback - Delete user from Clerk if Prisma fails
      await clerk.users.deleteUser(user.id);
      console.log("Clerk user deleted due to Prisma failure:", user.id);

      return { success: false, error: true, message: prismaError.message };
    }
  } catch (clerkError: any) {
    console.error("Clerk error:", clerkError);
    return { success: false, error: true, message: clerkError.message };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerk.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });
const currentStudent= await prisma.student.findUnique({
  where:{id:data.id},
  select:{img:true}
})
    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        // ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        ...(data.img ? { img: data.img } : { img: currentStudent?.img }),
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        // parentId: data.parentId,
      },
    });
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await clerk.users.deleteUser(id);
    
    const studentExists = await prisma.student.findUnique({
      where: { id: id },
    });
    
    if (!studentExists) {
      console.error("Student not found in database:", id);
      return { success: false, error: true, message: "Student not found" };
    }
    
    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
        // ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  try {
    await prisma.lesson.create({
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  try {
    await prisma.lesson.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.lesson.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  try {
    await prisma.assignment.create({
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  try {
    await prisma.assignment.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.assignment.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createResult = async (
  currentState: CurrentState,
  data: ResultSchema
) => {
  try {
    await prisma.result.create({
      data: {
        score: data.score,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
        studentId: data.studentId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateResult = async (
  currentState: CurrentState,
  data: ResultSchema
) => {
  try {
    await prisma.result.update({
      where: {
        id: data.id,
      },
      data: {
        score: data.score,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
        studentId: data.studentId,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteResult = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.result.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  try {
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        classId: data.classId || null,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    await prisma.event.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        classId: data.classId || null,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteEvent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.event.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  try {
    await prisma.announcement.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        classId: data.classId || null,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    await prisma.announcement.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        classId: data.classId || null,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.announcement.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  try {
    console.log("Starting parent creation process...");
    console.log("Parent data received:", data);

    // Generate unique parent ID
    // Format: P-YYYY-XXXX where YYYY is current year and XXXX is sequential number
    const currentYear = new Date().getFullYear();
    
    // Get highest parent ID to determine next sequential number
    const highestParent = await prisma.parent.findFirst({
      orderBy: {
        parentId: 'desc'
      },
      select: {
        parentId: true
      }
    });
    
    let sequentialNumber = 1;
    if (highestParent && highestParent.parentId) {
      // Extract the sequential number from existing format (P-YYYY-XXXX)
      const parts = highestParent.parentId.split('-');
      if (parts.length === 3) {
        sequentialNumber = parseInt(parts[2]) + 1;
      }
    }
    
    // Create the parent ID with format P-YYYY-XXXX (padded to 4 digits)
    const parentId = `P-${currentYear}-${String(sequentialNumber).padStart(4, '0')}`;

    // Create user in Clerk
    console.log("Creating user in Clerk...");
    const user = await clerk.users.createUser({
      emailAddress: [data.email],
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "parent" },
    });
    console.log("Clerk user created successfully:", user.id);

    try {
      // Create parent in database
      console.log("Creating parent in database...");
      await prisma.parent.create({
        data: {
          id: user.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email,
          phone: data.phone,
          address: data.address,
          parentId: parentId, // Add the generated parent ID
        },
      });

      // If there are student IDs, update the students to connect them to this parent
      if (data.studentId) {
        const studentIds = data.studentId.split(',').map(id => id.trim());
        
        // Find students by their StudentId (not Clerk ID)
        for (const studentId of studentIds) {
          const student = await prisma.student.findFirst({
            where: { StudentId: studentId }
          });
          
          if (student) {
            // Update student to connect to this parent
            await prisma.student.update({
              where: { id: student.id },
              data: { parentId: user.id }
            });
          } else {
            console.log(`Student with StudentId ${studentId} not found`);
          }
        }
      }

      console.log("Parent created successfully in database");
      return { success: true, error: false };
    } catch (prismaError: any) {
      console.error("Prisma error:", prismaError);

      // Rollback - Delete user from Clerk if Prisma fails
      await clerk.users.deleteUser(user.id);
      console.log("Clerk user deleted due to Prisma failure:", user.id);

      return { success: false, error: true, message: prismaError.message };
    }
  } catch (clerkError: any) {
    console.error("Error in Clerk user creation:", clerkError);
    return { success: false, error: true, message: clerkError.message };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  if (!data.id) {
    console.error("No ID provided for parent update");
    return { success: false, error: true };
  }

  try {
    console.log("Starting parent update process...");
    console.log("Update data received:", data);

    // Update user in Clerk
    console.log("Updating user in Clerk...");
    const user = await clerk.users.updateUser(data.id, {
      username: data.username,
      firstName: data.name,
      lastName: data.surname,
      ...(data.password && { password: data.password }),
    });
    console.log("Clerk user updated successfully");

    // Update parent basic info in database
    console.log("Updating parent in database...");
    await prisma.parent.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    });

    // Handle student relationships
    if (data.studentId) {
      // Get current students of this parent
      const currentStudents = await prisma.student.findMany({
        where: { parentId: data.id },
        select: { StudentId: true }
      });
      const currentStudentIds = currentStudents.map(s => s.StudentId);

      // Get new student IDs from the form
      const newStudentIds = data.studentId.split(',').map(id => id.trim());

      // Find students to remove (those in current but not in new)
      const studentsToRemove = currentStudentIds.filter(id => !newStudentIds.includes(id));

      // Find students to add (those in new but not in current)
      const studentsToAdd = newStudentIds.filter(id => !currentStudentIds.includes(id));

      // Update students to remove this parent
      for (const studentId of studentsToRemove) {
        const student = await prisma.student.findFirst({
          where: { StudentId: studentId }
        });
        
        if (student) {
          await prisma.student.update({
            where: { id: student.id },
            data: { parentId: null }
          });
        }
      }

      // Update students to add this parent
      for (const studentId of studentsToAdd) {
        const student = await prisma.student.findFirst({
          where: { StudentId: studentId }
        });
        
        if (student) {
          await prisma.student.update({
            where: { id: student.id },
            data: { parentId: data.id }
          });
        } else {
          console.log(`Student with StudentId ${studentId} not found`);
        }
      }
    }

    console.log("Parent updated successfully in database");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error in updateParent:", err);
    return { success: false, error: true, message: err.message };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  console.log("Deleting parent with ID:", id);
  
  try {
    // First check if parent exists
    const parentExists = await prisma.parent.findUnique({
      where: { id },
      include: {
        students: true
      }
    });

    if (!parentExists) {
      console.error("Parent not found in database:", id);
      return { success: false, error: true, message: "Parent not found" };
    }

    // First update all students to remove their relationship with this parent
    if (parentExists.students.length > 0) {
      await prisma.$transaction(
        parentExists.students.map(student =>
          prisma.student.update({
            where: { id: student.id },
            data: { parentId: null } // Set to null instead of empty string
          })
        )
      );
    }

    // Delete from Clerk
    await clerk.users.deleteUser(id);

    // Then delete the parent from database
    await prisma.parent.delete({
      where: { id }
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Error in deleteParent:", err);
    return { success: false, error: true };
  }
};

export const createAccountant = async (
  currentState: CurrentState,
  data: AccountantSchema
) => {
  try {
    console.log("Creating accountant...");
    
    // Create Clerk user
    const user = await clerk.users.createUser({
      emailAddress: data.email ? [data.email] : [],
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "accountant" },
    });

    // Create database record
    await prisma.accountant.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        createdAt: new Date(),
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error creating accountant:", err);
    return { success: false, error: true, message: err.message };
  }
};

export const updateAccountant = async (
  currentState: CurrentState,
  data: AccountantSchema
) => {
  if (!data.id) return { success: false, error: true };

  try {
    console.log("Updating accountant...");
    
    // Update Clerk user
    await clerk.users.updateUser(data.id, {
      username: data.username,
      firstName: data.name,
      lastName: data.surname,
      ...(data.password && { password: data.password }),
    });

    // Update database record
    await prisma.accountant.update({
      where: { id: data.id },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error updating accountant:", err);
    return { success: false, error: true, message: err.message };
  }
};

export const deleteAccountant = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    console.log("Deleting accountant...");
    
    // Delete database record
    await prisma.accountant.delete({
      where: { id },
    });

    // Delete Clerk user
    await clerk.users.deleteUser(id);

    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error deleting accountant:", err);
    return { success: false, error: true, message: err.message };
  }
};

export const createFee = async (
  currentState: CurrentState,
  data: FeeSchema
) => {
  try {
    // Convert to number for comparison
    const totalAmount = Number(data.totalAmount);
    // For zero amount fees, automatically set status to PAID
    const status = totalAmount === 0 ? 'PAID' : data.status;
    
    await prisma.fee.create({
      data: {
        studentId: data.studentId,
        totalAmount: BigInt(data.totalAmount.toString()),
        paidAmount: data.paidAmount ? BigInt(data.paidAmount.toString()) : BigInt(0),
        dueDate: data.dueDate,
        status: status, // Use the status we determined above
      },
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateFee = async (
  currentState: CurrentState,
  data: FeeSchema
) => {
  try {
    // Convert to number for comparison
    const totalAmount = Number(data.totalAmount);
    // For zero amount fees, automatically set status to PAID
    const status = totalAmount === 0 ? 'PAID' : data.status;
    
    await prisma.fee.update({
      where: { id: data.id },
      data: {
        studentId: data.studentId,
        totalAmount: BigInt(data.totalAmount.toString()),
        paidAmount: data.paidAmount ? BigInt(data.paidAmount.toString()) : BigInt(0),
        dueDate: data.dueDate,
        status: status, // Use the status we determined above
      },
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteFee = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.fee.delete({
      where: { id: parseInt(id) },
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createPayment = async (
  currentState: CurrentState,
  data: PaymentSchema
) => {
  try {
    console.log("control reaches here")
    return await prisma.$transaction(async (tx) => {
      // 1. Create payment
      const payment = await tx.payment.create({
        data: {
          feeId: data.feeId,
          amount: data.amount,
          method: data.method,
          date: data.date,
          reference: data.reference,
          transactionId: data.transactionId || null
        }
      });

      // 2. First update the fee's paid amount
      const updatedFee = await tx.fee.update({
        where: { id: data.feeId },
        data: {
          paidAmount: { increment: BigInt(data.amount) }
        },
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
          dueDate: true
        }
      });
      
      // 3. Now calculate and set the status with the updated amounts
      await tx.fee.update({
        where: { id: data.feeId },
        data: {
          status: await calculateFeeStatus(data.feeId, tx)
        }
      });

      return { success: true, error: false };
    },
    { timeout: 10000 }
  );
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const updatePayment = async (
  currentState: CurrentState,
  data: PaymentSchema
) => {
  if (!data.id) return { success: false, error: true };

  return await prisma.$transaction(async (tx) => {
    // 1. Get existing payment
    const oldPayment = await tx.payment.findUnique({
      where: { id: String(data.id) },
      select: { amount: true, feeId: true }
    });

    if (!oldPayment) throw new Error("Payment not found");

    // 2. Update payment
    const updatedPayment = await tx.payment.update({
      where: { id: String(data.id) },
      data: {
        amount: data.amount,
        method: data.method,
        date: data.date,
        reference: data.reference,
        transactionId: data.transactionId || null
      }
    });
    // 3. Calculate difference and update fee
    const amountDiff = BigInt(data.amount) - BigInt(oldPayment.amount);
    await tx.fee.update({
      where: { id: oldPayment.feeId },
      data: {
        paidAmount: { increment: amountDiff },
        status: await calculateFeeStatus(oldPayment.feeId, tx)
      }
    });

    return { success: true, error: false };
  });
};

export const deletePayment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  
  return await prisma.$transaction(async (tx) => {
    // 1. Get payment details
    const payment = await tx.payment.delete({
      where: { id: String(id) },
      select: { amount: true, feeId: true }
    });

    // 2. Update fee
    await tx.fee.update({
      where: { id: payment.feeId },
      data: {
        paidAmount: { decrement: payment.amount },
        status: await calculateFeeStatus(payment.feeId, tx)
      }
    });

    return { success: true, error: false };
  });
};
export const createAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  try {
    console.log("control reaches here ")
    await prisma.attendance.create({
      data: {
        studentId: data.studentId,
        lessonId: data.lessonId,
        date: data.date,
        // inTime: data.inTime,
        // outTime: data.outTime,
        status: data.status,
      },
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  if (!data.id) return { success: false, error: true };

  try {
    await prisma.attendance.update({
      where: { id: data.id },
      data: {
        studentId: data.studentId,
        lessonId: data.lessonId,
        date: data.date,
        // inTime: data.inTime,
        // outTime: data.outTime,
        status: data.status,
      },
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAttendance = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id");

  if (!id || isNaN(Number(id))) {
    return { success: false, error: true, message: "Invalid ID" };
  }

  try {
    // First, find the attendance entry
    const attendance = await prisma.attendance.findUnique({
      where: { id: Number(id) },
      include: { student: true, lesson: true },
    });

    if (!attendance) {
      return { success: false, error: true, message: "Attendance not found" };
    }

    // Now delete the attendance record
    await prisma.attendance.delete({
      where: { id: Number(id) },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error("Delete Attendance Error:", err);
    return { success: false, error: true };
  }
};

export const getStudentReportData = async (studentId: string) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        surname: true,
        StudentId: true,
        class: {
          select: {
            name: true,
          },
        },
        results: {
          include: {
            exam: {
              include: {
                lesson: {
                  include: {
                    subject: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            exam: {
              lesson: {
                subject: {
                  name: 'asc',
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return { success: false, error: true, message: "Student not found" };
    }

    return { 
      success: true, 
      error: false, 
      data: student 
    };
  } catch (error) {
    console.error("Error fetching student report data:", error);
    return { 
      success: false, 
      error: true, 
      message: "Failed to fetch student report data" 
    };
  }
};
// Add this function to your lib/actions.ts file

export const getStudentIdCardData = async (studentId: string) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        surname: true,
        StudentId: true,
        bloodType: true,
        sex: true,
        birthday: true,
        phone: true,
        img: true,
        address: true,
        class: {
          select: {
            name: true,
          },
        },
        grade: {
          select: {
            level: true,
          },
        },
        parent: {
          select: {
            name: true,
            surname: true,
            phone: true,
          }
        }
      },
    });

    if (!student) {
      return { success: false, error: true, message: "Student not found" };
    }

    return { 
      success: true, 
      error: false, 
      data: student 
    };
  } catch (error) {
    console.error("Error fetching student ID card data:", error);
    return { 
      success: false, 
      error: true, 
      message: "Failed to fetch student ID card data" 
    };
  }
};
