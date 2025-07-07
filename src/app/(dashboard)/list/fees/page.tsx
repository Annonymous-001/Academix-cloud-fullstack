import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SortDropdown from "@/components/SortDropdown";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Fee, Student, Class } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { ADToBS } from "bikram-sambat-js";

type FeeWithRelations = Fee & {
  student: Student & { 
    enrollments: {
      class: Class;
      leftAt: Date | null;
    }[];
  };
};

const sortOptions = [
  { label: "Date (Newest)", value: "date", direction: "desc" as const },
  { label: "Date (Oldest)", value: "date", direction: "asc" as const },
  { label: "Amount (High-Low)", value: "amount", direction: "desc" as const },
  { label: "Amount (Low-High)", value: "amount", direction: "asc" as const },
  { label: "Student (A-Z)", value: "student.name", direction: "asc" as const },
  { label: "Student (Z-A)", value: "student.name", direction: "desc" as const },
];

const FeesListPage = async (
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
  const { page, sort, direction, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: any = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "studentId":
            query.studentId = value;
            break;
          case "search":
            query.OR = [
              { student: { name: { contains: value, mode: "insensitive" } } },
              { student: { StudentId: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

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

  const renderRow = (fee: FeeWithRelations) => {
    const dueDate = new Date(fee.dueDate);
    const adDateString = `${dueDate.getFullYear()}-${String(
      dueDate.getMonth() + 1
    ).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`;
    const bsDate = ADToBS(adDateString);
    const [year, month, day] = bsDate.split("-").map(Number);
    
    const nepaliMonths = [
      'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
      'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ];

    // Get current class from enrollments (where leftAt is null - still in class)
    const currentEnrollment = fee.student.enrollments[0]; // Since we're taking only 1 enrollment
    const currentClass = currentEnrollment?.class;

    return (
      <tr
        key={fee.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">{`${fee.student.name} ${fee.student.surname}`}</td>
        <td>
          {currentClass ? currentClass.name : "N/A"}
        </td>
        <td>{Number(fee.totalAmount).toLocaleString()}</td>
        <td>{Number(fee.totalAmount - fee.paidAmount).toLocaleString()}</td>
        <td>
          {`${nepaliMonths[month - 1]} ${day}, ${year}`}
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
              <Link href={`/list/fees/student/${fee.student.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                  <Image src="/view.png" alt="" width={16} height={16} />
                </button>
              </Link>
              <FormContainer table="fee" type="update" data={fee} />
              <FormContainer table="fee" type="delete" id={fee.id} />
            </div>
          </td>
        )}
      </tr>
    );
  };

  const [data, count] = await prisma.$transaction([
    prisma.fee.findMany({
      where: query,
      include: {
        student: {
          include: {
            enrollments: {
              include: {
                class: true
              },
              where: {
                leftAt: null  // Students still in the class
              },
              orderBy: {
                joinedAt: 'desc'  // Get the most recent enrollment
              },
              take: 1  // Only get the current enrollment
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
        dueDate: 'desc'
      }
    }),
    prisma.fee.count({ where: query }),
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
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <SortDropdown options={sortOptions} defaultSort="date" />
            {(role === "admin" || role === "accountant") && <FormContainer table="fee" type="create" />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default FeesListPage;