"use client";
import { ADToBS } from 'bikram-sambat-js';
import { IndianRupee } from 'lucide-react';

interface Transaction {
  id: string | number;
  type: 'Income' | 'Expense';
  description: string;
  amount: number;
  date: Date;
}

interface RecentTransactionsProps {
  payments: any[];
  expenses: any[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ payments, expenses }) => {
  const combined: Transaction[] = [
    ...payments.map(p => ({
      id: p.id,
      type: 'Income' as const,
      description: `Payment from ${p.fee.student.name} ${p.fee.student.surname}`,
      amount: Number(p.amount),
      date: new Date(p.date),
    })),
    ...expenses.map(e => ({
      id: e.id,
      type: 'Expense' as const,
      description: e.expenseType,
      amount: Number(e.amount),
      date: new Date(e.createdAt),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())
   .slice(0, 10);

  return (
    <div>
      <ul className="space-y-4">
        {combined.map(transaction => (
          <li key={`${transaction.type}-${transaction.id}`} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-50">
            <div className={`p-2 rounded-full ${transaction.type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <IndianRupee size={20} />
            </div>
            <div className="flex-grow">
              <p className="font-semibold">{transaction.description}</p>
              <p className="text-sm text-gray-500">{ADToBS(transaction.date.toISOString().split('T')[0])}</p>
            </div>
            <div className={`font-semibold ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.type === 'Income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentTransactions; 