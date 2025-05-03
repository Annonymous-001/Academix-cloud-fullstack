import Image from "next/image";
import FinanceChart from "./FinanceChart";
import prisma from "@/lib/prisma";

const FinanceChartContainer = async () => {
  // Get the current year
  const currentYear = new Date().getFullYear();
  
  // Fetch all finance records (expenses) for the current year
  const expenseRecords = await prisma.finance.findMany({
    where: {
      createdAt: {
        gte: new Date(currentYear, 0, 1), // Start of the year
        lt: new Date(currentYear + 1, 0, 1), // Start of next year
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Fetch all payment records (income) for the current year
  const incomeRecords = await prisma.payment.findMany({
    where: {
      date: {
        gte: new Date(currentYear, 0, 1),
        lt: new Date(currentYear + 1, 0, 1),
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Initialize monthly data structure
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const monthlyData = months.map(month => ({
    name: month,
    income: 0,
    expense: 0,
  }));

  // Process expense records
  expenseRecords.forEach(record => {
    const month = record.createdAt.getMonth();
    const amount = Number(record.amount);
    monthlyData[month].expense += amount;
  });

  // Process income records
  incomeRecords.forEach(record => {
    const month = record.date.getMonth();
    const amount = Number(record.amount);
    monthlyData[month].income += amount;
  });

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Finance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <FinanceChart data={monthlyData} />
    </div>
  );
};

export default FinanceChartContainer;
