"use client";

import { Calendar, momentLocalizer, Views, View, CalendarProps } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

const localizer = momentLocalizer(moment); // Ensure localizer is defined

interface Event {
  title: string;
  start: Date;
  end: Date;
}

const BigCalendar = ({
  data,
}: {
  data: Event[];
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  return (
    localizer && ( // ✅ Ensuring localizer is not undefined
      <div style={{ height: "98%" }}>
        <Calendar<Event>
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
    )
  );
};

export default BigCalendar;
