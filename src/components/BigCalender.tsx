"use client";

import { Calendar, momentLocalizer, Views, View } from "react-big-calendar";
import type { CalendarProps, Event } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

const localizer = momentLocalizer(moment);

interface CalendarEvent extends Event {
  title: string;
  start: Date;
  end: Date;
}

const CalendarComponent = ({
  data,
}: {
  data: CalendarEvent[];
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  const CalendarComponent = Calendar as any; // Type assertion to bypass type checking

  return (
    <div style={{ height: "98%" }}>
      <CalendarComponent
        localizer={localizer}
        events={data}
        startAccessor="start"
        endAccessor="end"
        views={{ week: true, day: true, work_week: true }}
        view={view}
        onView={handleOnChangeView}
        min={new Date(2025, 1, 0, 8, 0, 0)}
        max={new Date(2025, 1, 0, 17, 0, 0)}
      />
    </div>
  );
};

export default CalendarComponent;