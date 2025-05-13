import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Attendance, Student, Class, Lesson } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

type AttendanceWithRelations = Attendance & {
  student: Student & { class: Class };
  lesson: Lesson;
};

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

  const columns = [
    { header: "Student", accessor: "student" },
    { header: "Class", accessor: "class" },
    { header: "Lesson", accessor: "lesson" },
    { header: "Date", accessor: "date" },
    { header: "Status", accessor: "status" },
    ...(role === "admin" || role === "teacher"
      ? [{ header: "Actions", accessor: "actions" }]
      : []),
  ];

  const renderRow = (attendance: AttendanceWithRelations) => (
    <tr
      key={attendance.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{`${attendance.student.name} ${attendance.student.surname}`}</td>
      <td>{attendance.student.class.name}</td>
      <td>{attendance.lesson?.name || "General"}</td>
      <td>
        {new Date(attendance.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
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

  const { page, ...queryParams } = searchParams;
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
        student: { include: { class: true } },
        lesson: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { date: "desc" },
    }),
    prisma.attendance.count({ where: query.where }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Attendance Records</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
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
