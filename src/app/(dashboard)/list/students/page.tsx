import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SortDropdown from "@/components/SortDropdown";
import YearFilter from "@/components/YearFilter";

import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Student, Enrollment, Grade } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

import { auth } from "@clerk/nextjs/server";

type EnrollmentList = Enrollment & { student: Student, class: Class,grade:Grade };

const sortOptions = [
  { label: "Name (A-Z)", value: "name", direction: "asc" as const },
  { label: "Name (Z-A)", value: "name", direction: "desc" as const },
  { label: "Student ID (Low-High)", value: "StudentId", direction: "asc" as const },
  { label: "Student ID (High-Low)", value: "StudentId", direction: "desc" as const },
  { label: "Grade (A-Z)", value: "class.name", direction: "asc" as const },
  { label: "Grade (Z-A)", value: "class.name", direction: "desc" as const },
  { label: "Year (Low-High)", value: "year", direction: "asc" as const },
  { label: "Year (High-Low)", value: "year", direction: "desc" as const },
];

const StudentListPage = async (
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
      header: "Info",
      accessor: "info",
    },
    {
      header: "Student ID",
      accessor: "studentId",
      className: "hidden md:table-cell",
    },
    {
      header: "Grade",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Year",
      accessor: "year",
      className: "hidden lg:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Address",
      accessor: "address",
      className: "hidden xl:table-cell",
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

  const renderRow = (item: EnrollmentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.student.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.student.name}</h3>
          <p className="text-xs text-gray-500">{item.class.name}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.student.StudentId}</td>
      <td className="hidden md:table-cell">{item.grade?.level ?? "N/A"}</td>
      <td className="hidden lg:table-cell">{item.year}</td>
      <td className="hidden lg:table-cell">{item.student.phone}</td>
      <td className="hidden xl:table-cell">{item.student.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/students/${item.student.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            <FormContainer table="student" type="delete" id={item.student.id} />
          )}
        </div>
      </td>
    </tr>
  );

  const { page, sort, direction, year, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.EnrollmentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.student = {
              OR: [
                { name: { contains: value, mode: "insensitive" } },
                { StudentId: { contains: value, mode: "insensitive" } }
              ]
            };
            break;
          default:
            break;
        }
      }
    }
  }

  // Add year filter
  if (year) {
    query.year = parseInt(year);
  }

  // Fetch all years that exist in Enrollment for the filter
  const allYears = await prisma.enrollment.findMany({
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' }
  });
  const yearOptions = allYears.map(e => e.year).sort((a, b) => b - a);

  const [data, count] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where: query,
      include: {
        student: true,
        class: true,
        grade: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: sort && direction ? {
        [sort]: direction
      } : {
        year: 'desc'
      }
    }),
    prisma.enrollment.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="hidden md:block text-lg font-semibold">All Students</h1>
          <Link href="/upload-students">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition-colors">
              <Image src="/upload.png" alt="" width={16} height={16} />
              <span>Upload Students</span>
            </button>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {/* Year Filter */}
            <YearFilter currentYear={year ?? ""} years={yearOptions} />
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <SortDropdown options={sortOptions} defaultSort="name" />
            {role === "admin" && <FormContainer table="student" type="create" />}
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

export default StudentListPage;
