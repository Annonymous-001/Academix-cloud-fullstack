import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Table from "@/components/Table";
import FormContainer from "@/components/FormContainer";

const ClassDetailPage = async (props: { params: Promise<{ id: string }> }) => {
  const params = await props.params;
  const session = await auth();
  const role = (session.sessionClaims?.metadata as { role?: string })?.role;

  const classId = parseInt(params.id);

  // Fetch class with related data
  const classData = await prisma.class.findUnique({
    where: {
      id: classId,
    },
    include: {
      supervisor: true,
      grade: true,
      students: {
        include: {
          parent: true,
        },
      },
      lessons: {
        include: {
          subject: true,
          teacher: true,
        },
      },
      events: true,
      announcements: true,
    },
  });

  if (!classData) {
    return <div className="m-4 p-4 bg-red-100 rounded-md">Class not found</div>;
  }

  // Student list table configuration
  const studentColumns = [
    {
      header: "Student",
      accessor: "name",
    },
    {
      header: "ID",
      accessor: "StudentId",
      className: "hidden md:table-cell",
    },
    {
      header: "Parent",
      accessor: "parent",
      className: "hidden md:table-cell",
    },
    {
      header: "Action",
      accessor: "action",
    },
  ];

  const renderStudentRow = (student: any) => (
    <tr
      key={student.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        {student.img && (
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image src={student.img} alt={student.name} fill sizes="32px" className="object-cover" />
          </div>
        )}
        <span>{student.name} {student.surname}</span>
      </td>
      <td className="hidden md:table-cell">{student.StudentId}</td>
      <td className="hidden md:table-cell">
        {student.parent ? `${student.parent.name} ${student.parent.surname}` : "N/A"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/students/${student.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );

  // Lessons table configuration
  const lessonColumns = [
    {
      header: "Subject",
      accessor: "subject",
    },
    {
      header: "Day",
      accessor: "day",
    },
    {
      header: "Time",
      accessor: "time",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Action",
      accessor: "action",
    },
  ];

  const renderLessonRow = (lesson: any) => (
    <tr
      key={lesson.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{lesson.subject.name}</td>
      <td>{lesson.day}</td>
      <td className="hidden md:table-cell">
        {new Date(lesson.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
        {new Date(lesson.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="hidden md:table-cell">
        {lesson.teacher.name} {lesson.teacher.surname}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/lessons/${lesson.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );

  // Format dates for better display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-6 m-4">
      {/* Class Info Card */}
      <div className="bg-white p-6 rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{classData.name}</h1>
          {role === "admin" && (
            <div className="flex gap-2">
              <FormContainer table="class" type="update" data={classData} />
              <Link href={`/list/classes`}>
                <button className="px-4 py-2 bg-lamaSky text-white rounded-md text-sm">
                  Back to Classes
                </button>
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-gray-500 text-sm">Class Details</span>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{classData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Grade:</span>
                <span className="font-medium">{classData.grade.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium">{classData.capacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current:</span>
                <span className="font-medium">{classData.students.length} students</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-gray-500 text-sm">Supervisor</span>
            {classData.supervisor ? (
              <div className="flex items-center gap-3">
                {classData.supervisor.img && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image 
                      src={classData.supervisor.img} 
                      alt={classData.supervisor.name} 
                      fill 
                      sizes="48px"
                      className="object-cover" 
                    />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-medium">
                    {classData.supervisor.name} {classData.supervisor.surname}
                  </span>
                  <span className="text-sm text-gray-500">{classData.supervisor.email}</span>
                </div>
              </div>
            ) : (
              <span className="text-gray-500 italic">No supervisor assigned</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-gray-500 text-sm">Quick Stats</span>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Lessons:</span>
                <span className="font-medium">{classData.lessons.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Announcements:</span>
                <span className="font-medium">{classData.announcements.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Upcoming Events:</span>
                <span className="font-medium">
                  {classData.events.filter(event => new Date(event.startTime) > new Date()).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students Section */}
      <div className="bg-white p-6 rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Students</h2>
          {role === "admin" && (
            <FormContainer table="student" type="create" data={{ classId: classData.id }} />
          )}
        </div>
        {classData.students.length > 0 ? (
          <Table 
            columns={studentColumns} 
            data={classData.students} 
            renderRow={renderStudentRow} 
          />
        ) : (
          <div className="text-center py-8 text-gray-500">No students enrolled in this class</div>
        )}
      </div>

      {/* Lessons Section */}
      <div className="bg-white p-6 rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Lessons</h2>
          {role === "admin" && (
            <FormContainer table="lesson" type="create" data={{ classId: classData.id }} />
          )}
        </div>
        {classData.lessons.length > 0 ? (
          <Table 
            columns={lessonColumns} 
            data={classData.lessons} 
            renderRow={renderLessonRow} 
          />
        ) : (
          <div className="text-center py-8 text-gray-500">No lessons scheduled for this class</div>
        )}
      </div>

      {/* Announcements & Events Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Announcements */}
        <div className="bg-white p-6 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Announcements</h2>
            {role === "admin" && (
              <FormContainer table="announcement" type="create" data={{ classId: classData.id }} />
            )}
          </div>
          {classData.announcements.length > 0 ? (
            <div className="flex flex-col gap-4">
              {classData.announcements.map((announcement: any) => (
                <div key={announcement.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{announcement.title}</h3>
                    <span className="text-sm text-gray-500">{formatDate(announcement.date)}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{announcement.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No announcements</div>
          )}
        </div>

        {/* Events */}
        <div className="bg-white p-6 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Upcoming Events</h2>
            {role === "admin" && (
              <FormContainer table="event" type="create" data={{ classId: classData.id }} />
            )}
          </div>
          {classData.events.length > 0 ? (
            <div className="flex flex-col gap-4">
              {classData.events
                .filter((event: any) => new Date(event.startTime) > new Date())
                .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((event: any) => (
                  <div key={event.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{event.title}</h3>
                      <span className="text-sm text-gray-500">{formatDate(event.startTime)}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No upcoming events</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassDetailPage;