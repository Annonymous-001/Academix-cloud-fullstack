"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { financeSchema, FinanceSchema } from "@/lib/formValidationSchemas";
import { createFinance, updateFinance } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const FinanceForm = ({
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
  } = useForm<FinanceSchema>({
    resolver: zodResolver(financeSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createFinance : updateFinance,
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
      toast(`Financial record has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Financial Record" : "Update Financial Record"}
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
              <label className="text-xs text-gray-500">Expense Type</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("expenseType")}
                defaultValue={data?.expenseType}
              >
                <option value="">Select expense type</option>
                <option value="BUS">Bus</option>
                <option value="SALARY">Salary</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="SUPPLIES">Supplies</option>
                <option value="UTILITIES">Utilities</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.expenseType?.message && (
                <p className="text-xs text-red-400">
                  {errors.expenseType.message.toString()}
                </p>
              )}
            </div>
          </div>

          <InputField
            label="Amount"
            name="amount"
            type="number"
            defaultValue={data?.amount}
            register={register}
            error={errors?.amount}
          />

          <InputField
            label="Description"
            name="description"
            type="text"
            defaultValue={data?.description}
            register={register}
            error={errors?.description}
          />
        </div>
      </div>

      {state?.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create Record" : "Update Record"}
      </button>
    </form>
  );
};

export default FinanceForm;
