"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { teacherAttendanceSchema, TeacherAttendanceSchema } from "@/lib/formValidationSchemas";
import { createTeacherAttendance, updateTeacherAttendance } from "@/lib/actions";
import BikramSambatDatePicker from "../BikramSambatDatePicker";
import { BSToAD } from "bikram-sambat-js";
import ErrorDisplay from "../ui/error-display";

type FormState = {
  success: boolean;
  error: boolean;
  message?: string;
  details?: any;
};

type FormData = TeacherAttendanceSchema;

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
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(teacherAttendanceSchema),
    defaultValues: {
      teacherId: data?.teacherId,
      // @ts-ignore
      date: data?.date ? new Date(data.date) : undefined,
      status: data?.status || "PRESENT",
      inTime: data?.inTime || undefined,
      outTime: data?.outTime || undefined,
    }
  });

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const status = watch("status");

  const [state, formAction] = useFormState(
    type === "create" ? createTeacherAttendance : updateTeacherAttendance,
    {
      success: false,
      error: false,
      message: "",
      details: [],
    }
  );

  const handleDateSelect = (date: { year: number; month: number; day: number }) => {
    const bsDateString = `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
    const adDateString = BSToAD(bsDateString);
    // @ts-ignore
    setValue('date', new Date(adDateString));
  };

  const onSubmit = handleSubmit(async (formData) => {
    if (type === "update" && !data.id) {
      toast.error("ID is required for update");
      return;
    }

    setLoading(true);
    setShowError(false);

    const submitData = {
      ...formData,
      date: new Date(formData.date),
      inTime: formData.status !== "ABSENT" && formData.inTime ? formData.inTime : undefined,
      outTime: formData.status !== "ABSENT" && formData.outTime ? formData.outTime : undefined,
    };
    
    // @ts-ignore
    formAction(submitData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Teacher attendance has been ${type === "create" ? "created" : "updated"}!`);
      router.refresh();
      setOpen(false);
    }
    if (state.error) {
      setShowError(true);
      toast.error(state.message || "Something went wrong!");
    }
    if (state.success || state.error) {
      setLoading(false);
    }
  }, [state, router, type, setOpen]);

  const teachers = relatedData?.teachers || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Teacher Attendance" : "Update Teacher Attendance"}
      </h1>

      {showError && state.error && (
        <ErrorDisplay
          // @ts-ignore
          error={state.details || state.message || "An error occurred"}
          title="Error Details"
          onClose={() => setShowError(false)}
          className="mb-4"
        />
      )}

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

          <div className="w-full md:w-[48%]">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Date (Bikram Sambat)</label>
              <BikramSambatDatePicker onDateSelect={handleDateSelect} />
              {errors.date?.message && (
                <p className="text-xs text-red-400">
                  {/* @ts-ignore */}
                  {errors.date.message.toString()}
                </p>
              )}
            </div>
          </div>

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

      <button
        type="submit"
        disabled={loading}
        className={`${
          loading ? "bg-gray-400" : "bg-blue-400"
        } text-white p-2 rounded-md transition-colors`}
      >
        {loading
          ? `${type === "create" ? "Creating" : "Updating"}...`
          : type === "create"
          ? "Create Attendance"
          : "Update Attendance"}
      </button>
    </form>
  );
};

export default TeacherAttendanceForm;
