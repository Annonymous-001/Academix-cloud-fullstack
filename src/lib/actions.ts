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
  FinanceSchema,
  BulkFeeSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { calculateFeeStatus } from "./feeHelpers";
import { revalidatePath } from "next/cache";
import { cleanupImageOnFailure } from "./cloudinary";

type CurrentState = { 
  success: boolean; 
  error: boolean; 
  message?: string;
  details?: any;
};

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
  } catch (err: any) {
    console.log(err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    // First check if the subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: data.id },
      include: { teachers: true }
    });

    if (!existingSubject) {
      return {
        success: false,
        error: true,
        message: "Subject not found",
        details: [{ message: "Subject with the provided ID does not exist" }],
      };
    }

    // Update the subject with new teacher relationships
    await prisma.subject.update({
      where: { id: data.id },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
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
): Promise<CurrentState> => {
  try {
    // If supervisorId is provided, verify the teacher exists
    if (data.supervisorId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: data.supervisorId },
      });

      if (!teacher) {
        return {
          success: false,
          error: true,
          message: "Supervisor teacher not found",
        };
      }
    }

    await prisma.class.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        gradeId: data.gradeId,
        supervisorId: data.supervisorId || null, // Explicitly set null if not provided
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error creating class:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return {
      success: false,
      error: true,
      message: "Class ID is required for an update.",
    };
  }
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        supervisorId: data.supervisorId ? data.supervisorId : null, // <-- fix here
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error updating class:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
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
    // Generate a unique teacher ID using timestamp
    const timestamp = Date.now();
    const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const teacherId = `3${timestamp}${randomDigits}`;
  
    // Create user in Clerk
    const user = await (await clerkClient()).users.createUser({
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
          teacherId: teacherId,
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

      // Clean up image from Cloudinary if it exists
      if (data.img) {
        await cleanupImageOnFailure(data.img, "teacher creation");
      }

      // Rollback - Delete user from Clerk if Prisma fails
      await (await clerkClient()).users.deleteUser(user.id);
      console.log("Clerk user deleted due to Prisma failure:", user.id);

      return { success: false, error: true, message: prismaError.message };
    }
  } catch (clerkError: any) {
    console.error("Clerk error:", clerkError);
    
    // Clean up image from Cloudinary if Clerk fails
    if (data.img) {
      await cleanupImageOnFailure(data.img, "teacher creation (Clerk failure)");
    }
    
    return { success: false, error: true, message: clerkError.message, details: clerkError.errors || clerkError };

  }
};


export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  console.log("updateTeacher called with data:", data);
  
  if (!data.id) {
    console.error("No ID provided for teacher update");
    return { success: false, error: true, message: "Teacher ID is required for update" };
  }
  
  try {
    console.log("Updating teacher in Clerk with ID:", data.id);
    
    // Update user in Clerk first
    const user = await (await clerkClient()).users.updateUser(data.id, {
      username: data.username,
      ...(data.password && data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });
    
    console.log("Teacher updated in Clerk:", user.id);
    
    // Get current teacher data for image comparison
    const currentTeacher = await prisma.teacher.findUnique({
      where: { id: data.id },
      select: { img: true }
    });
    
    console.log("Current teacher data:", currentTeacher);
    
    try {
      console.log("Updating teacher in database with data:", {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: data.subjects
      });
      
      // Update teacher in database
      await prisma.teacher.update({
        where: {
          id: data.id,
        },
        data: {
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
      
      console.log("Teacher updated successfully in database");
      revalidatePath("/list/teachers");
      return { success: true, error: false };
    } catch (prismaError: any) {
      console.error("Prisma error in updateTeacher:", prismaError);
      
      // Clean up new image from Cloudinary if update fails and a new image was uploaded
      if (data.img && data.img !== currentTeacher?.img) {
        await cleanupImageOnFailure(data.img, "teacher update");
      }
      
      // Handle specific Prisma errors
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.[0];
        let message = "A record with this information already exists.";
        if (field === 'username') {
          message = "This username is already taken. Please choose a different username.";
        } else if (field === 'email') {
          message = "This email address is already registered. Please use a different email.";
        }
        return { 
          success: false, 
          error: true, 
          message,
          details: [{ code: 'P2002', message: prismaError.message, meta: prismaError.meta }]
        };
      }
      
      return { 
        success: false, 
        error: true, 
        message: prismaError.message || "Database update failed",
        details: [{ message: prismaError.message || "Unknown database error" }]
      };
    }
  } catch (clerkError: any) {
    console.error("Clerk error in updateTeacher:", clerkError);
    
    // Clean up new image from Cloudinary if Clerk update fails and a new image was uploaded
    if (data.img) {
      const currentTeacher = await prisma.teacher.findUnique({
        where: { id: data.id },
        select: { img: true }
      });
      
      if (data.img !== currentTeacher?.img) {
        await cleanupImageOnFailure(data.img, "teacher update (Clerk failure)");
      }
    }
    
    // Handle specific Clerk errors
    if (clerkError.errors?.[0]) {
      const error = clerkError.errors[0];
      return { 
        success: false, 
        error: true, 
        message: error.longMessage || error.message || "Authentication update failed",
        details: clerkError.errors
      };
    }
    
    return { 
      success: false, 
      error: true, 
      message: clerkError.message || "Authentication update failed",
      details: [{ message: clerkError.message || "Unknown authentication error" }]
    };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  console.log(id);
  try {
    // Get teacher info before deletion to clean up image
    const teacher = await prisma.teacher.findUnique({
      where: { id: id },
      select: { img: true }
    });

    await (await clerkClient()).users.deleteUser(id);
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

    // Clean up image from Cloudinary after successful deletion
    if (teacher?.img) {
      await cleanupImageOnFailure(teacher.img, "teacher deletion");
    }

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
): Promise<CurrentState> => {
  try {
    const { parentId, password, email, ...studentData } = data;
    
    // Create user in Clerk first
    const user = await (await clerkClient()).users.createUser({
      emailAddress: email ? [email] : [],
      username: studentData.username,
      password: password || 'password@79264', // Use provided password or default
      firstName: studentData.name,
      lastName: studentData.surname,
      publicMetadata: { role: "student" },
    });

    console.log("Clerk user created successfully:", user.id);

    try {
      // Find parent if parentId is provided
      const parent = await prisma.parent.findFirst({
        where: {
          OR: [{ id: parentId }],
        },
      });

      // Create student in database with Clerk user ID
      const newStudent = await prisma.student.create({
        data: {
          id: user.id, // Use Clerk user ID
          ...studentData,
          StudentId: studentData.StudentId || "", // Ensure StudentId is always a string
          parentId: parent?.id || null, // Ensure parentId is either a valid ID or null
          birthday: data.birthday || null,
        },
      });

      return { success: true, error: false };
    } catch (prismaError: any) {
      console.error("Prisma error:", prismaError);

      // Rollback - Delete user from Clerk if Prisma fails
      await (await clerkClient()).users.deleteUser(user.id);
      console.log("Clerk user deleted due to Prisma failure:", user.id);

      return { 
        success: false, 
        error: true, 
        message: prismaError.message,
        details: [{ message: prismaError.message || "Unknown error" }]
      };
    }
  } catch (clerkError: any) {
    console.error("Clerk error:", clerkError);
    
    return { 
      success: false, 
      error: true, 
      message: clerkError.message,
      details: clerkError.errors || [{ message: clerkError.message || "Unknown error" }]
    };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return {
      success: false,
      error: true,
      message: "Student ID is required for an update.",
    };
  }
  try {
    const { parentId, password, email, ...studentData } = data;
    
    // Update user in Clerk first
    await (await clerkClient()).users.updateUser(data.id, {
      username: studentData.username,
      firstName: studentData.name,
      lastName: studentData.surname,
      ...(password && password !== "" && { password }),
    });

    try {
      // Find parent if parentId is provided
      const parent = await prisma.parent.findFirst({
        where: {
          OR: [{ id: parentId }],
        },
      });

      // Update student in database
      const updatedStudent = await prisma.student.update({
        where: {
          id: data.id,
        },
        data: {
          ...studentData,
          StudentId: studentData.StudentId || "", // Ensure StudentId is always a string
          parentId: parent?.id || null, // Ensure parentId is either a valid ID or null
          birthday: data.birthday || null,
        },
      });

      return { success: true, error: false };
    } catch (prismaError: any) {
      console.error("Prisma error in updateStudent:", prismaError);
      
      return { 
        success: false, 
        error: true, 
        message: prismaError.message,
        details: [{ message: prismaError.message || "Unknown error" }]
      };
    }
  } catch (clerkError: any) {
    console.error("Clerk error in updateStudent:", clerkError);
    
    return { 
      success: false, 
      error: true, 
      message: clerkError.message,
      details: clerkError.errors || [{ message: clerkError.message || "Unknown error" }]
    };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    // Get student info before deletion to clean up image
    const student = await prisma.student.findUnique({
      where: { id: id },
      select: { img: true }
    });

    await (await clerkClient()).users.deleteUser(id);
    
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

    // Clean up image from Cloudinary after successful deletion
    if (student?.img) {
      await cleanupImageOnFailure(student.img, "student deletion");
    }

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (error: any) {
    console.error("Error deleting student:", error);
    return { 
      success: false, 
      error: true,
      message: error.message || "Failed to delete student"
    };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
): Promise<CurrentState> => {
  try {
    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error creating exam:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return {
      success: false,
      error: true,
      message: "Exam ID is required for an update.",
    };
  }
  try {
    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error updating exam:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
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
): Promise<CurrentState> => {
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
  } catch (err: any) {
    console.error("Error creating lesson:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: LessonSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return {
      success: false,
      error: true,
      message: "Lesson ID is required for an update.",
    };
  }
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
  } catch (err: any) {
    console.error("Error updating lesson:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
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
): Promise<CurrentState> => {
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
  } catch (err: any) {
    console.error("Error creating assignment:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return {
      success: false,
      error: true,
      message: "Assignment ID is required for an update.",
    };
  }
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
  } catch (err: any) {
    console.error("Error updating assignment:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
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
): Promise<CurrentState> => {
  try {
    await prisma.result.create({
      data: {
        studentId: data.studentId,
        score: data.score,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error creating result:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updateResult = async (
  currentState: CurrentState,
  data: ResultSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return {
      success: false,
      error: true,
      message: "Result ID is required for an update.",
    };
  }
  try {
    await prisma.result.update({
      where: {
        id: data.id,
      },
      data: {
        studentId: data.studentId,
        score: data.score,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error updating result:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
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
): Promise<CurrentState> => {
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
  } catch (err: any) {
    console.error("Error creating event:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updateEvent = async (
  currentState: CurrentState,
  data: EventSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return {
      success: false,
      error: true,
      message: "Event ID is required for an update.",
    };
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
  } catch (err: any) {
    console.error("Error updating event:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
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
): Promise<CurrentState> => {
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
  } catch (err: any) {
    console.error("Error creating announcement:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updateAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return {
      success: false,
      error: true,
      message: "Announcement ID is required for an update.",
    };
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
  } catch (err: any) {
    console.error("Error updating announcement:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
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
    const user = await (await clerkClient()).users.createUser({
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
      await (await clerkClient()).users.deleteUser(user.id);
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
    const user = await (await clerkClient()).users.updateUser(data.id, {
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
    await (await clerkClient()).users.deleteUser(id);

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
    const user = await (await clerkClient()).users.createUser({
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
    
    // Handle Clerk errors specifically
    if (err.clerkError && err.errors) {
      return { 
        success: false, 
        error: true, 
        message: "Authentication error occurred",
        details: err.errors 
      };
    }
    
    // Handle Prisma errors
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0];
      let message = "A record with this information already exists.";
      if (field === 'username') {
        message = "This username is already taken. Please choose a different username.";
      } else if (field === 'email') {
        message = "This email address is already registered. Please use a different email.";
      } else if (field === 'phone') {
        message = "This phone number is already registered. Please use a different phone number.";
      }
      return { 
        success: false, 
        error: true, 
        message,
        details: [{ code: 'P2002', message: err.message, meta: err.meta }]
      };
    }
    
    // Handle other Prisma errors
    if (err.code) {
      return { 
        success: false, 
        error: true, 
        message: "Database error occurred",
        details: [{ code: err.code, message: err.message, meta: err.meta }]
      };
    }
    
    // Generic error fallback
    return { 
      success: false, 
      error: true, 
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }]
    };
  }
};

export const updateAccountant = async (
  currentState: CurrentState,
  data: AccountantSchema
) => {
  if (!data.id) return { success: false, error: true, message: "Accountant ID is required" };

  try {
    console.log("Updating accountant...");
    
    // Update Clerk user
    await (await clerkClient()).users.updateUser(data.id, {
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
    
    // Handle Clerk errors specifically
    if (err.clerkError && err.errors) {
      return { 
        success: false, 
        error: true, 
        message: "Authentication error occurred",
        details: err.errors 
      };
    }
    
    // Handle Prisma errors
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0];
      let message = "A record with this information already exists.";
      if (field === 'username') {
        message = "This username is already taken. Please choose a different username.";
      } else if (field === 'email') {
        message = "This email address is already registered. Please use a different email.";
      } else if (field === 'phone') {
        message = "This phone number is already registered. Please use a different phone number.";
      }
      return { 
        success: false, 
        error: true, 
        message,
        details: [{ code: 'P2002', message: err.message, meta: err.meta }]
      };
    }
    
    if (err.code === 'P2025') {
      return { 
        success: false, 
        error: true, 
        message: "Accountant not found. The record may have been deleted.",
        details: [{ code: 'P2025', message: err.message, meta: err.meta }]
      };
    }
    
    // Handle other Prisma errors
    if (err.code) {
      return { 
        success: false, 
        error: true, 
        message: "Database error occurred",
        details: [{ code: err.code, message: err.message, meta: err.meta }]
      };
    }
    
    // Generic error fallback
    return { 
      success: false, 
      error: true, 
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }]
    };
  }
};

export const deleteAccountant = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  
  if (!id) {
    return { success: false, error: true, message: "Accountant ID is required" };
  }
  
  try {
    console.log("Deleting accountant...");
    
    // Delete database record
    await prisma.accountant.delete({
      where: { id },
    });

    // Delete Clerk user
    await (await clerkClient()).users.deleteUser(id);

    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error deleting accountant:", err);
    
    // Handle Clerk errors specifically
    if (err.clerkError && err.errors) {
      return { 
        success: false, 
        error: true, 
        message: "Authentication error occurred",
        details: err.errors 
      };
    }
    
    // Handle Prisma errors
    if (err.code === 'P2025') {
      return { 
        success: false, 
        error: true, 
        message: "Accountant not found. The record may have already been deleted.",
        details: [{ code: 'P2025', message: err.message, meta: err.meta }]
      };
    }
    
    // Handle other Prisma errors
    if (err.code) {
      return { 
        success: false, 
        error: true, 
        message: "Database error occurred",
        details: [{ code: err.code, message: err.message, meta: err.meta }]
      };
    }
    
    // Generic error fallback
    return { 
      success: false, 
      error: true, 
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }]
    };
  }
};

export const createFee = async (
  currentState: CurrentState,
  data: FeeSchema
): Promise<CurrentState> => {
  try {
    // Convert to number for comparison
    const totalAmount = Number(data.totalAmount);
    // For zero amount fees, automatically set status to PAID
    const status = totalAmount === 0 ? "PAID" : data.status;

    await prisma.fee.create({
      data: {
        studentId: data.studentId,
        totalAmount: BigInt(data.totalAmount?.toString() ?? "0"),
        paidAmount: data.paidAmount
          ? BigInt(data.paidAmount.toString())
          : BigInt(0),
        dueDate: data.dueDate,
        status: status, // Use the status we determined above
      },
    });
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error creating fee:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updateFee = async (
  currentState: CurrentState,
  data: FeeSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return {
      success: false,
      error: true,
      message: "Fee ID is required for an update.",
    };
  }
  try {
    console.log("Update Fee - Input data:", {
      id: data.id,
      studentId: data.studentId,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      dueDate: data.dueDate,
      status: data.status,
    });

    // Get the existing fee to check current amount and paid amount
    const existingFee = await prisma.fee.findUnique({
      where: { id: data.id },
      select: { totalAmount: true, paidAmount: true },
    });

    console.log("Existing fee data:", {
      totalAmount: existingFee?.totalAmount?.toString(),
      paidAmount: existingFee?.paidAmount?.toString(),
    });

    if (!existingFee) {
      return { success: false, error: true, message: "Fee not found" };
    }

    // Use provided totalAmount or keep existing one
    const newTotalAmount =
      data.totalAmount !== undefined && !isNaN(Number(data.totalAmount))
        ? BigInt(data.totalAmount.toString())
        : existingFee.totalAmount;

    console.log("Paid amount check:", {
      providedPaidAmount: data.paidAmount,
      isUndefined: data.paidAmount === undefined,
      isNaN: isNaN(Number(data.paidAmount)),
      existingPaidAmount: existingFee.paidAmount.toString(),
    });

    // Keep existing paid amount if not provided or if empty string or undefined
    // Only use new paid amount if it's explicitly provided and valid
    const newPaidAmount =
      data.paidAmount !== undefined &&
      String(data.paidAmount).trim() !== "" &&
      !isNaN(Number(data.paidAmount)) &&
      Number(data.paidAmount) !== 0 // Don't use 0 unless it's explicitly provided
        ? BigInt(data.paidAmount.toString())
        : existingFee.paidAmount;

    console.log("Final values:", {
      newTotalAmount: newTotalAmount.toString(),
      newPaidAmount: newPaidAmount.toString(),
      status: data.status,
    });

    // For zero amount fees, automatically set status to PAID
    const status = newTotalAmount === BigInt(0) ? "PAID" : data.status;

    await prisma.fee.update({
      where: { id: data.id },
      data: {
        studentId: data.studentId,
        totalAmount: newTotalAmount,
        paidAmount: newPaidAmount,
        dueDate: data.dueDate,
        status: status,
      },
    });
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error in updateFee:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
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
): Promise<CurrentState> => {
  try {
    console.log("control reaches here");
    // Generate a short numeric reference, approx 10 digits
    // Use current timestamp (last 6 digits) + 4 random digits
    const ts = Date.now().toString().slice(-6);
    const rand = Math.floor(1000 + Math.random() * 9000).toString();
    const uniqueReference = `${ts}${rand}`;
    return await prisma.$transaction(
      async (tx) => {
        // 1. Create payment with generated reference
        const payment = await tx.payment.create({
          data: {
            feeId: data.feeId,
            amount: data.amount,
            method: data.method,
            date: data.date,
            reference: uniqueReference,
            transactionId: data.transactionId || null,
          },
        });

        // 2. First update the fee's paid amount
        const updatedFee = await tx.fee.update({
          where: { id: data.feeId },
          data: {
            paidAmount: { increment: BigInt(data.amount) },
          },
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            dueDate: true,
          },
        });

        // 3. Now calculate and set the status with the updated amounts
        await tx.fee.update({
          where: { id: data.feeId },
          data: {
            status: await calculateFeeStatus(data.feeId, tx),
          },
        });

        return { success: true, error: false };
      },
      { timeout: 10000 }
    );
  } catch (err: any) {
    console.error("Error creating payment:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updatePayment = async (
  currentState: CurrentState,
  data: PaymentSchema
): Promise<CurrentState> => {
  if (!data.id)
    return {
      success: false,
      error: true,
      message: "Payment ID is required for an update.",
    };

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Get existing payment
      const oldPayment = await tx.payment.findUnique({
        where: { id: String(data.id) },
        select: { amount: true, feeId: true },
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
          transactionId: data.transactionId || null,
        },
      });
      // 3. Calculate difference and update fee
      const amountDiff = BigInt(data.amount) - BigInt(oldPayment.amount);
      await tx.fee.update({
        where: { id: oldPayment.feeId },
        data: {
          paidAmount: { increment: amountDiff },
          status: await calculateFeeStatus(oldPayment.feeId, tx),
        },
      });

      return { success: true, error: false };
    });
  } catch (err: any) {
    console.error("Error updating payment:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
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
// In your actions file, you might want to add more robust error handling  
export const createAttendance = async (  
  currentState: CurrentState,  
  data: AttendanceSchema  
): Promise<CurrentState> => {  
  try {  
    // Check for existing attendance on the same day  
    const existingAttendance = await prisma.attendance.findFirst({  
      where: {  
        studentId: data.studentId,  
        date: {  
          gte: new Date(new Date(data.date).setHours(0, 0, 0, 0)),  
          lt: new Date(new Date(data.date).setHours(23, 59, 59, 999))  
        },
        ...(data.lessonId ? { lessonId: data.lessonId } : {})
      }  
    });  

    if (existingAttendance) {  
      return {   
        success: false,   
        error: true,   
        message: "Attendance already recorded for this student today"   
      };  
    }  

    await prisma.attendance.create({  
      data: {
        date: data.date,
        studentId: data.studentId,
        classId: data.classId,
        lessonId: data.lessonId || undefined,
        inTime: new Date(),
        outTime: null,
        status: data.status
      }
    });  

    return {   
      success: true,   
      error: false,  
      message: "Attendance recorded successfully"   
    };  
  } catch (err: any) {  
    console.error("Error creating attendance:", err);  
    return {   
      success: false,   
      error: true,  
      message: "Failed to create attendance",
      details: [{ message: err.message || "Unknown error" }],
    };  
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
        classId: data.classId,
        ...(data.lessonId ? { lessonId: data.lessonId } : {}),
        date: data.date,
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
        enrollments: {
          where: { leftAt: null },
          select: {
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        results: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                subject: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            exam: {
              subject: {
                name: 'asc',
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
        enrollments: {
          where: { leftAt: null },
          select: {
            class: {
              select: {
                name: true,
                grade: { select: { level: true } },
              },
            },
          }
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

export const getFeeReceiptData = async (feeId: string) => {
  try {
    const fee = await prisma.fee.findUnique({
      where: {
        id: parseInt(feeId),
      },
      include: {
        student: {
          include: {
            enrollments: {
              where: { leftAt: null },
              include: {
                class: true,
              },
            },
          },
        },
        payments: {
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!fee) {
      throw new Error('Fee not found');
    }

    return fee;
  } catch (error) {
    console.error('Error fetching fee receipt data:', error);
    throw error;
  }
};

export const createFinance = async (
  currentState: CurrentState,
  data: FinanceSchema
): Promise<CurrentState> => {
  try {
    await prisma.finance.create({
      data: {
        expenseType: data.expenseType,
        amount: BigInt(data.amount.toString()),
        description: data.description,
        updatedAt: new Date(),
      },
    });
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error creating finance record:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updateFinance = async (
  currentState: CurrentState,
  data: FinanceSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return {
      success: false,
      error: true,
      message: "Finance record ID is required for an update.",
    };
  }

  try {
    await prisma.finance.update({
      where: { id: data.id },
      data: {
        expenseType: data.expenseType,
        amount: BigInt(data.amount.toString()),
        description: data.description,
        updatedAt: new Date(),
      },
    });
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error updating finance record:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const deleteFinance = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.finance.delete({
      where: { id: parseInt(id) },
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacherAttendance = async (
  currentState: CurrentState,
  data: {
    teacherId: string;
    date: Date;
    status: "PRESENT" | "ABSENT" | "LATE";
    inTime?: string;
    outTime?: string;
  }
) => {
  try {
    // Check if attendance already exists for this teacher on this date
    const existingAttendance = await prisma.teacherAttendance.findFirst({
      where: {
        teacherId: data.teacherId,
        date: data.date,
      },
    });

    if (existingAttendance) {
      return {
        success: false,
        error: true,
        message: "Attendance already marked for this date"
      };
    }

    // Create new attendance record
    await prisma.teacherAttendance.create({
      data: {
        teacherId: data.teacherId,
        date: data.date,
        status: data.status,
        inTime: data.inTime || null,
        outTime: data.outTime || null,
      },
    });

    revalidatePath("/list/teacherattendance");
    return {
      success: true,
      error: false,
    };
  } catch (err: any) {
    console.log(err);
    return {
      success: false,
      error: true,
      message: "Failed to mark attendance",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const updateTeacherAttendance = async (
  currentState: CurrentState,
  data: {
    id?: number;
    teacherId: string;
    date: Date;
    status: "PRESENT" | "ABSENT" | "LATE";
    inTime?: string;
    outTime?: string;
  }
) => {
  if (!data.id) {
    return { success: false, error: true, message: "ID is required for update" };
  }
  try {
    await prisma.teacherAttendance.update({
      where: { id: data.id },
      data: {
        date: data.date,
        teacherId: data.teacherId,
        inTime: data.inTime || null,
        outTime: data.outTime || null,
        status: data.status
      }
    });
    revalidatePath("/list/teacherattendance");
    return { success: true, error: false };
  } catch (err: any) {
    console.error(err);
    return {
      success: false,
      error: true,
      message: err.message || "Failed to update attendance",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};

export const deleteTeacherAttendance = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id");
  if (!id || isNaN(Number(id))) {
    return { success: false, error: true, message: "Invalid ID" };
  }

  try {
    await prisma.teacherAttendance.delete({
      where: { id: Number(id) }
    });
    revalidatePath("/list/teacherattendance");
    return { success: true, error: false };
  } catch (err) {
    console.error("Delete Teacher Attendance Error:", err);
    return { success: false, error: true };
  }
};

export const transferStudentsToNextClass = async (
  data: { classId: number, nextClassId: number }
) => {
  try {
    // Get current class with its grade
    const currentClass = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { grade: true }
    });

    if (!currentClass) {
      return { success: false, error: true, message: "Current class not found" };
    }

    // Find the next grade
    const nextGrade = await prisma.grade.findFirst({
      where: { level: currentClass.grade.level + 1 }
    });

    if (!nextGrade) {
      return { success: false, error: true, message: "Next grade not found" };
    }

    // Find the selected next class
    const nextClass = await prisma.class.findUnique({
      where: { id: data.nextClassId },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    if (!nextClass) {
      return { success: false, error: true, message: "Selected next class not found" };
    }

    // Find all active enrollments for the current class **with year 2082**
    const currentEnrollments = await prisma.enrollment.findMany({
      where: { classId: data.classId, leftAt: null, year: 2082 }
    });

    // Check if next class has enough capacity
    const availableCapacity = nextClass.capacity - nextClass._count.students;
    if (availableCapacity < currentEnrollments.length) {
      return { 
        success: false, 
        error: true, 
        message: `Selected class has ${availableCapacity} spots available, but there are ${currentEnrollments.length} students to transfer` 
      };
    }

    // Mark current enrollments as left
    await prisma.enrollment.updateMany({
      where: { classId: data.classId, leftAt: null, year: 2082 },
      data: { leftAt: new Date() }
    });

    // Create new enrollments for the next class
    await prisma.$transaction(
      currentEnrollments.map(enrollment =>
        prisma.enrollment.create({
          data: {
            studentId: enrollment.studentId,
            classId: nextClass.id,
            gradeId: nextGrade.id,
            year: enrollment.year,
            joinedAt: new Date(),
            leftAt: null
          }
        })
      )
    );

    return { success: true, error: false };
  } catch (err) {
    console.error("Error in transferStudentsToNextClass:", err);
    return { success: false, error: true, message: "Failed to transfer students" };
  }
};

export const getNextGradeClasses = async (currentClassId: number) => {
  try {
    // Find the current class and its grade level
    const currentClass = await prisma.class.findUnique({
      where: { id: currentClassId },
      select: { grade: { select: { level: true } } }
    });

    if (!currentClass) {
      return { success: false, error: true, message: "Current class not found" };
    }

    // Find the next grade
    const nextGrade = await prisma.grade.findFirst({
      where: { level: currentClass.grade.level + 1 }
    });

    if (!nextGrade) {
      return { success: false, error: true, message: "Next grade not found" };
    }

    // Find all classes in the next grade with student counts
    const nextClasses = await prisma.class.findMany({
      where: {
        gradeId: nextGrade.id
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        _count: {
          select: { students: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, error: false, data: nextClasses };
  } catch (error: any) {
    console.error("Error fetching next grade classes:", error);
    return { success: false, error: true, message: "Failed to fetch next grade classes" };
  }
};

export const createBulkFees = async (
  currentState: CurrentState,
  data: { classId: number; totalAmount: number; dueDate: Date; description?: string; year: number }
): Promise<CurrentState> => {
  try {
    // Get all students enrolled in the class for the specified year
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId: data.classId,
        year: data.year,
        leftAt: null // Only active students
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            surname: true
          }
        }
      }
    });

    if (enrollments.length === 0) {
      return {
        success: false,
        error: true,
        message: "No students found in this class for the selected year"
      };
    }

    // Create fees for all students in a transaction with increased timeout
    await prisma.$transaction(async (tx) => {
      const feePromises = enrollments.map(enrollment =>
        tx.fee.create({
          data: {
            studentId: enrollment.student.id,
            totalAmount: BigInt(data.totalAmount),
            paidAmount: BigInt(0),
            dueDate: data.dueDate,
            status: "UNPAID",
            description: data.description || `Class fee for ${data.year}`
          }
        })
      );

      await Promise.all(feePromises);
    }, {
      timeout: 30000 // 30 seconds timeout
    });

    return {
      success: true,
      error: false,
      message: `Successfully created fees for ${enrollments.length} students`
    };
  } catch (err: any) {
    console.error("Error creating bulk fees:", err);
    return {
      success: false,
      error: true,
      message: err.message || "An unexpected error occurred",
      details: [{ message: err.message || "Unknown error" }],
    };
  }
};
export const getAllClassesExceptCurrent = async (currentClassId: number) => {
  try {
    const allClasses = await prisma.class.findMany({
      where: {
        id: { not: currentClassId }
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        _count: {
          select: { students: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, error: false, data: allClasses };
  } catch (error: any) {
    console.error("Error fetching all classes:", error);
    return { success: false, error: true, message: "Failed to fetch classes" };
  }
};

export const removeStudentFromClass = async (
  prevState: any,
  formData: FormData
) => {
  const enrollmentId = formData.get("enrollmentId");
  if (!enrollmentId || typeof enrollmentId !== "string") {
    return { success: false, error: true, message: "Invalid enrollment ID" };
  }
  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { leftAt: new Date() }
    });
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Error removing student from class:", err);
    return { success: false, error: true, message: err.message || "Failed to remove student" };
  }
};

export const transferSelectedStudents = async (enrollmentIds: string[], destinationClassId: number) => {
  try {
    // Get the destination class and grade
    const destClass = await prisma.class.findUnique({ where: { id: destinationClassId }, include: { grade: true } });
    if (!destClass) return { success: false, error: true, message: "Destination class not found" };

    // Update the classId and gradeId for the selected enrollments
    await prisma.enrollment.updateMany({
      where: { id: { in: enrollmentIds } },
      data: { classId: destClass.id, gradeId: destClass.gradeId }
    });

    return { success: true, error: false };
  } catch (err: any) {
    return { success: false, error: true, message: err?.message || "Failed to transfer students" };
  }
};
