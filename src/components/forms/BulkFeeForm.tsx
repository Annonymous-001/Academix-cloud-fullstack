"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bulkFeeSchema, type BulkFeeSchema } from "@/lib/formValidationSchemas";
import { createBulkFees } from "@/lib/actions";
import { useTransition, useState } from "react";
import { toast } from "react-toastify";
import InputField from "@/components/InputField";
import { BSToAD } from "bikram-sambat-js";

interface BulkFeeFormProps {
  classId: number;
  className: string;
  onSuccess?: () => void;
}

const BulkFeeForm = ({ classId, className, onSuccess }: BulkFeeFormProps) => {
  const [loading, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BulkFeeSchema>({
    resolver: zodResolver(bulkFeeSchema),
    defaultValues: {
      classId: classId,
      year: 2081,
    },
  });

  const onSubmit = (data: BulkFeeSchema) => {
    startTransition(async () => {
      const result = await createBulkFees({ success: false, error: false }, data);
      
      if (result.success) {
        toast.success(result.message || "Bulk fees created successfully!");
        reset();
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to create bulk fees");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md mb-4">
        <h3 className="font-medium text-gray-900 mb-2">Create Fees for {className}</h3>
        <p className="text-sm text-gray-600">
          This will create fees for all students currently enrolled in this class.
        </p>
      </div>

      <InputField
        label="Class"
        name="classId"
        type="hidden"
        defaultValue={classId.toString()}
        register={register}
        error={errors?.classId}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Total Amount"
          name="totalAmount"
          type="number"
          register={register}
          error={errors?.totalAmount}
          inputProps={{ placeholder: "Enter amount" }}
        />

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Due Date (AD)</label>
          <input
            type="date"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("dueDate")}
          />
          {errors.dueDate?.message && (
            <p className="text-xs text-red-400">
              {errors.dueDate.message.toString()}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Academic Year (BS)"
          name="year"
          type="number"
          register={register}
          error={errors?.year}
          inputProps={{ placeholder: "e.g., 2081" }}
        />

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Description (Optional)</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full resize-none"
            rows={3}
            placeholder="Enter fee description..."
            {...register("description")}
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
        className={`w-full p-2 rounded-md text-white transition ${
          loading
            ? "bg-blue-300 cursor-not-allowed"
            : "bg-blue-400 hover:bg-blue-500"
        }`}
      >
        {loading ? "Creating Fees..." : "Create Fees for All Students"}
      </button>
    </form>
  );
};

export default BulkFeeForm; 