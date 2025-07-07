"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { lessonSchema, LessonSchema } from "@/lib/formValidationSchemas";
import { createLesson, updateLesson } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import ErrorDisplay from "../ui/error-display";

const LessonForm = ({
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
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
  });

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const [state, formAction] = useFormState(
    type === "create" ? createLesson : updateLesson,
    {
      success: false,
      error: false,
      message: "",
      details: null,
    }
  );

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    setShowError(false);
    await formAction(data);
    setLoading(false);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Lesson has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      setShowError(true);
      toast.error(state.message || "Something went wrong!");
    }
    if (state.success || state.error) {
      setLoading(false);
    }
  }, [state, router, type, setOpen]);

  const { subjects, classes, teachers } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new lesson" : "Update the lesson"}
      </h1>

      {showError && state.error && (
        <ErrorDisplay
          error={state.details || state.message || "An error occurred"}
          title="Error Details"
          onClose={() => setShowError(false)}
          className="mb-4"
        />
      )}

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Lesson name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Day</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("day")}
            defaultValue={data?.day}
          >
            {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY","SATURDAY"].map((day) => (
              <option value={day} key={day}>
                {day}
              </option>
            ))}
          </select>
          {errors.day?.message && (
            <p className="text-xs text-red-400">{errors.day.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Start Time"
          name="startTime"
          type="datetime-local"
          defaultValue={data?.startTime}
          register={register}
          error={errors?.startTime}
        />

        <InputField
          label="End Time"
          name="endTime"
          type="datetime-local"
          defaultValue={data?.endTime}
          register={register}
          error={errors?.endTime}
        />

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

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Subject</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("subjectId")}
            defaultValue={data?.subjectId}
          >
            {subjects.map((subject: { id: number; name: string }) => (
              <option value={subject.id} key={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId?.message && (
            <p className="text-xs text-red-400">
              {errors.subjectId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classId")}
            defaultValue={data?.classId}
          >
            {classes.map((class_: { id: number; name: string }) => (
              <option value={class_.id} key={class_.id}>
                {class_.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Teacher</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("teacherId")}
            defaultValue={data?.teacherId}
          >
            {teachers.map((teacher: { id: string; name: string; surname: string }) => (
              <option value={teacher.id} key={teacher.id}>
                {teacher.name + " " + teacher.surname}
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

      <button
        type="submit"
        disabled={loading}
        className={`p-2 rounded-md text-white transition ${
          loading
            ? "bg-blue-300 cursor-not-allowed"
            : "bg-blue-400 hover:bg-blue-500"
        }`}
      >
        {loading
          ? type === "create"
            ? "Creating..."
            : "Updating..."
          : type === "create"
          ? "Create"
          : "Update"}
      </button>
    </form>
  );
};

export default LessonForm;
