import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import NotificationDropdown from "./NotificationDropdown";
import { getUnreadNotificationCount } from "@/lib/actions";
import NotificationIcon from "./NotificationIcon";

const Navbar = async () => {
  const user = await currentUser();
  
  // Get unread notification count
  let unreadCount = 0;
  try {
    const result = await getUnreadNotificationCount();
    if (result.success && result.data) {
      unreadCount = result.data.count;
    }
  } catch (error) {
    console.error("Error fetching unread count:", error);
  }

  return (
    <div className="flex items-center justify-between p-4">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image src="/message.png" alt="" width={20} height={20} />
        </div>
        <NotificationDropdown unreadCount={unreadCount} />
        {/* Show notification icon only for admin users */}
        {(user?.publicMetadata?.role as string) === "admin" && (
          <NotificationIcon />
        )}
        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium">{user?.fullName}</span>
          <span className="text-[10px] text-gray-500 text-right">
            {user?.publicMetadata?.role as string}
          </span>
        </div>
        {/* <Image src="/avatar.png" alt="" width={36} height={36} className="rounded-full"/> */}
        <UserButton />
      </div>
    </div>
  );
};

export default Navbar;
