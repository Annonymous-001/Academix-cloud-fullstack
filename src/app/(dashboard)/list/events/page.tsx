import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SortDropdown from "@/components/SortDropdown";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Event, Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ADToBS } from "bikram-sambat-js"; // ✅ BS date converter

type EventList = Event & { class: Class | null };

const EventListPage = async (
  props: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
  }
) => {
  const searchParams = await props.searchParams;
  const session = await auth();
  const userId = session.userId;
  const sessionClaims = session.sessionClaims;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const columns = [
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Description",
      accessor: "description",
      className: "hidden md:table-cell",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Start Time (BS)",
      accessor: "startTime",
      className: "hidden md:table-cell",
    },
    {
      header: "End Time (BS)",
      accessor: "endTime",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: EventList) => {
    const startDate = new Date(item.startTime);
    const endDate = new Date(item.endTime);
    const bsStart = ADToBS(startDate.toISOString().split("T")[0]);
    const bsEnd = ADToBS(endDate.toISOString().split("T")[0]);
    const [startYear, startMonth, startDay] = bsStart.split('-').map(Number);
    const [endYear, endMonth, endDay] = bsEnd.split('-').map(Number);
    const startTime = startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const endTime = endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const nepaliMonths = [
      'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
      'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ];

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">{item.title}</td>
        <td className="hidden md:table-cell">{item.description}</td>
        <td>{item.class?.name || "-"}</td>
        <td className="hidden md:table-cell">{`${nepaliMonths[startMonth - 1]} ${startDay }, ${startYear} ${startTime}`}</td>
        <td className="hidden md:table-cell">{`${nepaliMonths[endMonth - 1]} ${endDay }, ${endYear} ${endTime}`}</td>
        {(role === "admin" || role === "teacher") && (
          <td>
            <div className="flex items-center gap-2">
              <FormContainer table="event" type="update" data={item} />
              <FormContainer table="event" type="delete" id={item.id} />
            </div>
          </td>
        )}
      </tr>
    );
  };

  const { page, sort, direction, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.EventWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { description: { contains: value, mode: "insensitive" } }
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  if (role === "teacher") {
    query.class = {
      lessons: {
        some: { teacherId: currentUserId! }
      }
    };
  } else if (role === "student") {
    query.class = {
      students: {
        some: { studentId: currentUserId! }
      }
    };
  } else if (role === "parent") {
    query.class = {
      students: {
        some: { 
          student: {
            parentId: currentUserId! 
          }
        }
      }
    };
  }

  const [data, count] = await prisma.$transaction([
    prisma.event.findMany({
      where: query,
      include: {
        class: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: sort && direction ? {
        [sort.includes('.') ? sort.split('.')[0] : sort]: sort.includes('.') 
          ? { [sort.split('.')[1]]: direction }
          : direction
      } : {
        startTime: 'desc'
      }
    }),
    prisma.event.count({ where: query }),
  ]);

  const sortOptions = [
    { label: "Date (Newest)", value: "startTime", direction: "desc" as const },
    { label: "Date (Oldest)", value: "startTime", direction: "asc" as const },
    { label: "Title (A-Z)", value: "title", direction: "asc" as const },
    { label: "Title (Z-A)", value: "title", direction: "desc" as const },
    { label: "Description (A-Z)", value: "description", direction: "asc" as const },
    { label: "Description (Z-A)", value: "description", direction: "desc" as const },
    { label: "Class (A-Z)", value: "class.name", direction: "asc" as const },
    { label: "Class (Z-A)", value: "class.name", direction: "desc" as const },
  ];

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Events</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <SortDropdown options={sortOptions} defaultSort="date" />
            {role === "admin" && <FormContainer table="event" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default EventListPage;
