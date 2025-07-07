"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  name: string;
  income: number;
  expenses: number;
}

interface IncomeExpenseChartProps {
  data: MonthlyData[];
}

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
        <Tooltip />
        <Legend />
        <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default IncomeExpenseChart; 