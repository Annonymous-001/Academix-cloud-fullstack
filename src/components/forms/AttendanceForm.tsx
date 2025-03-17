"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { attendanceSchema, AttendanceSchema } from "@/lib/formValidationSchemas";
import { createAttendance, updateAttendance } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const AttendanceForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAttendance : updateAttendance,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Attendance has been ${type === "create" ? "marked" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const students = relatedData?.students || [];
  const lessons = relatedData?.lessons || [];

  const onSubmit = handleSubmit((formData) => {
    console.log("Raw form data:", formData);

    // Convert date string to Date object
    const date = new Date(formData.date);

    const formattedData = {
      ...formData,
      date,
    };

    console.log("Formatted data before sending:", formattedData);
    formAction(formattedData);
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Mark Attendance" : "Update Attendance"}
      </h1>

      <div className="flex flex-col gap-4">
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}

        <div className="flex flex-wrap gap-4">
          {/* Student Selection */}
          <div className="w-full md:w-[48%]">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Student</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("studentId")}
                defaultValue={data?.studentId}
              >
                <option value="">Select a student</option>
                {students.map((student: any) => (
                  <option value={student.id} key={student.id}>
                    {student.name} {student.surname}
                  </option>
                ))}
              </select>
              {errors.studentId?.message && (
                <p className="text-xs text-red-400">
                  {errors.studentId.message.toString()}
                </p>
              )}
            </div>
          </div>

          {/* Lesson Selection */}
          <div className="w-full md:w-[48%]">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Lesson</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("lessonId")}
                defaultValue={data?.lessonId}
              >
                <option value="">Select a lesson</option>
                {lessons.map((lesson: any) => (
                  <option value={lesson.id} key={lesson.id}>
                    {lesson.name} - {lesson.subject?.name} ({lesson.class?.name})
                  </option>
                ))}
              </select>
              {errors.lessonId?.message && (
                <p className="text-xs text-red-400">
                  {errors.lessonId.message.toString()}
                </p>
              )}
            </div>
          </div>

          {/* Date Field */}
          <InputField
            label="Date"
            name="date"
            type="date"
            defaultValue={data?.date ? new Date(data.date).toISOString().split("T")[0] : undefined}
            register={register}
            error={errors?.date}
          />

          {/* Attendance Status */}
          <div className="w-full md:w-[48%]">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Status</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("status")}
                defaultValue={data?.status || "PRESENT"}
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
              </select>
              {errors.status?.message && (
                <p className="text-xs text-red-400">
                  {errors.status.message.toString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {state?.error && <span className="text-red-500">Something went wrong!</span>}

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Mark Attendance" : "Update Attendance"}
      </button>
    </form>
  );
};

export default AttendanceForm;
