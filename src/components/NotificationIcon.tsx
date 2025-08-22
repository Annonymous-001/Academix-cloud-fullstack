"use client";

import { useState } from "react";
import Image from "next/image";
import FormModal from "./FormModal";
import NotificationForm from "./forms/NotificationForm";

const NotificationIcon = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(true)}
        title="Send Notification"
      >
        <Image src="/announcement.png" alt="Send Notification" width={16} height={16} />
      </div>

      {isOpen && (
        <FormModal
          table="notifications"
          type="create"
          relatedData={{ classes: [] }} // Will be populated by FormContainer
        />
      )}
    </>
  );
};

export default NotificationIcon;
