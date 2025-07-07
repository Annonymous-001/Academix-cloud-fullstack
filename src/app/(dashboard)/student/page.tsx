import Announcements from "@/components/Announcements";
import { CardSchedule } from "@/components/card-schedule";
import { TimelineSchedule } from "@/components/timeline-schedule";
import { AgendaSchedule } from "@/components/agenda-schedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { FeeStatus, Enrollment } from "@prisma/client";

// Add this helper function at the top level
function hasTimeConflict(event1: { startTime: string; endTime: string }, event2: { startTime: string; endTime: string }) {
  const start1 = new Date(`2000-01-01T${event1.startTime}`).getTime();
  const end1 = new Date(`2000-01-01T${event1.endTime}`).getTime();
  const start2 = new Date(`2000-01-01T${event2.startTime}`).getTime();
  const end2 = new Date(`2000-01-01T${event2.endTime}`).getTime();

  return (start1 < end2 && end1 > start2);
}

const StudentPage = async () => {
  const session = await auth();
  const userId = session.userId;

  // Get student details with related data
  const student = await prisma.student.findUnique({
    where: { id: userId! },
    include: {
      enrollments: {
        include: {
          class: {
            include: {
              grade: true,
              lessons: {
                include: {
                  subject: true,
                  teacher: true
                }
              },
              events: true,
              exams: {
                include: {
                  subject: true,
                  class: true
                },
                orderBy: {
                  startTime: 'desc'
                },
                take: 3
              }
            }
          }
        }
      },
      parent: true,
      fees: {
        orderBy: {
          dueDate: 'desc'
        },
        take: 5
      },
      attendances: {
        orderBy: {
          date: 'desc'
        },
        include: {
          lesson: true
        },
        take: 5
      },
      results: {
        include: {
          exam: {
            include: {
              subject: true,
              class: true
            }
          },
          assignment: {
            include: {
              lesson: {
                include: {
                  subject: true
                }
              }
            }
          }
        },
        orderBy: {
          id: 'desc'
        },
        take: 5
      }
    }
  });

  if (!student) {
    return <div>Student not found</div>;
  }

  // Get the active enrollment (where leftAt is null)
  const activeEnrollment = student.enrollments.find((enr: Enrollment) => enr.leftAt === null);
  const studentClass = activeEnrollment?.class;

  // Get all events related to the student
  const studentEvents = await prisma.event.findMany({
    where: {
      OR: [
        { classId: studentClass?.id }, // Class-specific events
        { classId: null } // General events
      ],
      startTime: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)) // Start of today
      }
    },
    orderBy: {
      startTime: 'asc'
    },
    include: {
      class: true
    }
  });

  // Transform lessons first
  const lessonEvents = studentClass?.lessons.map((lesson: any) => ({
    id: `lesson-${lesson.id}`,
    title: `${lesson.subject.name} - ${lesson.name}`,
    description: `Taught by ${lesson.teacher.name} ${lesson.teacher.surname}`,
    date: new Date(lesson.startTime),
    startTime: format(new Date(lesson.startTime), 'HH:mm'),
    endTime: format(new Date(lesson.endTime), 'HH:mm'),
    duration: Math.round((new Date(lesson.endTime).getTime() - new Date(lesson.startTime).getTime()) / (1000 * 60)),
    category: 'class',
    location: `Class ${studentClass.name}`,
    color: '#e0f2fe',
    priority: 'high' as const,
    type: 'lesson' as const
  })) || [];

  // Transform events and check for conflicts
  const eventEvents = studentEvents.map(event => {
    const isClassEvent = event.classId === studentClass?.id;
    const eventData = {
      id: `event-${event.id}`,
      title: event.title,
      description: event.description,
      date: new Date(event.startTime),
      startTime: format(new Date(event.startTime), 'HH:mm'),
      endTime: format(new Date(event.endTime), 'HH:mm'),
      duration: Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60)),
      category: isClassEvent ? 'class-event' : 'general-event',
      location: isClassEvent ? `Class ${studentClass?.name}` : 'School-wide',
      color: isClassEvent ? '#fef3c7' : '#d1fae5',
      priority: isClassEvent ? 'medium' as const : 'high' as const,
      type: 'event' as const
    };
    return eventData;
  });

  // Combine all events
  const scheduleEvents = [...lessonEvents, ...eventEvents];

  // Sort events by date and time
  scheduleEvents.sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const getStatusColor = (status: FeeStatus) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "UNPAID":
        return "bg-red-100 text-red-800";
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-800";
      case "OVERDUE":
        return "bg-orange-100 text-orange-800";
      case "WAIVED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT SIDE */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* Student Info Card */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Student Information</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{student.name} {student.surname}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Student ID</p>
              <p className="font-medium">{student.StudentId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Class</p>
              <p className="font-medium">{studentClass ? studentClass.name : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Grade</p>
              <p className="font-medium">{studentClass ? `Grade ${studentClass.grade.level}` : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Parent</p>
              <p className="font-medium">{student.parent?.name} {student.parent?.surname}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact</p>
              <p className="font-medium">{student.parent?.phone}</p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Schedule</h1>
          <Tabs defaultValue="agenda" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="card" className="data-[state=active]:bg-gray-100">Card View</TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-gray-100">Timeline View</TabsTrigger>
              <TabsTrigger value="agenda" className="data-[state=active]:bg-gray-100">Agenda View</TabsTrigger>
            </TabsList>

            <TabsContent value="card">
              <CardSchedule events={scheduleEvents} initialDate={new Date()} />
            </TabsContent>

            <TabsContent value="timeline">
              <TimelineSchedule events={scheduleEvents} initialDate={new Date()} />
            </TabsContent>

            <TabsContent value="agenda">
              <AgendaSchedule events={scheduleEvents} initialDate={new Date()} daysToShow={7} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Recent Results */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Recent Results</h1>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Subject</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {student.results?.map((result: any) => (
                  <tr key={result.id} className="border-b">
                    <td className="py-2">
                      {result.exam?.subject.name || result.assignment?.lesson.subject.name}
                    </td>
                    <td className="py-2">
                      {result.exam ? 'Exam' : 'Assignment'}
                    </td>
                    <td className="py-2">{result.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Recent Fees */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4"> Fees</h1>
          <div className="space-y-4">
            {student.fees?.map((fee: any) => (
              <div key={fee.id} className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">₹{Number(fee.totalAmount-fee.paidAmount).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      Due: {format(new Date(fee.dueDate), "dd MMM yyyy")}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(fee.status)}`}>
                    {fee.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Recent Attendance</h1>
          <div className="space-y-4">
            {student.attendances?.map((attendance: any) => (
              <div key={attendance.id} className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {format(new Date(attendance.date), "dd MMM yyyy")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {attendance.lesson?.name || 'Full Day'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    attendance.status === "PRESENT" ? "bg-green-100 text-green-800" :
                    attendance.status === "ABSENT" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {attendance.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* <EventCalendar /> */}
        <Announcements />

        {/* Upcoming Exams */}
        <div className="bg-white p-4 rounded-md mt-4">
          <h1 className="text-xl font-semibold mb-4">Upcoming Exams</h1>
          {(() => {
            const upcomingExams = studentClass?.exams
              ?.filter((exam: any) => new Date(exam.startTime) > new Date())
              .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];

            return upcomingExams.length > 0 ? (
              <ul className="space-y-3">
                {upcomingExams.map((exam: any) => (
                  <li key={exam.id} className="border-b pb-2">
                    <div className="font-medium">{exam.title}</div>
                    <div className="text-sm text-gray-500">
                      {exam.subject.name} &bull; {format(new Date(exam.startTime), "dd MMM yyyy, hh:mm a")}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic">No upcoming exams</div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default StudentPage;
