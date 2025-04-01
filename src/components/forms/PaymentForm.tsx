"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { paymentSchema, PaymentSchema } from "@/lib/formValidationSchemas";
import { createPayment, updatePayment } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
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
    setValue,
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

  const onSubmit = handleSubmit((formData) => {
    formAction(formData);
    console.log(formData);
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(
    data?.feeId ? fees.find((fee: any) => fee.id === data.feeId) : null
  );

  const filteredFees = fees.filter((fee: any) => {
    const fullName = `${fee.student.name} ${fee.student.surname}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleFeeSelect = (fee: any) => {
    setSelectedFee(fee);
    setSearchTerm(`${fee.student.name} ${fee.student.surname}`);
    setValue("feeId", fee.id);
    setTimeout(() => setIsDropdownOpen(false), 100);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".fee-dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Make sure transaction ID is properly initialized from data
  useEffect(() => {
    if (data && data.transactionId) {
      setValue("transactionId", data.transactionId);
    }
  }, [data, setValue]);

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
          <div className="w-full md:w-[48%] fee-dropdown-container">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Search Student</label>
              <input
                type="text"
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                placeholder="Search for student..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onClick={() => setIsDropdownOpen(true)}
              />
              {isDropdownOpen && filteredFees.length > 0 && (
                <div className="absolute bg-white mt-12 shadow-lg rounded-md max-h-60 overflow-y-auto z-10 w-full max-w-md">
                  {filteredFees.map((fee: any) => (
                    <div
                      key={fee.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                      onClick={() => handleFeeSelect(fee)}
                    >
                      <span>{fee.student.name} {fee.student.surname}</span>
                      <span className="text-green-600 font-semibold">
                        {Number(fee.totalAmount - fee.paidAmount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {selectedFee ? (
                <input
                  type="hidden"
                  {...register("feeId")}
                  value={selectedFee.id}
                />
              ) : (
                <input type="hidden" {...register("feeId")} />
              )}
              {errors.feeId?.message && (
                <p className="text-xs text-red-400">{errors.feeId.message.toString()}</p>
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
            defaultValue={data?.date ? new Date(data.date).toISOString().split("T")[0] : ""}
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
                <p className="text-xs text-red-400">{errors.method.message.toString()}</p>
              )}
            </div>
          </div>

          <InputField
            label="Transaction ID (if applicable)"
            name="transactionId"
            type="text"
            defaultValue={data?.transactionId || ""}
            register={register}
            error={errors?.transactionId}
          />
        </div>
      </div>

      {state?.error && <span className="text-red-500">Something went wrong!</span>}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create Payment" : "Update Payment"}
      </button>
    </form>
  );
};

export default PaymentForm;
