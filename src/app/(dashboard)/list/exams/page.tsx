import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SortDropdown from "@/components/SortDropdown";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Exam, Prisma, Subject } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { ADToBS } from "bikram-sambat-js";

type ExamList = Exam & {
  subject: Subject;
  class: Class;
};

const sortOptions = [
  { label: "Date (Newest)", value: "startTime", direction: "desc" as const },
  { label: "Date (Oldest)", value: "startTime", direction: "asc" as const },
  { label: "Title (A-Z)", value: "title", direction: "asc" as const },
  { label: "Title (Z-A)", value: "title", direction: "desc" as const },
  { label: "Class (A-Z)", value: "class.name", direction: "asc" as const },
  { label: "Class (Z-A)", value: "class.name", direction: "desc" as const },
  { label: "Subject (A-Z)", value: "subject.name", direction: "asc" as const },
  { label: "Subject (Z-A)", value: "subject.name", direction: "desc" as const },
];

const ExamListPage = async (
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
    {
      header: "Subject Name",
      accessor: "name",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: ExamList) => {
    const startDate = new Date(item.startTime);
    const bsDate = ADToBS(startDate.toISOString().split('T')[0]);
    const [year, month, day] = bsDate.split('-').map(Number);
    
    const nepaliMonths = [
      'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
      'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ];

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.subject.name}</td>
        <td>{item.class.name}</td>
        <td className="hidden md:table-cell">
          {`${nepaliMonths[month - 1]} ${day }, ${year}`}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {(role === "admin" || role === "teacher") && (
              <>
                <FormContainer table="exam" type="update" data={item} />
                <FormContainer table="exam" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const { page, sort, direction, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.ExamWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classId = parseInt(value);
            break;
          case "subjectId":
            query.subjectId = parseInt(value);
            break;
          case "search":
            query.title = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS
  switch (role) {
    case "admin":
      break;
    case "teacher":
      // Get teacher's classes and filter exams by those classes
      const teacherClasses = await prisma.class.findMany({
        where: {
          supervisorId: currentUserId!
        },
        select: {
          id: true
        }
      });
      query.classId = {
        in: teacherClasses.map(c => c.id)
      };
      break;
    case "student":
      query.class = {
        students: {
          some: {
            id: currentUserId!,
          },
        },
      };
      break;
    case "parent":
      query.class = {
        students: {
          some: {
            student: {
              parentId: currentUserId!,
            },
          },
        },
      };
      break;
    default:
      break;
  }

  const [data, count] = await prisma.$transaction([
    prisma.exam.findMany({
      where: query,
      include: {
        subject: true,
        class: true
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: sort && direction ? {
        [sort.includes('.') ? sort.split('.')[0] : sort]: sort.includes('.') 
          ? { [sort.split('.')[1]]: direction }
          : direction
      } : {
        startTime: 'desc'
      }
    }),
    prisma.exam.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Exams</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <SortDropdown options={sortOptions} defaultSort="date" />
            {role === "admin" && <FormContainer table="exam" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ExamListPage;
