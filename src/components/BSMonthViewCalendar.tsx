import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ADToBS, BSToAD } from 'bikram-sambat-js';

// Type definitions for Bikram Sambat functionality
interface BSDate {
  year: number;
  month: number;
  day: number;
}

interface BSCalendarData {
  year: number;
  month: number;
  monthName: string;
  daysInMonth: number;
  startDay: number; // 0 = Sunday, 1 = Monday, etc.
}

interface BSMonthViewCalendarProps {
  onDateSelect?: (date: BSDate) => void;
  initialDate?: string; // AD date string (YYYY-MM-DD) from URL param
}

// Bikram Sambat utility functions (simplified implementation - ideally from a shared file)
class BikramSambat {
  private static monthNames = [
    'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
    'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
  ];

  private static monthNamesEn = [
    'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
  ];

  private static daysInMonths: { [key: string]: number[] } = {
    '2081': [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    '2082': [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    '2083': [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  };

  static ADToBS(adDateString: string): BSDate {
    const bsDate = ADToBS(adDateString);
    const [year, month, day] = bsDate.split('-').map(Number);
    return { year, month, day };
  }

  static BSToAD(bsDate: BSDate): string {
    const bsDateString = `${bsDate.year}-${bsDate.month.toString().padStart(2, '0')}-${bsDate.day.toString().padStart(2, '0')}`;
    return BSToAD(bsDateString);
  }

  static getCurrentBSDate(): BSDate {
    const today = new Date();
    const yearAD = today.getFullYear();
    const monthAD = today.getMonth() + 1;
    const dayAD = today.getDate();
    const adDateString = `${yearAD}-${String(monthAD).padStart(2, '0')}-${String(dayAD).padStart(2, '0')}`;
    const bsDate = ADToBS(adDateString);
    const [year, month, day] = bsDate.split('-').map(Number);
    return { year, month, day };
  }

  static getMonthName(month: number, nepali = false): string {
    return nepali ? this.monthNames[month - 1] : this.monthNamesEn[month - 1];
  }

  static getDaysInMonth(year: number, month: number): number {
    const yearData = this.daysInMonths[year.toString()];
    return yearData ? yearData[month - 1] : 30; // Default to 30 if data not available
  }

  static getStartDayOfMonth(year: number, month: number): number {
    const bsDateString = `${year}-${month.toString().padStart(2, '0')}-01`;
    const adDateString = BSToAD(bsDateString);
    const date = new Date(adDateString);
    // Adjust for local timezone
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return localDate.getDay();
  }

  static isValidDate(year: number, month: number, day: number): boolean {
    if (month < 1 || month > 12) return false;
    if (day < 1) return false;
    return day <= this.getDaysInMonth(year, month);
  }
}

const BSMonthViewCalendar: React.FC<BSMonthViewCalendarProps> = ({ onDateSelect, initialDate }) => {
  const [currentBSDate, setCurrentBSDate] = useState<BSDate>(BikramSambat.getCurrentBSDate());
  const [viewYear, setViewYear] = useState<number>(currentBSDate.year);
  const [viewMonth, setViewMonth] = useState<number>(currentBSDate.month);
  const [selectedDate, setSelectedDate] = useState<BSDate | null>(null);

  useEffect(() => {
    if (initialDate) {
      // Convert initialDate (AD string) to BSDate
      const initialBSDate = BikramSambat.ADToBS(initialDate);
      setSelectedDate(initialBSDate);
      setViewYear(initialBSDate.year);
      setViewMonth(initialBSDate.month);
    } else {
         setSelectedDate(currentBSDate);
         setViewYear(currentBSDate.year);
         setViewMonth(currentBSDate.month);
    }
  }, [currentBSDate, initialDate]);

  const dayNames = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const generateCalendar = (): (number | null)[][] => {
    const daysInMonth = BikramSambat.getDaysInMonth(viewYear, viewMonth);
    const startDay = BikramSambat.getStartDayOfMonth(viewYear, viewMonth);
    
    const calendar: (number | null)[][] = [];
    let week: (number | null)[] = [];
    
    // Fill empty cells before the first day
    for (let i = 0; i < startDay; i++) {
      week.push(null);
    }
    
    // Fill the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }
    
    // Fill remaining empty cells
    while (week.length < 7 && week.length > 0) {
      week.push(null);
    }
    
    if (week.length > 0) {
      calendar.push(week);
    }
    
    return calendar;
  };

  const handleDateClick = (day: number) => {
    const newDate: BSDate = { year: viewYear, month: viewMonth, day };
    setSelectedDate(newDate);
    onDateSelect?.(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (viewMonth === 1) {
        setViewMonth(12);
        setViewYear(viewYear - 1);
      } else {
        setViewMonth(viewMonth - 1);
      }
    } else {
      if (viewMonth === 12) {
        setViewMonth(1);
        setViewYear(viewYear + 1);
      } else {
        setViewMonth(viewMonth + 1);
      }
    }
  };

  const isToday = (day: number): boolean => {
     // This logic assumes currentBSDate is accurately set to today's BS date
    return (
      day === currentBSDate.day &&
      viewMonth === currentBSDate.month &&
      viewYear === currentBSDate.year
    );
  };

  const isSelected = (day: number): boolean => {
    return (
      selectedDate !== null &&
      day === selectedDate.day &&
      viewMonth === selectedDate.month &&
      viewYear === selectedDate.year
    );
  };

  const calendar = generateCalendar();

  return (
    <div className="bg-white rounded-lg shadow p-4 w-full max-w-md mx-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="font-semibold text-lg text-gray-800">
            {BikramSambat.getMonthName(viewMonth, true)} {viewYear}
          </div>
          <div className="text-sm text-gray-600">
            {BikramSambat.getMonthName(viewMonth)} {viewYear}
          </div>
        </div>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-600 mb-2">
        {dayNames.map((day, index) => (
          <div key={index} className="p-1">
             <div>{day}</div>
             <div className="text-xs">{dayNamesEn[index]}</div>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendar.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.map((day, dayIndex) => (
              <div key={dayIndex} className="aspect-square">
                {day && (
                  <button
                    onClick={() => handleDateClick(day)}
                    className={`
                      w-full h-full rounded-lg text-sm font-medium flex items-center justify-center
                      ${isSelected(day)
                        ? 'bg-blue-500 text-white'
                        : isToday(day)
                        ? 'bg-red-100 text-red-600'
                        : 'hover:bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default BSMonthViewCalendar; 