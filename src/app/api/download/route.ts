import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const role = (session.sessionClaims?.metadata as { role?: string })?.role;

    // Only admin can download data
    if (role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { selectedOptions } = await req.json();
    const data: any = {};

    // Fetch selected data
    if (selectedOptions.students) {
      data.students = await prisma.student.findMany({
        include: {
          parent: true,
          enrollments: {
            include: {
              class: true,
            },
          },
        },
      });
    }

    if (selectedOptions.teachers) {
      data.teachers = await prisma.teacher.findMany({
        include: {
          lessons: {
            include: {
              class: true,
              subject: true,
            },
          },
        },
      });
    }

    if (selectedOptions.classes) {
      data.classes = await prisma.class.findMany({
        include: {
          supervisor: true,
          students: true,
        },
      });
    }

    if (selectedOptions.results) {
      data.results = await prisma.result.findMany({
        include: {
          student: true,
          exam: {
            include: {
              subject: true,
              class: true,
            },
          },
          assignment: {
            include: {
              lesson: {
                include: {
                  teacher: true,
                  class: true,
                },
              },
            },
          },
        },
      });
    }

    if (selectedOptions.exams) {
      data.exams = await prisma.exam.findMany({
        include: {
          subject: true,
          class: true,
        },
      });
    }

    if (selectedOptions.assignments) {
      data.assignments = await prisma.assignment.findMany({
        include: {
          lesson: {
            include: {
              teacher: true,
              class: true,
            },
          },
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[DOWNLOAD_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 