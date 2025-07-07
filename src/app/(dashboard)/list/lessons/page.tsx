import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SortDropdown from "@/components/SortDropdown";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Lesson, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type LessonList = Lesson & { subject: Subject } & { class: Class } & {
  teacher: Teacher;
};

const sortOptions = [
  { label: "Time (Earliest)", value: "time", direction: "asc" as const },
  { label: "Time (Latest)", value: "time", direction: "desc" as const },
  { label: "Day (A-Z)", value: "day", direction: "asc" as const },
  { label: "Day (Z-A)", value: "day", direction: "desc" as const },
  { label: "Class (A-Z)", value: "class.name", direction: "asc" as const },
  { label: "Class (Z-A)", value: "class.name", direction: "desc" as const },
  { label: "Teacher (A-Z)", value: "teacher.name", direction: "asc" as const },
  { label: "Teacher (Z-A)", value: "teacher.name", direction: "desc" as const },
];

const LessonListPage = async (
  props: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
  }
) => {
  const searchParams = await props.searchParams;
  const session = await auth();
  const sessionClaims = session.sessionClaims;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  
  const columns = [
    {
      header: "Subject",
      accessor: "subject",
    },
    {
      header: "Day",
      accessor: "day",
      className: "hidden md:table-cell",
    },
    {
      header: "Time",
      accessor: "time",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: LessonList) => {
    const startTime = new Date(item.startTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const endTime = new Date(item.endTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-100"
      >
        <td className="p-4">{item.subject.name}</td>
        <td className="p-4 hidden md:table-cell">{item.day}</td>
        <td className="p-4 hidden md:table-cell">{`${startTime} - ${endTime}`}</td>
        <td className="p-4 hidden md:table-cell">
          {`${item.teacher.name} ${item.teacher.surname}`}
        </td>
        {role === "admin" && (
          <td className="p-4">
            <div className="flex items-center gap-2">
              <FormContainer table="lesson" type="update" data={item} />
              <FormContainer table="lesson" type="delete" id={item.id} />
            </div>
          </td>
        )}
      </tr>
    );
  };

  const { page, sort, direction, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  const query: Prisma.LessonWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classId = parseInt(value);
            break;
          case "teacherId":
            query.teacherId = value;
            break;
          case "search":
            query.OR = [
              { class: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: query,
      include: {
        class: true,
        teacher: true,
        subject: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: sort && direction ? {
        [sort.includes('.') ? sort.split('.')[0] : sort]: sort.includes('.') 
          ? { [sort.split('.')[1]]: direction }
          : direction
      } : {
        day: 'asc'
      }
    }),
    prisma.lesson.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP SECTION */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Lessons</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-400">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <SortDropdown options={sortOptions} defaultSort="day" />
            {role === "admin" && <FormContainer table="lesson" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST SECTION */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LessonListPage;
