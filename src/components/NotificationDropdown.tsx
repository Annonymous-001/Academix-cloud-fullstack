"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from "@/lib/actions";
import { NotificationType, NotificationPriority } from "@prisma/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date | null;
  relatedClass?: { name: string } | null;
  relatedEvent?: { title: string } | null;
  relatedAnnouncement?: { title: string } | null;
  relatedFee?: { 
    totalAmount: bigint; 
    student: { name: string; surname: string } 
  } | null;
}

interface NotificationData {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}

const NotificationDropdown = ({ unreadCount: initialUnreadCount }: { unreadCount: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const result = await getUserNotifications(20, currentOffset);
      
      if (result.success && result.data) {
        const data = result.data as NotificationData;
        if (reset) {
          setNotifications(data.notifications);
          setOffset(20);
        } else {
          setNotifications(prev => [...prev, ...data.notifications]);
          setOffset(prev => prev + 20);
        }
        setUnreadCount(data.unreadCount);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen, notifications.length, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead();
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const result = await deleteNotification(notificationId);
      if (result.success) {
        const deletedNotif = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "ANNOUNCEMENT":
        return "/announcement.png";
      case "EVENT":
        return "/calendar.png";
      case "FEE_DUE":
      case "FEE_PAID":
        return "/badge-indian-rupee1.png";
      case "ATTENDANCE":
        return "/attendance.png";
      case "EXAM":
        return "/exam.png";
      case "ASSIGNMENT":
        return "/assignment.png";
      case "RESULT":
        return "/result.png";
      default:
        return "/message.png";
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case "URGENT":
        return "border-l-red-500";
      case "HIGH":
        return "border-l-orange-500";
      case "NORMAL":
        return "border-l-blue-500";
      case "LOW":
        return "border-l-gray-400";
      default:
        return "border-l-blue-500";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Image src="/announcement.png" alt="Notifications" width={20} height={20} />
        {unreadCount > 0 && (
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-8 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Image
                          src={getNotificationIcon(notification.type)}
                          alt={notification.type}
                          width={20}
                          height={20}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium text-gray-900 truncate ${
                              !notification.isRead ? "font-semibold" : ""
                            }`}>
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-500 ml-2"
                            >
                              <Image src="/close.png" alt="Delete" width={12} height={12} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <div className="p-3 text-center">
                    <button
                      onClick={() => fetchNotifications(false)}
                      disabled={loading}
                      className="text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
                    >
                      {loading ? "Loading..." : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
