"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { announcementSchema, AnnouncementSchema } from "@/lib/formValidationSchemas";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const AnnouncementForm = ({
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
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAnnouncement : updateAnnouncement,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Announcement has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const classes = relatedData?.classes || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new announcement" : "Update the announcement"}
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
          <InputField
            label="Date"
            name="date"
            type="date"
            defaultValue={data?.date ? new Date(data.date).toISOString().split('T')[0] : undefined}
            register={register}
            error={errors?.date}
          
          />
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

      {state?.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default AnnouncementForm;