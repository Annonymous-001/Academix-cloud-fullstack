import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SortDropdown from "@/components/SortDropdown";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Attendance, Student, Class, Lesson } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { ADToBS } from "bikram-sambat-js";
import Image from "next/image";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type AttendanceWithRelations = Attendance & {
  student: Student & {
    enrollments: {
      class: Class;
      leftAt: Date | null;
    }[];
  };
  lesson: Lesson;
};

const sortOptions = [
  { label: "Date (Newest)", value: "date", direction: "desc" as const },
  { label: "Date (Oldest)", value: "date", direction: "asc" as const },
  { label: "Student Name (A-Z)", value: "student.name", direction: "asc" as const },
  { label: "Student Name (Z-A)", value: "student.name", direction: "desc" as const },
  { label: "Class (A-Z)", value: "student.class.name", direction: "asc" as const },
  { label: "Class (Z-A)", value: "student.class.name", direction: "desc" as const },
  { label: "Status (A-Z)", value: "status", direction: "asc" as const },
  { label: "Status (Z-A)", value: "status", direction: "desc" as const },
];

const AttendanceListPage = async (
  props: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
  }
) => {
  const searchParams = await props.searchParams;
  const session = await auth();
  const userId = session.userId;
  const sessionClaims = session.sessionClaims;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  // --- Summary Card Calculations ---
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const totalStudents = await prisma.student.count();
  
  // Get today's attendance records
  const todayAttendance = await prisma.attendance.findMany({
    where: {
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    },
    orderBy: { date: 'desc' }
  });

  const presentToday = todayAttendance.filter(a => a.status === "PRESENT").length;
  const absentToday = todayAttendance.filter(a => a.status === "ABSENT").length;
  const lateToday = todayAttendance.filter(a => a.status === "LATE").length;
  const attendancePercentage = totalStudents > 0 ? ((presentToday + lateToday) / totalStudents) * 100 : 0;
  // --- End Summary Card Calculations ---

  const nepaliMonths = [
    'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
    'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
  ];

  const formatBSDate = (date: Date) => {
    const bsDate = ADToBS(date.toISOString().split('T')[0]);
    const [year, month, day] = bsDate.split('-').map(Number);
    return `${nepaliMonths[month - 1]} ${day-1}, ${year}`;
  };

  const columns = [
    { header: "Student", accessor: "student" },
    { header: "Class", accessor: "class" },
    { header: "Lesson", accessor: "lesson" },
    { header: "Date (BS)", accessor: "date" },
    { header: "Status", accessor: "status" },
    ...(role === "admin" || role === "teacher"
      ? [{ header: "Actions", accessor: "actions" }]
      : []),
  ];

  const renderRow = (attendance: AttendanceWithRelations) => {
    // Get the current class from enrollments
    const currentEnrollment = attendance.student.enrollments.find(e => e.leftAt === null);
    const studentClass = currentEnrollment?.class;

    return (
      <tr
        key={attendance.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">{`${attendance.student.name} ${attendance.student.surname}`}</td>
        <td>{studentClass ? studentClass.name : "N/A"}</td>
        <td>{attendance.lesson?.name || "General"}</td>
        <td>{formatBSDate(new Date(attendance.date))}</td>
        <td>
          <span className={`px-2 py-1 rounded-full text-xs ${
            attendance.status === "PRESENT" ? "bg-green-100 text-green-800" :
            attendance.status === "ABSENT" ? "bg-red-100 text-red-800" :
            attendance.status === "LATE" ? "bg-yellow-100 text-yellow-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {attendance.status}
          </span>
        </td>
        {(role === "admin" || role === "teacher") && (
          <td>
            <div className="flex items-center gap-2">
              <FormContainer table="attendance" type="update" data={attendance} />
              <FormContainer table="attendance" type="delete" id={attendance.id} />
            </div>
          </td>
        )}
      </tr>
    );
  };

  const { page, sort, direction, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: any = {
    where: {
      AND: [],
    },
  };

  // Search filter
  if (queryParams.search) {
    query.where.AND.push({
      student: {
        OR: [
          { name: { contains: queryParams.search, mode: "insensitive" } },
          { surname: { contains: queryParams.search, mode: "insensitive" } },
        ],
      },
    });
  }

  // Role-based filtering
  if (role === "student") {
    query.where.AND.push({ studentId: currentUserId });
  } else if (role === "parent") {
    query.where.AND.push({
      student: { parentId: currentUserId },
    });
  } else if (role === "teacher") {
    // For teachers, show attendance for their supervised classes
    const teacherClasses = await prisma.class.findMany({
      where: {
        OR: [
          { supervisorId: currentUserId || undefined },
          { lessons: { some: { teacherId: currentUserId || undefined } } }
        ]
      },
      select: { id: true }
    });
    
    query.where.AND.push({
      classId: {
        in: teacherClasses.map(c => c.id)
      }
    });
  }

  const [data, count] = await prisma.$transaction([
    prisma.attendance.findMany({
      ...query,
      include: {
        student: {
          include: {
            enrollments: {
              include: {
                class: true
              },
              where: {
                leftAt: null
              }
            }
          }
        },
        lesson: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: sort && direction ? {
        [sort.includes('.') ? sort.split('.')[0] : sort]: sort.includes('.') 
          ? { [sort.split('.')[1]]: direction }
          : direction
      } : {
        date: 'desc'
      }
    }),
    prisma.attendance.count({ where: query.where }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <CardTitle className="text-base">Total Students</CardTitle>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CardTitle className="text-base">Present Today</CardTitle>
            <div className="text-2xl font-bold">{presentToday}</div>
            <div className="text-xs text-gray-500">{attendancePercentage.toFixed(0)}% attendance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CardTitle className="text-base">Absent Today</CardTitle>
            <div className="text-2xl font-bold">{absentToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CardTitle className="text-base">Late Today</CardTitle>
            <div className="text-2xl font-bold">{lateToday}</div>
          </CardContent>
        </Card>
      </div>
      {/* --- End Summary Cards --- */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Attendance Records</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <SortDropdown options={sortOptions} defaultSort="date" />
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="attendance" type="create" />
            )}
          </div>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AttendanceListPage;
