import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";
import moment from "moment-timezone";
import { ADToBS } from "bikram-sambat-js";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  const dataRes = await prisma.lesson.findMany({
    where: {
      ...(type === "teacherId"
        ? { teacherId: id as string }
        : { classId: id as number }),
    },
  });

  const data = dataRes.map((lesson) => {
    const start = moment.utc(lesson.startTime).local().toDate();
    const end = moment.utc(lesson.endTime).local().toDate();
    // Convert to BS date string (YYYY-MM-DD)
    const bsStart = ADToBS(start);
    const bsEnd = ADToBS(end);
    return {
      title: `${lesson.name} (BS: ${bsStart} - ${bsEnd})`,
      start,
      end,
    };
  });

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
