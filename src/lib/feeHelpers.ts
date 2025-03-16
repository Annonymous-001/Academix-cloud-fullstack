import { FeeStatus, Prisma } from "@prisma/client";

export const calculateFeeStatus = async (
  feeId: number,
  tx: Prisma.TransactionClient
): Promise<FeeStatus> => {
  const fee = await tx.fee.findUnique({
    where: { id: feeId },
    select: { totalAmount: true, paidAmount: true, dueDate: true }
  });

  if (!fee) throw new Error("Fee not found");

  if (fee.paidAmount >= fee.totalAmount) return "PAID";
  if (fee.paidAmount > 0) return "PARTIAL";
  if (new Date() > fee.dueDate) return "OVERDUE";
  
  return "UNPAID";
};
