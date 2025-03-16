import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Payment, Fee, Student, Class } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

type PaymentWithRelations = Payment & {
  fee: Fee & {
    student: Student & { class: Class };
  };
};

const PaymentsListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const columns = [
    { header: "Student", accessor: "student" },
    { header: "Class", accessor: "class" },
    { header: "Amount", accessor: "amount" },
    { header: "Method", accessor: "method" },
    { header: "Date", accessor: "date" },
    { header: "Transaction ID", accessor: "transactionId" },
    ...(role === "admin" || role === "accountant"
      ? [{ header: "Actions", accessor: "actions" }]
      : []),
  ];

  const renderRow = (payment: PaymentWithRelations) => (
    <tr
      key={payment.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{`${payment.fee.student.name} ${payment.fee.student.surname}`}</td>
      <td>{payment.fee.student.class.name}</td>
      <td>{payment.amount.toFixed(2)}</td>
      <td>{payment.method}</td>
      <td>
        {new Date(payment.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td>{payment.transactionId || "N/A"}</td>
      {(role === "admin" || role === "accountant") && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="payment" type="update" data={payment} />
            <FormContainer table="payment" type="delete" id={payment.id} />
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
      fee: {
        student: {
          OR: [
            { name: { contains: queryParams.search, mode: "insensitive" } },
            { surname: { contains: queryParams.search, mode: "insensitive" } },
          ],
        },
      },
    });
  }

  // Role-based filtering
  if (role === "student") {
    query.where.AND.push({ fee: { studentId: currentUserId } });
  } else if (role === "parent") {
    query.where.AND.push({
      fee: { student: { parentId: currentUserId } },
    });
  } else if (role === "teacher") {
    query.where.AND.push({
      fee: { student: { class: { supervisorId: currentUserId } } },
    });
  }

  const [data, count] = await prisma.$transaction([
    prisma.payment.findMany({
      ...query,
      include: {
        fee: {
          include: {
            student: { include: { class: true } },
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { date: "desc" },
    }),
    prisma.payment.count({ where: query.where }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Payments</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {(role === "admin" || role === "accountant") && (
              <FormContainer table="payment" type="create" />
            )}
          </div>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default PaymentsListPage;
