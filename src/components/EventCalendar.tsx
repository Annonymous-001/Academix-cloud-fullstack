"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BikramSambatDatePicker from "./BikramSambatDatePicker";
import BSMonthViewCalendar from "./BSMonthViewCalendar";
import { BSToAD } from "bikram-sambat-js";

interface BSDate {
  year: number;
  month: number;
  day: number;
}

const EventCalendar = ({
  initialDate,
}: {
  initialDate?: string;
}) => {
  const [selectedDate, setSelectedDate] = useState<BSDate | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (selectedDate) {
      const year = selectedDate.year;
      const month = selectedDate.month;
      const day = selectedDate.day;
      
      const bsDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const adDateString = BSToAD(bsDateString);
      
      router.push(`?date=${adDateString}`);
    }
  }, [selectedDate, router]);

  return <BSMonthViewCalendar onDateSelect={setSelectedDate} initialDate={initialDate} />;
};

export default EventCalendar;
