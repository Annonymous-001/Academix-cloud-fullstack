import React from 'react';

interface FinancialSummaryCardProps {
  title: string;
  amount: string;
  icon: React.ReactNode;
  color: string;
}

const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({ title, amount, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
      <div className={`p-3 rounded-full`} style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{amount}</p>
      </div>
    </div>
  );
};

export default FinancialSummaryCard; 