"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { useFormState } from "react-dom";
import { createAccountant, updateAccountant } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Dispatch, SetStateAction, useEffect } from "react";
import { accountantSchema, AccountantSchema } from "@/lib/formValidationSchemas";

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
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAccountant : updateAccountant,
    { success: false, error: false }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Accountant ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit((data) => formAction(data))}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Accountant" : "Update Accountant"}
      </h1>
      
      <div className="flex flex-col gap-4">
        <InputField
          label="Username"
          name="username"
          register={register}
          error={errors.username}
          defaultValue={data?.username}
        />
        <InputField
          label="First Name"
          name="name"
          register={register}
          error={errors.name}
          defaultValue={data?.name}
        />
        <InputField
          label="Last Name"
          name="surname"
          register={register}
          error={errors.surname}
          defaultValue={data?.surname}
        />
        <InputField
          label="Email"
          name="email"
          register={register}
          error={errors.email}
          defaultValue={data?.email}
        />
        <InputField
          label="Phone"
          name="phone"
          register={register}
          error={errors.phone}
          defaultValue={data?.phone}
        />
        <InputField
          label="Address"
          name="address"
          register={register}
          error={errors.address}
          defaultValue={data?.address}
        />
        {type === "create" && (
          <InputField
            label="Password"
            name="password"
            type="password"
            register={register}
            error={errors.password}
          />
        )}
        {type === "update" && (
          <input type="hidden" {...register("id")} defaultValue={data?.id} />
        )}
      </div>

      {state.error && (
        <div className="text-red-500 text-sm">Something went wrong!</div>
      )}

      <button type="submit" className="bg-blue-500 text-white p-2 rounded-md">
        {type === "create" ? "Create Accountant" : "Update Accountant"}
      </button>
    </form>
  );
};

export default AccountantForm; 