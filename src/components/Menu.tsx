import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["admin", "teacher", "student", "parent","accountant"],
        color: "bg-blue-50"
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["admin", "teacher","accountant"],
        color: "bg-purple-50"
      },
      {
        icon: "/student.png",
        label: "Students",
        href: "/list/students",
        visible: ["admin", "teacher","accountant"],
        color: "bg-green-50"
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: ["admin", "teacher","accountant"],
        color: "bg-yellow-50"
      },
      {
        icon: "/accountant.png",
        label: "Accountants",
        href: "/list/accountants",
        visible: ["admin"],
        color: "bg-cyan-50"
      },
      {
        icon: "/badge-indian-rupee1.png",
        label: "Fees",
        href: "/list/fees",
        visible: ["admin","accountant"],
        color: "bg-red-50"
      },
      {
        icon: "/payments.png",
        label: "Payments",
        href: "/list/payments",
        visible: ["admin","accountant"],
        color: "bg-pink-50"
      },
      {
        icon: "/wallet.png",
        label: "Finance",
        href: "/list/finance",
        visible: ["admin","accountant"],
        color: "bg-indigo-50"
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/list/attendence",
        visible: ["admin", "teacher", "student", "parent","accountant"],
        color: "bg-orange-50"
      },
      {
        icon: "/attendance.png",
        label: "Teacher Attendance",
        href: "/list/teacherattendance",
        visible: ["admin", "teacher","accountant"],
        color: "bg-teal-50"
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/list/subjects",
        visible: ["admin"],
        color: "bg-cyan-50"
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/list/classes",
        visible: ["admin", "teacher"],
        color: "bg-emerald-50"
      },
      {
        icon: "/lesson.png",
        label: "Lessons",
        href: "/list/lessons",
        visible: ["admin", "teacher"],
        color: "bg-violet-50"
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/list/exams",
        visible: ["admin", "teacher", "student", "parent"],
        color: "bg-fuchsia-50"
      },
      {
        icon: "/assignment.png",
        label: "Assignments",
        href: "/list/assignments",
        visible: ["admin", "teacher", "student", "parent"],
        color: "bg-rose-50"
      },
      {
        icon: "/result.png",
        label: "Results",
        href: "/list/results",
        visible: ["admin", "teacher", "student", "parent","accountant"],
        color: "bg-sky-50"
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/list/events",
        visible: ["admin", "teacher", "student", "parent","accountant"],
        color: "bg-lime-50"
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student", "parent","accountant"],
        color: "bg-amber-50"
      },
    ],
  },
  {
    title: "",
    items: [
      // {
      //   icon: "/profile.png",
      //   label: "Profile",
      //   href: "/profile",
      //   visible: ["admin", "teacher", "student", "parent"],
      // },
      // {
      //   icon: "/setting.png",
      //   label: "Settings",
      //   href: "/settings",
      //   visible: ["admin", "teacher", "student", "parent"],
      // },
      // {
      //   icon: "/logout.png",
      //   label: "Logout",
      //   href: "/logout",
      //   visible: ["admin", "teacher", "student", "parent"],
      // },
    ],
  },
];

const Menu = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;
  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            if (item.visible.includes(role)) {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={`flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md ${item.color}`}
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
