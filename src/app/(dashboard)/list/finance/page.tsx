import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SortDropdown from "@/components/SortDropdown";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Finance, Prisma, ExpenseType } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { ADToBS } from "bikram-sambat-js";

const sortOptions = [
  { label: "Date (Newest)", value: "createdAt", direction: "desc" as const },
  { label: "Date (Oldest)", value: "createdAt", direction: "asc" as const },
  { label: "Amount (High-Low)", value: "amount", direction: "desc" as const },
  { label: "Amount (Low-High)", value: "amount", direction: "asc" as const },
  { label: "Type (A-Z)", value: "expenseType", direction: "asc" as const },
  { label: "Type (Z-A)", value: "expenseType", direction: "desc" as const },
  { label: "Description (A-Z)", value: "description", direction: "asc" as const },
  { label: "Description (Z-A)", value: "description", direction: "desc" as const },
];

const FinanceListPage = async (
  props: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
  }
) => {
  const searchParams = await props.searchParams;
  const session = await auth();
  const sessionClaims = session.sessionClaims;
  const role = (sessionClaims?.metadata as { role?: string })?.role;

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
    { header: "Type", accessor: "type" },
    { header: "Amount", accessor: "amount" },
    { header: "Description", accessor: "description" },
    { header: "Date (BS)", accessor: "date" },
    ...(role === "admin" || role === "accountant"
      ? [{ header: "Actions", accessor: "actions" }]
      : []),
  ];

  const renderRow = (finance: Finance) => (
    <tr
      key={finance.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">
        <span className={`px-2 py-1 rounded-full text-xs ${
          finance.expenseType === "SALARY" ? "bg-blue-100 text-blue-800" :
          finance.expenseType === "BUS" ? "bg-purple-100 text-purple-800" :
          finance.expenseType === "MAINTENANCE" ? "bg-yellow-100 text-yellow-800" :
          finance.expenseType === "SUPPLIES" ? "bg-green-100 text-green-800" :
          finance.expenseType === "UTILITIES" ? "bg-red-100 text-red-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {finance.expenseType}
        </span>
      </td>
      <td>{Number(finance.amount).toLocaleString()}</td>
      <td>{finance.description || "-"}</td>
      <td>{formatBSDate(new Date(finance.createdAt))}</td>
      {(role === "admin" || role === "accountant") && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="finance" type="update" data={finance} />
            <FormContainer table="finance" type="delete" id={finance.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const { page, sort, direction, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.FinanceWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "type":
            query.expenseType = value as ExpenseType;
            break;
          case "search":
            query.description = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.finance.findMany({
      where: query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: sort && direction ? {
        [sort.includes('.') ? sort.split('.')[0] : sort]: sort.includes('.') 
          ? { [sort.split('.')[1]]: direction }
          : direction
      } : {
        createdAt: 'desc'
      }
    }),
    prisma.finance.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Finances</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <SortDropdown options={sortOptions} defaultSort="date" />
            {(role === "admin" || role === "accountant") && <FormContainer table="finance" type="create" />}
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

export default FinanceListPage;
