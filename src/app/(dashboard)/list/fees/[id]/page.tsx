import { getUserAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Receipt, Plus } from "lucide-react";
import Link from "next/link";
import { FeeStatus } from "@prisma/client";
import FormContainer from "@/components/FormContainer";

const FeeDetailsPage = async (
  props: {
    params: Promise<{ id: string }>;
  }
) => {
  const params = await props.params;

  const {
    id
  } = params;

  const { role } = await getUserAuth();

  const fee = await prisma.fee.findUnique({
    where: { id: parseInt(id) },
    include: {
      student: {
        include: {
          class: true,
        },
      },
      payments: {
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!fee) {
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

  const calculateTotalPaid = () => {
    return fee.payments.reduce((total, payment) => total + Number(payment.amount), 0);
  };

  const calculateRemainingAmount = () => {
    const totalPaid = calculateTotalPaid();
    return Number(fee.totalAmount) - totalPaid;
  };

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Fee Details</h1>
        <div className="flex gap-2">
          <Link href={`/list/fees/student/${fee.studentId}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <Link href={`/list/fees/${id}/receipt`}>
            <Button variant="outline">
              <Receipt className="h-4 w-4 mr-1" />
              Receipt
            </Button>
          </Link>
          {role === "admin" && (
            <FormContainer table="payment" type="create" relatedData={{ feeId: id }} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Student Information</h2>
          <div className="space-y-2">
            <p><span className="text-gray-500">Name:</span> {fee.student.name} {fee.student.surname}</p>
            <p><span className="text-gray-500">Class:</span> {fee.student.class.name}</p>
            <p><span className="text-gray-500">Roll No:</span> {fee.student.StudentId}</p>
            <p><span className="text-gray-500">Email:</span> {fee.student.email || "N/A"}</p>
            <p><span className="text-gray-500">Phone:</span> {fee.student.phone || "N/A"}</p>
          </div>
        </div>

        <div className="bg-white rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Fee Information</h2>
          <div className="space-y-2">
            <p><span className="text-gray-500">Fee ID:</span> {fee.id}</p>
            <p><span className="text-gray-500">Description:</span> {fee.description || "No description"}</p>
            <p><span className="text-gray-500">Total Amount:</span> {Number(fee.totalAmount).toLocaleString()}</p>
            <p><span className="text-gray-500">Due Date:</span> {format(new Date(fee.dueDate), "dd/MM/yyyy")}</p>
            <p>
              <span className="text-gray-500">Status:</span>{" "}
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(fee.status)}`}>
                {fee.status}
              </span>
            </p>
            <p><span className="text-gray-500">Created:</span> {format(new Date(fee.createdAt), "dd/MM/yyyy")}</p>
            <p><span className="text-gray-500">Last Updated:</span> {format(new Date(fee.updatedAt), "dd/MM/yyyy")}</p>
          </div>
        </div>

        <div className="bg-white rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
          <div className="space-y-2">
            <p><span className="text-gray-500">Total Amount:</span> {Number(fee.totalAmount).toLocaleString()}</p>
            <p><span className="text-gray-500">Total Paid:</span> {calculateTotalPaid().toLocaleString()}</p>
            <p><span className="text-gray-500">Remaining Amount:</span> {calculateRemainingAmount().toLocaleString()}</p>
            <p><span className="text-gray-500">Payment Count:</span> {fee.payments.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md p-4">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Date</th>
                <th className="text-left py-2 px-4">Transaction ID</th>
                <th className="text-left py-2 px-4">Method</th>
                <th className="text-left py-2 px-4">Reference</th>
                <th className="text-left py-2 px-4">Amount</th>
                <th className="text-left py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fee.payments.length > 0 ? (
                fee.payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{format(new Date(payment.date), "dd/MM/yyyy")}</td>
                    <td className="py-2 px-4">{payment.transactionId || "N/A"}</td>
                    <td className="py-2 px-4">{payment.method}</td>
                    <td className="py-2 px-4">{payment.reference || "N/A"}</td>
                    <td className="py-2 px-4">{Number(payment.amount).toLocaleString()}</td>
                    <td className="py-2 px-4">
                      {role === "admin" && (
                        <FormContainer table="payment" type="update" data={payment} />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    No payments recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeeDetailsPage;
