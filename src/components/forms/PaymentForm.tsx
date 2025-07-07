"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { paymentSchema, PaymentSchema } from "@/lib/formValidationSchemas";
import { createPayment, updatePayment } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import BikramSambatDatePicker from "../BikramSambatDatePicker";
import { BSToAD } from "bikram-sambat-js";
import ErrorDisplay from "../ui/error-display";

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

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const [state, formAction] = useFormState(
    type === "create" ? createPayment : updatePayment,
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
    await formAction(formData);
    setLoading(false);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(
        `Payment has been ${type === "create" ? "created" : "updated"}!`
      );
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

  // Memoize fees to avoid unnecessary re-renders and fix exhaustive-deps warning
  const fees = useMemo(() => relatedData?.fees || [], [relatedData?.fees]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(
    data?.feeId ? fees.find((fee: any) => fee.id === data.feeId) : null
  );

  // Ensure selected fee and search term are set when editing and fees are loaded
  useEffect(() => {
    if (type === "update" && data?.feeId && fees.length > 0) {
      const found = fees.find((fee: any) => fee.id === data.feeId);
      if (found) {
        setSelectedFee(found);
        setSearchTerm(
          `${found.student.name} ${found.student.surname} (${
            found.student.StudentId || "N/A"
          })`
        );
        setValue("feeId", found.id);
        setIsDropdownOpen(false);
      }
    }
  }, [type, data?.feeId, fees, setValue]);

  const filteredFees = fees.filter((fee: any) => {
    const fullName = `${fee.student.name} ${fee.student.surname}`.toLowerCase();
    const studentId = fee.student.StudentId?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();
    return fullName.includes(searchLower) || studentId.includes(searchLower);
  });

  const handleFeeSelect = (fee: any) => {
    setSelectedFee(fee);
    setSearchTerm(
      `${fee.student.name} ${fee.student.surname} (${
        fee.student.StudentId || "N/A"
      })`
    );
    setValue("feeId", fee.id);
    setTimeout(() => setIsDropdownOpen(false), 100);
  };

  const handleDateSelect = (date: {
    year: number;
    month: number;
    day: number;
  }) => {
    const bsDateString = `${date.year}-${date.month
      .toString()
      .padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
    const adDateString = BSToAD(bsDateString);
    const adDate = new Date(adDateString);
    setValue("date", adDate);
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
                      <div>
                        <span>
                          {fee.student.name} {fee.student.surname}
                        </span>
                        <span className="text-gray-500 text-sm ml-2">
                          ID: {fee.student.StudentId || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {fee.student.class?.name}
                        </span>
                        <span className="text-green-600 font-semibold">
                          {Number(
                            fee.totalAmount - fee.paidAmount
                          ).toLocaleString()}
                        </span>
                      </div>
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

          <div className="w-full md:w-[48%]">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Date</label>
              <BikramSambatDatePicker onDateSelect={handleDateSelect} />
              {errors.date?.message && (
                <p className="text-xs text-red-400">
                  {errors.date.message.toString()}
                </p>
              )}
            </div>
          </div>

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
            defaultValue={data?.transactionId || ""}
            register={register}
            error={errors?.transactionId}
          />
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
          ? "Create Payment"
          : "Update Payment"}
      </button>
    </form>
  );
};

export default PaymentForm;
