import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SortDropdown from "@/components/SortDropdown";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Result, Student, Exam, Assignment, Lesson, Teacher, Class, Subject } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { ADToBS } from "bikram-sambat-js";

type ResultList = {
  id: number;
  title: string;
  studentName: string;
  studentSurname: string;
  teacherName: string;
  teacherSurname: string;
  score: number;
  className: string;
  startTime: Date;
};

type ResultWithRelations = Result & {
  student: Student;
  exam?: (Exam & {
    subject: Subject;
    class: Class & { supervisor: Teacher | null };
  }) | null;
  assignment?: (Assignment & {
    lesson: Lesson & {
      teacher: Teacher;
      class: Class;
    };
  }) | null;
};

const sortOptions = [
  { label: "Date (Newest)", value: "date", direction: "desc" as const },
  { label: "Date (Oldest)", value: "date", direction: "asc" as const },
  { label: "Score (High-Low)", value: "score", direction: "desc" as const },
  { label: "Score (Low-High)", value: "score", direction: "asc" as const },
  { label: "Student (A-Z)", value: "student.name", direction: "asc" as const },
  { label: "Student (Z-A)", value: "student.name", direction: "desc" as const },
  { label: "Exam/Assignment (A-Z)", value: "exam.title", direction: "asc" as const },
  { label: "Exam/Assignment (Z-A)", value: "exam.title", direction: "desc" as const },
];

const ResultListPage = async (
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
      header: "Title",
      accessor: "title",
    },
    {
      header: "Student",
      accessor: "student",
    },
    {
      header: "Score",
      accessor: "score",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden md:table-cell",
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

  const renderRow = (item: ResultList) => {
    const date = new Date(item.startTime);
    const bsDate = ADToBS(date.toISOString().split("T")[0]);
    const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-2 md:p-4">
          <div className="flex flex-col gap-1">
            <span className="font-medium">{item.title}</span>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600 md:hidden">
              <span>Student: {item.studentName} {item.studentSurname}</span>
              <span>Score: {item.score}</span>
              <span>Teacher: {item.teacherName} {item.teacherSurname}</span>
              <span>Class: {item.className}</span>
              <span>Date: {`${bsDate} ${time}`}</span>
            </div>
          </div>
        </td>
        <td className="hidden md:table-cell p-2 md:p-4">{item.studentName + " " + item.studentSurname}</td>
        <td className="hidden md:table-cell p-2 md:p-4">{item.score}</td>
        <td className="hidden md:table-cell p-2 md:p-4">
          {item.teacherName + " " + item.teacherSurname}
        </td>
        <td className="hidden md:table-cell p-2 md:p-4">{item.className}</td>
        <td className="hidden md:table-cell p-2 md:p-4">{`${bsDate} ${time}`}</td>
        <td className="p-2 md:p-4">
          <div className="flex items-center gap-2">
            {(role === "admin" || role === "teacher") && (
              <>
                <FormContainer table="result" type="update" data={item} />
                <FormContainer table="result" type="delete" id={item.id} />
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
  const query: Prisma.ResultWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "studentId":
            query.studentId = value;
            break;
          case "examId":
            query.examId = parseInt(value);
            break;
          case "assignmentId":
            query.assignmentId = parseInt(value);
            break;
          case "search":
            query.OR = [
              { student: { name: { contains: value, mode: "insensitive" } } },
              { exam: { title: { contains: value, mode: "insensitive" } } },
              { assignment: { title: { contains: value, mode: "insensitive" } } }
            ];
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
      query.OR = [
        { exam: { class: { supervisorId: currentUserId! } } },
        { assignment: { lesson: { teacherId: currentUserId! } } }
      ];
      break;
    case "student":
      query.studentId = currentUserId!;
      break;
    case "parent":
      query.student = {
        parentId: currentUserId!
      };
      break;
    default:
      break;
  }

  const [data, count] = await prisma.$transaction([
    prisma.result.findMany({
      where: query,
      include: {
        student: true,
        exam: {
          include: {
            subject: true,
            class: {
              include: {
                supervisor: true
              }
            }
          }
        },
        assignment: {
          include: {
            lesson: {
              include: {
                teacher: true,
                class: true
              }
            }
          }
        }
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: sort && direction ? {
        [sort.includes('.') ? sort.split('.')[0] : sort]: sort.includes('.') 
          ? { [sort.split('.')[1]]: direction }
          : direction
      } : {
        score: 'desc'
      }
    }),
    prisma.result.count({ where: query }),
  ]);

  const dataRes = (data as ResultWithRelations[]).map((item) => {
    const assessment = item.exam || item.assignment;
    if (!assessment) return null;

    let teacherName = '';
    let teacherSurname = '';
    let className = '';
    let startTime: Date | undefined = undefined;

    if (item.assignment && item.assignment.lesson) {
      teacherName = item.assignment.lesson.teacher.name;
      teacherSurname = item.assignment.lesson.teacher.surname;
      className = item.assignment.lesson.class.name;
      startTime = item.assignment.lesson.startTime || item.assignment.dueDate;
    } else if (item.exam && item.exam.class) {
      // Use class supervisor's name for exams
      teacherName = item.exam.class.supervisor?.name || '';
      teacherSurname = item.exam.class.supervisor?.surname || '';
      className = item.exam.class.name;
      startTime = item.exam.startTime;
    }

    return {
      id: item.id,
      title: assessment.title,
      studentName: item.student.name,
      studentSurname: item.student.surname,
      teacherName,
      teacherSurname,
      score: item.score,
      className,
      startTime,
    };
  }).filter(Boolean);

  return (
    <div className="bg-white p-2 md:p-4 rounded-md flex-1 m-2 md:m-4 mt-0">
      {/* TOP */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">All Results</h1>
          {role === "admin" && <FormContainer table="result" type="create" />}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className="w-full sm:w-auto">
            <TableSearch />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <SortDropdown options={sortOptions} defaultSort="date" />
          </div>
        </div>
      </div>
      {/* LIST */}
      <div className="overflow-x-auto">
        <Table columns={columns} renderRow={renderRow} data={dataRes} />
      </div>
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ResultListPage;
