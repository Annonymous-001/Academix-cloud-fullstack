"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InputField from "../InputField";
import { createNotification } from "@/lib/actions";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { toast } from "react-toastify";

const notificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  message: z.string().min(1, "Message is required").max(500, "Message too long"),
  type: z.nativeEnum(NotificationType),
  priority: z.nativeEnum(NotificationPriority),
  targetRole: z.string().optional(),
  targetClassId: z.string().optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

const NotificationForm = ({ 
  onClose, 
  relatedData 
}: { 
  onClose: () => void;
  relatedData?: any;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      priority: NotificationPriority.NORMAL,
      type: NotificationType.GENERAL,
    },
  });

  const selectedClassId = watch("targetClassId");
  const classes = relatedData?.classes || [];

  const onSubmit = async (data: NotificationFormData) => {
    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (data.targetClassId) {
        // Send class-specific notification
        result = await createNotification({
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          targetClassId: parseInt(data.targetClassId),
        });
      } else {
        // Send general notification to specific role or all users
        result = await createNotification({
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          targetRole: data.targetRole || undefined,
        });
      }

      if (result.success) {
        toast.success("Notification sent successfully!");
        reset();
        onClose();
      } else {
        setError(result.message || "Failed to send notification");
        toast.error(result.message || "Failed to send notification");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      console.error("Error creating notification:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Send Notification</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <InputField
        label="Title"
        name="title"
        register={register}
        error={errors.title}
      />

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Message</label>
        <textarea
          {...register("message")}
          placeholder="Enter notification message"
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full resize-none"
          rows={4}
        />
        {errors.message && (
          <p className="text-xs text-red-400">{errors.message.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Target Class (Optional)</label>
          <select
            {...register("targetClassId")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          >
            <option value="">All Classes (General)</option>
            {classes.map((cls: { id: number; name: string; supervisorId?: string }) => (
              <option value={cls.id} key={cls.id}>
                {cls.name} {cls.supervisorId ? "(with supervisor)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Type</label>
          <select
            {...register("type")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          >
            {Object.values(NotificationType).map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Priority</label>
          <select
            {...register("priority")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          >
            {Object.values(NotificationPriority).map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedClassId && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Target Role (optional)</label>
          <select
            {...register("targetRole")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          >
            <option value="">All Users</option>
            <option value="student">Students Only</option>
            <option value="teacher">Teachers Only</option>
            <option value="parent">Parents Only</option>
            <option value="accountant">Accountants Only</option>
            <option value="admin">Admins Only</option>
          </select>
        </div>
      )}

      {/* Notification Preview */}
      {selectedClassId && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-600 font-medium mb-1">
            📢 Notification Preview:
          </p>
          <p className="text-xs text-blue-700">
            This notification will be sent to:
            <br />
            • All students in the selected class
            <br />
            • Parents of those students
            <br />
            • Class supervisor (if assigned)
          </p>
        </div>
      )}

      {!selectedClassId && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-600 font-medium mb-1">
            📢 General Notification:
          </p>
          <p className="text-xs text-green-700">
            This notification will be sent to all users (students, teachers, parents)
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Notification"}
        </button>
      </div>
    </form>
  );
};

export default NotificationForm;
