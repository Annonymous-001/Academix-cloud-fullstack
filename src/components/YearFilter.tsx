'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface YearFilterProps {
  currentYear?: string;
  years?: number[];
}

export default function YearFilter({ currentYear, years }: YearFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use years from props if provided, else default to all academic years
  const academicYears = years && years.length > 0
    ? years
    : Array.from({ length: 21 }, (_, i) => 2070 + i);

  // If currentYear is undefined, default to 2082. If it's "", show "All Years".
  const selectValue = currentYear === undefined ? "2082" : currentYear;

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (year) {
      params.set('year', year);
    } else {
      params.delete('year');
    }
    
    // Reset to first page when filtering
    params.delete('page');
    
    router.push(`?${params.toString()}`);
  };

  return (
    <select
      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
      value={selectValue}
      onChange={(e) => handleYearChange(e.target.value)}
    >
      <option value="">All Years</option>
      {academicYears.map(year => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
} 