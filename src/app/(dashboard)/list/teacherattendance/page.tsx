import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { TeacherAttendance, Teacher } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import SortDropdown from "@/components/SortDropdown";
import { ADToBS } from "bikram-sambat-js";

type TeacherAttendanceWithRelations = TeacherAttendance & {
  teacher: Teacher;
};

const sortOptions = [
  { label: "Date (Newest)", value: "date", direction: "desc" as const },
  { label: "Date (Oldest)", value: "date", direction: "asc" as const },
  { label: "Teacher (A-Z)", value: "teacher", direction: "asc" as const },
  { label: "Teacher (Z-A)", value: "teacher", direction: "desc" as const },
  { label: "Status (A-Z)", value: "status", direction: "asc" as const },
  { label: "Status (Z-A)", value: "status", direction: "desc" as const },
];

const TeacherAttendanceListPage = async (
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

  const nepaliMonths = [
    'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
    'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
  ];

  const formatBSDate = (date: Date) => {
    const bsDate = ADToBS(date.toISOString().split('T')[0]);
    const [year, month, day] = bsDate.split('-').map(Number);
    return `${nepaliMonths[month - 1]} ${day}, ${year}`;
  };

  // --- Fetch all attendance for summary cards ---
  const allAttendance = await prisma.teacherAttendance.findMany({
    include: { teacher: true },
    orderBy: { date: 'desc' }
  });

  // --- Calculate summary values ---
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const totalTeachers = await prisma.teacher.count();
  
  // Get today's attendance records
  const todayAttendance = await prisma.teacherAttendance.findMany({
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
  const attendancePercentage = totalTeachers > 0 ? ((presentToday + lateToday) / totalTeachers) * 100 : 0;

  // --- Sort logic ---
  const { page, sort, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  let orderBy: any = { date: "desc" };
  if (sort === "teacher") orderBy = { teacher: { name: "asc" } };
  if (sort === "status") orderBy = { status: "asc" };
  if (sort === "date") orderBy = { date: "desc" };

  const columns = [
    { header: "Teacher", accessor: "teacher" },
    { header: "Date (BS)", accessor: "date" },
    { header: "In Time", accessor: "inTime" },
    { header: "Out Time", accessor: "outTime" },
    { header: "Status", accessor: "status" },
    ...(role === "admin" ? [{ header: "Actions", accessor: "actions" }] : []),
  ];

  const renderRow = (attendance: TeacherAttendanceWithRelations) => (
    <tr
      key={attendance.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{`${attendance.teacher.name} ${attendance.teacher.surname}`}</td>
      <td>{formatBSDate(new Date(attendance.date))}</td>
      <td>
        {attendance.inTime ? attendance.inTime : "-"}
      </td>
      <td>
        {attendance.outTime ? attendance.outTime : "-"}
      </td>
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
      {role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="teacherattendance" type="update" data={attendance} />
            <FormContainer table="teacherattendance" type="delete" id={attendance.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const query: any = {
    where: {
      AND: []
    }
  };

  // Search filter
  if (queryParams.search) {
    query.where.AND.push({
      teacher: {
        OR: [
          { name: { contains: queryParams.search, mode: "insensitive" } },
          { surname: { contains: queryParams.search, mode: "insensitive" } },
        ]
      }
    });
  }

  // Role-based filtering
  if (role === "teacher") {
    query.where.AND.push({ teacherId: currentUserId });
  }

  const [data, count] = await prisma.$transaction([
    prisma.teacherAttendance.findMany({
      where: query.where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true
          }
        }
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy,
    }),
    prisma.teacherAttendance.count({ where: query.where }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <CardTitle className="text-base">Total Teachers</CardTitle>
            <div className="text-2xl font-bold">{totalTeachers}</div>
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
        <h1 className="hidden md:block text-lg font-semibold">Teacher Attendance</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <SortDropdown options={sortOptions} defaultSort="date" />
          <div className="flex items-center gap-4 self-end">
            {role === "admin" && (
              <FormContainer table="teacherattendance" type="create" />
            )}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default TeacherAttendanceListPage; 