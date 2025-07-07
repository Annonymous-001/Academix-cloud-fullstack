"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { accountantSchema, AccountantSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createAccountant, updateAccountant } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ErrorDisplay from "../ui/error-display";

const AccountantForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountantSchema>({
    resolver: zodResolver(accountantSchema),
    defaultValues: data,
  });

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const [state, formAction] = useFormState(
    type === "create" ? createAccountant : updateAccountant,
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
      toast.success(`Accountant has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      setShowError(true);
      // Still show toast for immediate feedback
      toast.error(state.message || "Something went wrong!");
    }
    if (state.success || state.error) {
      setLoading(false);
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new accountant" : "Update the accountant"}
      </h1>
      
      {/* Error Display */}
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

export default AccountantForm; 