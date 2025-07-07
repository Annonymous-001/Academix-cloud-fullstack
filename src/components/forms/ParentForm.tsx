"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createParent, updateParent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ErrorDisplay from "../ui/error-display";

// Add this type definition after imports
type FormState = {
  success: boolean;
  error: boolean;
  message?: string;
  details?: any;
}

const ParentForm = ({
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
    setValue,
    watch,
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema),
  });

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const [state, formAction] = useFormState<FormState, ParentSchema>(
    async (_, data) => {
      if (type === "create") {
        return createParent({ success: false, error: false, message: "" }, data);
      }
      return updateParent({ success: false, error: false, message: "" }, data);
    },
    {
      success: false,
      error: false,
      message: "",
      details: null,
    }
  );

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    setShowError(false);
    formAction(formData);
    setLoading(false);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Parent has been ${type === "create" ? "created" : "updated"}!`);
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

  const { students } = relatedData || { students: [] };

  // Get existing student IDs for update form
  const existingStudentIds =
    relatedData?.students?.map((student: any) => student.StudentId).join(",") ||
    "";

  // Handle AD date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setValue("birthday", date);
  };

  // Format date for input value
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return "";
    return date.toISOString().slice(0, 10);
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new parent" : "Update the parent"}
      </h1>

      {showError && state.error && (
        <ErrorDisplay
          error={state.details || state.message || "An error occurred"}
          title="Error Details"
          onClose={() => setShowError(false)}
          className="mb-4"
        />
      )}

      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors.surname}
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Birthday</label>
          <input
            type="date"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            onChange={handleDateChange}
            value={formatDateForInput(watch("birthday"))}
          />
          {errors.birthday?.message && (
            <p className="text-xs text-red-400">
              {errors.birthday.message.toString()}
            </p>
          )}
        </div>
        <InputField
          label="Student IDs(Optional)"
          name="studentId"
          defaultValue={type === "update" ? existingStudentIds : ""}
          register={register}
          error={errors?.studentId}
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

export default ParentForm;
