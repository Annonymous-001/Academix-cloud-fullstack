import { getUserAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { FeeStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Download, Receipt } from "lucide-react";
import Link from "next/link";
import FormContainer from "@/components/FormContainer";

const StudentFeesPage = async (
  props: {
    params: Promise<{ id: string }>;
  }
) => {
  const params = await props.params;

  const {
    id
  } = params;

  const { role } = await getUserAuth();

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      fees: {
        include: {
          payments: {
            orderBy: {
              date: "desc",
            },
          },
        },
        orderBy: {
          dueDate: "desc",
        },
      },
      class: true,
    },
  });

  if (!student) {
    return notFound();
  }

  const getStatusColor = (status: FeeStatus) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "UNPAID":
        return "bg-red-100 text-red-800";
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-800";
      case "OVERDUE":
        return "bg-orange-100 text-orange-800";
      case "WAIVED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateTotalPaid = (payments: any[]) => {
    return payments.reduce((total, payment) => total + Number(payment.amount), 0);
  };

  const calculateRemainingAmount = (fee: any) => {
    const totalPaid = calculateTotalPaid(fee.payments);
    return Number(fee.totalAmount) - totalPaid;
  };

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          {student.name} {student.surname}&apos;s Fees
        </h1>
        <div className="flex gap-2">
          <Link href={`/list/students/${student.id}`}>
            <Button variant="outline">Back to Student</Button>
          </Link>
          {role === "admin" && (
            <FormContainer table="fee" type="create" relatedData={{ studentId: student.id }} />
          )}
        </div>
      </div>

      <div className="bg-white rounded-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm text-gray-500">Total Fees</h3>
            <p className="text-2xl font-semibold">
              {student.fees.length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="text-sm text-gray-500">Total Paid</h3>
            <p className="text-2xl font-semibold">
              {student.fees.reduce((total, fee) => total + calculateTotalPaid(fee.payments), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-md">
            <h3 className="text-sm text-gray-500">Total Due</h3>
            <p className="text-2xl font-semibold">
              {student.fees.reduce((total, fee) => total + calculateRemainingAmount(fee), 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Fee ID</th>
                <th className="text-left py-2 px-4">Description</th>
                <th className="text-left py-2 px-4">Total Amount</th>
                <th className="text-left py-2 px-4">Paid Amount</th>
                <th className="text-left py-2 px-4">Due Date</th>
                <th className="text-left py-2 px-4">Status</th>
                <th className="text-left py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {student.fees.map((fee) => (
                <tr key={fee.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{fee.id}</td>
                  <td className="py-2 px-4">{fee.description || "No description"}</td>
                  <td className="py-2 px-4">{Number(fee.totalAmount).toLocaleString()}</td>
                  <td className="py-2 px-4">{calculateTotalPaid(fee.payments).toLocaleString()}</td>
                  <td className="py-2 px-4">{format(new Date(fee.dueDate), "dd/MM/yyyy")}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(fee.status)}`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex gap-2">
                      <Link href={`/list/fees/${fee.id}`}>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </Link>
                      <Link href={`/list/fees/${fee.id}/receipt`}>
                        <Button variant="outline" size="sm">
                          <Receipt className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentFeesPage; 