import Image from "next/image";
import FinanceChart from "./FinanceChart";
import prisma from "@/lib/prisma";
import { ADToBS, BSToAD } from "bikram-sambat-js";

const FinanceChartContainer = async () => {
  // Get the current AD date and convert to BS
  const currentDate = new Date();
  const bsDate = ADToBS(currentDate.toISOString().split("T")[0]);
  const currentBSYear = parseInt(bsDate.split("-")[0]);

  // Convert BS year's start and end to AD
  const bsYearStart = `${currentBSYear}-01-01`;
  const bsYearEnd = `${currentBSYear}-12-30`; // BS has 12 months, max 30 days (varies but safe for range)

  const startDate = new Date(BSToAD(bsYearStart));
  const endDate = new Date(BSToAD(bsYearEnd));

 

  // Fetch all finance records (expenses) for the current BS year
  const expenseRecords = await prisma.finance.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Fetch all payment records (income) for the current BS year
  const incomeRecords = await prisma.payment.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Initialize monthly data structure with BS months
  const months = [
    "बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "आश्विन",
    "कार्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत्र"
  ];

  const monthlyData = months.map((month) => ({
    name: month,
    income: 0,
    expense: 0,
  }));

  // Process expense records
  expenseRecords.forEach((record) => {
    try {
      const bsDate = ADToBS(record.createdAt.toISOString().split("T")[0]);
      const bsMonth = parseInt(bsDate.split("-")[1]);
      const monthIndex = bsMonth - 1;

      

      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex].expense += Number(record.amount);
      }
    } catch (error) {
      console.error("Error processing expense record:", error);
    }
  });

  // Process income records
  incomeRecords.forEach((record) => {
    try {
      const bsDate = ADToBS(record.date.toISOString().split("T")[0]);
      const bsMonth = parseInt(bsDate.split("-")[1]);
      const monthIndex = bsMonth - 1;

    

      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex].income += Number(record.amount);
      }
    } catch (error) {
      console.error("Error processing income record:", error);
    }
  });


  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Finance ({currentBSYear} B.S.)</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <FinanceChart data={monthlyData} />
    </div>
  );
};

export default FinanceChartContainer;
