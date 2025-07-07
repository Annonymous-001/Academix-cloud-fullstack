"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { eventSchema, EventSchema } from "@/lib/formValidationSchemas";
import { createEvent, updateEvent } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import BikramSambatDatePicker from "../BikramSambatDatePicker";
import { BSToAD } from "bikram-sambat-js";
import ErrorDisplay from "../ui/error-display";

const EventForm = ({
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
    setValue,
    formState: { errors },
    watch,
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
  });

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const [state, formAction] = useFormState(
    type === "create" ? createEvent : updateEvent,
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
      toast.success(`Event has been ${type === "create" ? "created" : "updated"}!`);
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

  const { classes } = relatedData;

  const handleStartDateSelect = (date: {
    year: number;
    month: number;
    day: number;
  }) => {
    const bsDateString = `${date.year}-${date.month
      .toString()
      .padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
    const adDateString = BSToAD(bsDateString);
    const adDate = new Date(adDateString);
    // Get the current start time value or default to 9:00 AM
    const currentStartTime = watch("startTime") || new Date();
    adDate.setHours(
      currentStartTime.getHours(),
      currentStartTime.getMinutes(),
      0,
      0
    );
    setValue("startTime", adDate);
  };

  const handleEndDateSelect = (date: {
    year: number;
    month: number;
    day: number;
  }) => {
    const bsDateString = `${date.year}-${date.month
      .toString()
      .padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
    const adDateString = BSToAD(bsDateString);
    const adDate = new Date(adDateString);
    // Get the current end time value or default to 5:00 PM
    const currentEndTime = watch("endTime") || new Date();
    adDate.setHours(
      currentEndTime.getHours(),
      currentEndTime.getMinutes(),
      0,
      0
    );
    setValue("endTime", adDate);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":");
    const currentDate = watch("startTime") || new Date();
    const newDate = new Date(currentDate);
    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    setValue("startTime", newDate);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":");
    const currentDate = watch("endTime") || new Date();
    const newDate = new Date(currentDate);
    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    setValue("endTime", newDate);
  };

  // Format time for input value
  const formatTimeForInput = (date: Date | undefined) => {
    if (!date) return "";
    return date.toTimeString().slice(0, 5);
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new event" : "Update the event"}
      </h1>

      {showError && state.error && (
        <ErrorDisplay
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

        <div className="flex justify-between flex-wrap gap-4">
          <InputField
            label="Title"
            name="title"
            defaultValue={data?.title}
            register={register}
            error={errors?.title}
          />

          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label className="text-xs text-gray-500">Class</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("classId")}
              defaultValue={data?.classId}
            >
              <option value="">Select a class</option>
              {classes.map((cls: { id: number; name: string }) => (
                <option value={cls.id} key={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {errors.classId?.message && (
              <p className="text-xs text-red-400">
                {errors.classId.message.toString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label className="text-xs text-gray-500">
              Start Date (Bikram Sambat)
            </label>
            <BikramSambatDatePicker onDateSelect={handleStartDateSelect} />
            <div className="mt-2">
              <label className="text-xs text-gray-500">Start Time</label>
              <input
                type="time"
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                onChange={handleStartTimeChange}
                value={formatTimeForInput(watch("startTime"))}
              />
            </div>
            {errors.startTime?.message && (
              <p className="text-xs text-red-400">
                {errors.startTime.message.toString()}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label className="text-xs text-gray-500">
              End Date (Bikram Sambat)
            </label>
            <BikramSambatDatePicker onDateSelect={handleEndDateSelect} />
            <div className="mt-2">
              <label className="text-xs text-gray-500">End Time</label>
              <input
                type="time"
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                onChange={handleEndTimeChange}
                value={formatTimeForInput(watch("endTime"))}
              />
            </div>
            {errors.endTime?.message && (
              <p className="text-xs text-red-400">
                {errors.endTime.message.toString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Description</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full min-h-[100px]"
            {...register("description")}
            defaultValue={data?.description}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">
              {errors.description.message.toString()}
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

export default EventForm;
