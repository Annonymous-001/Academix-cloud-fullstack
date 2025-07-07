import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SortDropdown from "@/components/SortDropdown";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

type ClassList = Class & { supervisor: Teacher, grade: { level: number } };

const sortOptions = [
  { label: "Class Name (A-Z)", value: "name", direction: "asc" as const },
  { label: "Class Name (Z-A)", value: "name", direction: "desc" as const },
  { label: "Capacity (Low-High)", value: "capacity", direction: "asc" as const },
  { label: "Capacity (High-Low)", value: "capacity", direction: "desc" as const },
  { label: "Supervisor (A-Z)", value: "supervisor.name", direction: "asc" as const },
  { label: "Supervisor (Z-A)", value: "supervisor.name", direction: "desc" as const },
];

const ClassListPage = async (
  props: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
  }
) => {
  const searchParams = await props.searchParams;

  const session = await auth();
  const role = (session.sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Class Name",
      accessor: "name",
    },
    {
      header: "Capacity",
      accessor: "capacity",
      className: "hidden md:table-cell",
    },
    {
      header: "Grade",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Supervisor",
      accessor: "supervisor",
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

  const renderRow = (item: ClassList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-2 md:p-4">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{item.name}</span>
          <div className="flex flex-wrap gap-2 text-xs text-gray-600 md:hidden">
            <span>Capacity: {item.capacity}</span>
            <span>Grade: {item.grade ? item.grade.level : <span className="text-red-500">No grade</span>}</span>
            <span>Supervisor: {item.supervisor ? `${item.supervisor.name} ${item.supervisor.surname}` : '-'}</span>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell p-2 md:p-4">{item.capacity}</td>
      <td className="hidden md:table-cell p-2 md:p-4">
        {item.grade ? item.grade.level : <span className="text-red-500">No grade</span>}
      </td>
      <td className="hidden md:table-cell p-2 md:p-4">
        {item.supervisor ? `${item.supervisor.name} ${item.supervisor.surname}` : '-'}
      </td>
      <td className="p-2 md:p-4">
        <div className="flex items-center gap-2">
          <Link href={`/list/classes/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            <>
              <FormContainer table="class" type="update" data={item} />
              <FormContainer table="class" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, sort, direction, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.ClassWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "supervisorId":
            query.supervisorId = value;
            break;
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.class.findMany({
      where: query,
      include: {
        supervisor: true,
        grade: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: sort && direction ? {
        [sort.includes('.') ? sort.split('.')[0] : sort]: sort.includes('.') 
          ? { [sort.split('.')[1]]: direction }
          : direction
      } : {
        name: 'asc'
      }
    }),
    prisma.class.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-2 md:p-4 rounded-md flex-1 m-2 md:m-4 mt-0">
      {/* TOP */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">All Classes</h1>
          {role === "admin" && <FormContainer table="class" type="create" />}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className="w-full sm:w-auto">
            <TableSearch />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <SortDropdown options={sortOptions} defaultSort="name" />
          </div>
        </div>
      </div>
      {/* LIST */}
      <div className="overflow-x-auto">
        <Table columns={columns} renderRow={renderRow} data={data} />
      </div>
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ClassListPage;
