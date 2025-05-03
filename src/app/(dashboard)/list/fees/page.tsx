import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Fee, Student, Class } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import SortDropdown from "@/components/SortDropdown";

type FeeWithRelations = Fee & {
  student: Student & { class: Class };
};

const FeesListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  // --- Fetch all fees for summary cards ---
  const allFees = await prisma.fee.findMany({
    include: { student: true },
  });

  // --- Calculate summary values ---
  const now = new Date();
  const totalFees = allFees.reduce((sum, f) => sum + Number(f.totalAmount), 0);
  const collected = allFees.reduce((sum, f) => sum + Number(f.paidAmount), 0);
  const pending = allFees.filter(f => f.status !== "PAID").reduce((sum, f) => sum + (Number(f.totalAmount) - Number(f.paidAmount)), 0);
  const overdue = allFees.filter(f => f.status !== "PAID" && new Date(f.dueDate) < now).reduce((sum, f) => sum + (Number(f.totalAmount) - Number(f.paidAmount)), 0);

  // --- Sort logic ---
  const { page, sort, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  let orderBy: any = { dueDate: "asc" };
  if (sort === "amount") orderBy = { totalAmount: "desc" };
  if (sort === "status") orderBy = { status: "asc" };
  if (sort === "dueDate") orderBy = { dueDate: "asc" };

  const columns = [
    { header: "Student", accessor: "student" },
    { header: "Class", accessor: "class" },
    { header: "Amount", accessor: "amount" },
    { header: "Due Amount", accessor: "dueAmount" },
    { header: "Due Date", accessor: "dueDate" },
    { header: "Status", accessor: "status" },
    ...(role === "admin" || role === "accountant"
      ? [{ header: "Actions", accessor: "actions" }]
      : []),
  ];

  const renderRow = (fee: FeeWithRelations) => (
    <tr
      key={fee.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{`${fee.student.name} ${fee.student.surname}`}</td>
      <td>
        {(() => {
          const className = fee.student.class.name.replace('Class ', '');
          const [grade, section] = className.split('-');
          return section ? `${grade}${section}` : grade;
        })()}
      </td>
      <td>{Number(fee.totalAmount).toLocaleString()}</td>
      <td>{Number(fee.totalAmount - fee.paidAmount).toLocaleString()}</td>

      <td>
        {new Date(fee.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td>
        <span className={`px-2 py-1 rounded-full text-xs ${
          fee.status === "PAID" ? "bg-green-100 text-green-800" :
          fee.status === "UNPAID" ? "bg-red-100 text-red-800" :
          fee.status === "PARTIAL" ? "bg-yellow-100 text-yellow-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {fee.status}
        </span>
      </td>
      {(role === "admin" || role === "accountant") && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="fee" type="update" data={fee} />
            <FormContainer table="fee" type="delete" id={fee.id} />
            {/* <FormContainer 
              table="payment" 
              type="create" 
              data={{ feeId: fee.id }}
             
            /> */}
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
      student: {
        OR: [
          { name: { contains: queryParams.search, mode: "insensitive" } },
          { surname: { contains: queryParams.search, mode: "insensitive" } },
        ]
      }
    });
  }

  // Role-based filtering
  if (role === "student") {
    query.where.AND.push({ studentId: currentUserId });
  } else if (role === "parent") {
    query.where.AND.push({
      student: { parentId: currentUserId }
    });
  } else if (role === "teacher") {
    query.where.AND.push({
      student: {
        class: { supervisorId: currentUserId }
      }
    });
  }

  const [data, count] = await prisma.$transaction([
    prisma.fee.findMany({
      ...query,
      include: {
        student: {
          include: { class: true }
        }
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy,
    }),
    prisma.fee.count({ where: query.where }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <CardTitle className="text-base">Total Fees</CardTitle>
            <div className="text-2xl font-bold">${totalFees.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CardTitle className="text-base">Collected</CardTitle>
            <div className="text-2xl font-bold">${collected.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{((collected/totalFees)*100 || 0).toFixed(0)}% of total fees</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CardTitle className="text-base">Pending</CardTitle>
            <div className="text-2xl font-bold">${pending.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CardTitle className="text-base">Overdue</CardTitle>
            <div className="text-2xl font-bold">${overdue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
      {/* --- End Summary Cards --- */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Fees</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <SortDropdown sort={sort} />
          <div className="flex items-center gap-4 self-end">
            {(role === "admin" || role === "accountant") && (
              <FormContainer table="fee" type="create" />
            )}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default FeesListPage;