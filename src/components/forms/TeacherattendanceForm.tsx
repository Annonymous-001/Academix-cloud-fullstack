"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { teacherAttendanceSchema, TeacherAttendanceSchema } from "@/lib/formValidationSchemas";
import { createTeacherAttendance, updateTeacherAttendance } from "@/lib/actions";

type FormData = {
  id?: number;
  teacherId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  inTime?: string;
  outTime?: string;
};

const TeacherAttendanceForm = ({
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
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(teacherAttendanceSchema),
    defaultValues: {
      teacherId: data?.teacherId,
      date: data?.date ? new Date(data.date).toISOString().split('T')[0] : undefined,
      status: data?.status || "PRESENT",
      inTime: data?.inTime || undefined,
      outTime: data?.outTime || undefined,
    }
  });

  const status = watch("status");

  const [state, formAction] = useFormState(
    type === "create" ? createTeacherAttendance : updateTeacherAttendance,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    if (type === "update" && !formData.id) {
      toast.error("ID is required for update");
      return;
    }

    const submitData = {
      ...formData,
      date: new Date(formData.date),
      inTime: formData.status !== "ABSENT" ? formData.inTime : undefined,
      outTime: formData.status !== "ABSENT" ? formData.outTime : undefined,
    };

    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success(`Teacher attendance has been ${type === "create" ? "created" : "updated"}!`);
      router.refresh();
      setOpen(false);
    } else if (state?.error) {
      toast.error(state.message || "Something went wrong!");
    }
  }, [state, router, type, setOpen]);

  const teachers = relatedData?.teachers || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Teacher Attendance" : "Update Teacher Attendance"}
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
          <div className="w-full md:w-[48%]">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Teacher</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("teacherId")}
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher: any) => (
                  <option value={teacher.id} key={teacher.id}>
                    {teacher.name} {teacher.surname}
                  </option>
                ))}
              </select>
              {errors.teacherId?.message && (
                <p className="text-xs text-red-400">
                  {errors.teacherId.message.toString()}
                </p>
              )}
            </div>
          </div>

          <InputField
            label="Date"
            name="date"
            type="date"
            register={register}
            error={errors?.date}
          />

          <div className="w-full md:w-[48%]">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Status</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("status")}
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

          {status !== "ABSENT" && (
            <>
              <InputField
                label="In Time"
                name="inTime"
                type="time"
                register={register}
                error={errors?.inTime}
              />

              <InputField
                label="Out Time"
                name="outTime"
                type="time"
                register={register}
                error={errors?.outTime}
              />
            </>
          )}
        </div>
      </div>

      {state?.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create Attendance" : "Update Attendance"}
      </button>
    </form>
  );
};

export default TeacherAttendanceForm;
