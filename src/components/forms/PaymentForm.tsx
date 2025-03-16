"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { paymentSchema, PaymentSchema } from "@/lib/formValidationSchemas";
import { createPayment, updatePayment } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const PaymentForm = ({
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
  } = useForm<PaymentSchema>({
    resolver: zodResolver(paymentSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createPayment : updatePayment,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction(data);
    console.log(data)
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Payment has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const fees = relatedData?.fees || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Payment" : "Update Payment"}
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
              <label className="text-xs text-gray-500">Fee</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("feeId")}
                defaultValue={data?.feeId}
              >
                <option value="">Select a fee</option>
                {fees.map((fee: any) => (
                  <option value={fee.id} key={fee.id}>
                    {fee.student.name} {fee.student.surname} - ₹{fee.totalAmount}
                  </option>
                ))}
              </select>
              {errors.feeId?.message && (
                <p className="text-xs text-red-400">
                  {errors.feeId.message.toString()}
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
            label="Date"
            name="date"
            type="date"
            defaultValue={data?.date ? new Date(data.date).toISOString().split("T")[0] : undefined}
            register={register}
            error={errors?.date}
          />

          <div className="w-full md:w-[48%]">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Payment Method</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("method")}
                defaultValue={data?.method || "CASH"}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="UPI">UPI</option>
              </select>
              {errors.method?.message && (
                <p className="text-xs text-red-400">
                  {errors.method.message.toString()}
                </p>
              )}
            </div>
          </div>

          <InputField
            label="Transaction ID (if applicable)"
            name="transactionId"
            type="text"
            defaultValue={data?.transactionId}
            register={register}
            error={errors?.transactionId}
          />
        </div>
      </div>

      {state?.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create Payment" : "Update Payment"}
      </button>
    </form>
  );
};

export default PaymentForm;
