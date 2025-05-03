import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Finance } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const FinanceListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    { header: "Type", accessor: "type" },
    { header: "Amount", accessor: "amount" },
    { header: "Description", accessor: "description" },
    { header: "Date", accessor: "date" },
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
      <td>
        {new Date(finance.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
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

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: any = {
    where: {
      AND: []
    }
  };

  // Search filter
  if (queryParams.search) {
    query.where.AND.push({
      OR: [
        { description: { contains: queryParams.search, mode: "insensitive" } },
        { expenseType: { contains: queryParams.search, mode: "insensitive" } },
      ]
    });
  }

  // Only admin and accountant can access
  if (role !== "admin" && role !== "accountant") {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold text-red-500">Access Denied</h1>
        <p>You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const [data, count] = await prisma.$transaction([
    prisma.finance.findMany({
      ...query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.finance.count({ where: query.where }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Financial Records</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {(role === "admin" || role === "accountant") && (
              <FormContainer table="finance" type="create" />
            )}
          </div>
        </div>
      </div>
      
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default FinanceListPage;
