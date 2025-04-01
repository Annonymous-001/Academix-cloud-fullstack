import { FeeStatus, Prisma } from "@prisma/client";

export async function calculateFeeStatus(feeId: number, client: Prisma.TransactionClient | any): Promise<FeeStatus> {
  const fee = await client.fee.findUnique({
    where: { id: feeId },
    select: { totalAmount: true, paidAmount: true, dueDate: true }
  });

  if (!fee) throw new Error("Fee not found");
  
  // Convert BigInt to string first, then to number to avoid precision issues
  const totalAmount = Number(fee.totalAmount.toString());
  const paidAmount = Number(fee.paidAmount.toString());
  
  console.log(`Fee ${feeId}: Total=${totalAmount}, Paid=${paidAmount}, Type Total=${typeof fee.totalAmount}`);
  
  // First check: if total is zero, it's automatically paid
  if (totalAmount === 0) {
    console.log(`Fee ${feeId}: Zero amount, marking as PAID`);
    return 'PAID';
  }
  
  // Second check: if paid >= total, it's fully paid
  if (paidAmount >= totalAmount) {
    console.log(`Fee ${feeId}: Fully paid`);
    return 'PAID';
  } 
  // Partial payment
  else if (paidAmount > 0) {
    // Check if overdue
    if (new Date(fee.dueDate) < new Date()) {
      console.log(`Fee ${feeId}: Partially paid but overdue`);
      return 'OVERDUE';
    }
    console.log(`Fee ${feeId}: Partially paid`);
    return 'PARTIAL';
  } 
  // No payment
  else {
    // Check if overdue
    if (new Date(fee.dueDate) < new Date()) {
      console.log(`Fee ${feeId}: Unpaid and overdue`);
      return 'OVERDUE';
    }
    console.log(`Fee ${feeId}: Unpaid`);
    return 'UNPAID';
  }
}
