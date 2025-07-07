import Announcements from "@/components/Announcements";
import { CardSchedule } from "@/components/card-schedule";
import { TimelineSchedule } from "@/components/timeline-schedule";
import { AgendaSchedule } from "@/components/agenda-schedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { Enrollment } from "@prisma/client";

const TeacherPage = async () => {
  const session = await auth();
  const userId = session.userId;

  // Get teacher details with related data
  const teacher = await prisma.teacher.findUnique({
    where: { id: userId! },
    include: {
      lessons: {
        include: {
          subject: true,
          class: {
            include: {
              grade: true,
              students: {
                include: {
                  student: {
                    include: {
                      attendances: {
                        where: {
                          date: {
                            gte: new Date(new Date().setDate(new Date().getDate() - 7)) // Last 7 days
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      classes: {
        include: {
          grade: true,
          students: {
            include: {
              student: {
                include: {
                  results: {
                    include: {
                      exam: {
                        include: {
                          subject: true
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
              }
            }
          },
          exams: {
            include: {
              subject: true
            },
            orderBy: {
              startTime: 'desc'
            },
            take: 5
          }
        }
      }
    }
  });

  if (!teacher) {
    return <div>Teacher not found</div>;
  }

  // Transform lessons into schedule events
  const lessonEvents = teacher.lessons.map(lesson => ({
    id: `lesson-${lesson.id}`,
    title: `${lesson.subject.name} - ${lesson.name}`,
    description: `Class ${lesson.class.name} - Grade ${lesson.class.grade.level}`,
    date: new Date(lesson.startTime),
    startTime: format(new Date(lesson.startTime), 'HH:mm'),
    endTime: format(new Date(lesson.endTime), 'HH:mm'),
    duration: Math.round((new Date(lesson.endTime).getTime() - new Date(lesson.startTime).getTime()) / (1000 * 60)),
    category: 'class',
    location: `Class ${lesson.class.name}`,
    color: '#e0f2fe',
    priority: 'high' as const,
    type: 'lesson' as const
  }));

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT SIDE */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* Teacher Info Card */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Teacher Information</h1>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{teacher.name} {teacher.surname}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Teacher ID</p>
              <p className="font-medium">{teacher.teacherId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{teacher.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{teacher.phone}</p>
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
              <CardSchedule events={lessonEvents} initialDate={new Date()} />
            </TabsContent>

            <TabsContent value="timeline">
              <TimelineSchedule events={lessonEvents} initialDate={new Date()} />
            </TabsContent>

            <TabsContent value="agenda">
              <AgendaSchedule events={lessonEvents} initialDate={new Date()} daysToShow={7} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Classes Overview */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Classes Overview</h1>
          <div className="space-y-4">
            {teacher.classes.map((class_) => (
              <div key={class_.id} className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-medium">Class {class_.name} - Grade {class_.grade.level}</h2>
                  <span className="text-sm text-gray-500">{class_.students.length} Students</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Recent Results</p>
                    <div className="mt-1">
                      {class_.students.slice(0, 3).map(enrollment => (
                        <div key={enrollment.id} className="flex justify-between">
                          <span>{enrollment.student.name}</span>
                          <span>{enrollment.student.results[0]?.score || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500">Upcoming Exams</p>
                    <div className="mt-1">
                      {class_.exams.slice(0, 3).map(exam => (
                        <div key={exam.id} className="flex justify-between">
                          <span>{exam.subject.name}</span>
                          <span>{format(new Date(exam.startTime), "dd MMM")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Recent Attendance Overview */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Recent Attendance Overview</h1>
          <div className="space-y-4">
            {teacher.lessons.map(lesson => (
              <div key={lesson.id} className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-medium">{lesson.subject.name}</h2>
                  <span className="text-sm text-gray-500">Class {lesson.class.name}</span>
                </div>
                <div className="space-y-2">
                  {lesson.class.students.slice(0, 3).map(enrollment => {
                    const recentAttendance = enrollment.student.attendances[0];
                    return (
                      <div key={enrollment.id} className="flex justify-between items-center">
                        <span className="text-sm">{enrollment.student.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          recentAttendance?.status === "PRESENT" ? "bg-green-100 text-green-800" :
                          recentAttendance?.status === "ABSENT" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {recentAttendance?.status || 'N/A'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold mb-4">Upcoming Exams</h1>
          <div className="space-y-4">
            {teacher.classes.flatMap(class_ => class_.exams)
              .filter(exam => new Date(exam.startTime) > new Date())
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .slice(0, 5)
              .map(exam => (
                <div key={exam.id} className="border-b pb-4">
                  <div className="font-medium">{exam.title}</div>
                  <div className="text-sm text-gray-500">
                    {exam.subject.name} &bull; {format(new Date(exam.startTime), "dd MMM yyyy, hh:mm a")}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Announcements */}
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
