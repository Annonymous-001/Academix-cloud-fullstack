import FinancialSummaryCard from '@/components/FinancialSummaryCard';
import IncomeExpenseChart from '@/components/IncomeExpenseChart';
import ExpenseDistributionChart from '@/components/ExpenseDistributionChart';
import RecentTransactions from '@/components/RecentTransactions';
import prisma from '@/lib/prisma';
import { IndianRupee, PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import { ADToBS } from 'bikram-sambat-js';

const AccountantDashboard = async () => {
  // Fetch aggregate financial data
  const totalRevenue = await prisma.fee.aggregate({ _sum: { paidAmount: true } });
  const outstandingFees = await prisma.fee.aggregate({ _sum: { totalAmount: true, paidAmount: true } });
  const totalExpenses = await prisma.finance.aggregate({ _sum: { amount: true } });

  const revenue = totalRevenue._sum.paidAmount ?? 0;
  const outstanding = Number(outstandingFees._sum.totalAmount ?? 0) - Number(outstandingFees._sum.paidAmount ?? 0);
  const expenses = totalExpenses._sum.amount ?? 0;
  
  const summaryData = [
    {
      title: 'Total Revenue',
      amount: `₹${Number(revenue).toLocaleString()}`,
      icon: <IndianRupee className="text-green-800" />,
      color: '#dcfce7',
    },
    {
      title: 'Outstanding Fees',
      amount: `₹${Number(outstanding).toLocaleString()}`,
      icon: <TrendingDown className="text-red-800" />,
      color: '#fee2e2',
    },
    {
      title: 'Total Expenses',
      amount: `₹${Number(expenses).toLocaleString()}`,
      icon: <TrendingUp className="text-yellow-800" />,
      color: '#fef9c3',
    },
    {
        title: 'Net Profit',
        amount: `₹${(Number(revenue) - Number(expenses)).toLocaleString()}`,
        icon: <PieChart className="text-blue-800" />,
        color: '#dbeafe',
      },
  ];

  // Fetch monthly data for the chart
  const monthlyIncome = await prisma.payment.groupBy({
    by: ['date'],
    _sum: { amount: true },
    orderBy: { date: 'asc' },
  });

  const monthlyExpenses = await prisma.finance.groupBy({
    by: ['createdAt'],
    _sum: { amount: true },
    orderBy: { createdAt: 'asc' },
  });

  const bsMonths = ["Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
  
  const monthlyChartData = bsMonths.map(monthName => ({
    name: monthName,
    income: 0,
    expenses: 0,
  }));

  monthlyIncome.forEach(item => {
    const adDate = new Date(item.date);
    const bsDate = ADToBS(adDate.toISOString().split('T')[0]);
    const bsMonth = parseInt(bsDate.split('-')[1]) - 1;
    if (monthlyChartData[bsMonth]) {
      monthlyChartData[bsMonth].income += Number(item._sum.amount);
    }
  });

  monthlyExpenses.forEach(item => {
    const adDate = new Date(item.createdAt);
    const bsDate = ADToBS(adDate.toISOString().split('T')[0]);
    const bsMonth = parseInt(bsDate.split('-')[1]) - 1;
    if (monthlyChartData[bsMonth]) {
      monthlyChartData[bsMonth].expenses += Number(item._sum.amount);
    }
  });

  // Fetch expense distribution data
  const expenseDistribution = await prisma.finance.groupBy({
    by: ['expenseType'],
    _sum: { amount: true },
  });

  const expenseChartData = expenseDistribution.map(item => ({
    name: item.expenseType.charAt(0).toUpperCase() + item.expenseType.slice(1).toLowerCase(),
    value: Number(item._sum.amount ?? 0),
  }));

  // Fetch recent transactions
  const recentPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    include: {
      fee: {
        include: {
          student: {
            select: { name: true, surname: true }
          }
        }
      }
    }
  });

  const recentExpensesList = await prisma.finance.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Accountant Dashboard</h1>
      
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryData.map(item => (
          <FinancialSummaryCard key={item.title} {...item} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Income vs. Expenses</h2>
          <IncomeExpenseChart data={monthlyChartData} />
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Expense Distribution</h2>
          <ExpenseDistributionChart data={expenseChartData} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <RecentTransactions payments={recentPayments} expenses={recentExpensesList} />
      </div>
    </div>
  );
};

export default AccountantDashboard;