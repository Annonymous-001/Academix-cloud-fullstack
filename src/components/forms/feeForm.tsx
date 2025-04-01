"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { feeSchema, FeeSchema } from "@/lib/formValidationSchemas";
import { createFee, updateFee } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const FeeForm = ({
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
  } = useForm<FeeSchema>({
    resolver: zodResolver(feeSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createFee : updateFee,
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
      toast(`Fee has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const students = relatedData?.students || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Fee" : "Update Fee"}
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
              <label className="text-xs text-gray-500">Student</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("studentId")}
                defaultValue={data?.studentId}
              >
                <option value="">Select a student</option>
                {students.map((student: any) => (
                  <option value={student.id} key={student.id}>
                    {student.name} {student.surname}
                  </option>
                ))}
              </select>
              {errors.studentId?.message && (
                <p className="text-xs text-red-400">
                  {errors.studentId.message.toString()}
                </p>
              )}
            </div>
          </div>

          <InputField
            label="Total Amount"
            name="totalAmount"
            type="number"
        
            defaultValue={data?.totalAmount}
            register={register}
            error={errors?.totalAmount}
           
          />

          <InputField
            label="Due Date"
            name="dueDate"
            type="date"
            defaultValue={data?.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : undefined}
            register={register}
            error={errors?.dueDate}
         
          />

          <div className="w-full md:w-[48%]">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Status</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("status")}
                defaultValue={data?.status || "UNPAID"}
              >
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="OVERDUE">Overdue</option>
                <option value="WAIVED">Waived</option>
              </select>
              {errors.status?.message && (
                <p className="text-xs text-red-400">
                  {errors.status.message.toString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {type === "update" && (
          <InputField
            label="Paid Amount"
            name="paidAmount"
            type="number"
         
            defaultValue={data?.paidAmount}
            register={register}
            error={errors?.paidAmount}
           
          />
        )}
      </div>

      {state?.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create Fee" : "Update Fee"}
      </button>
    </form>
  );
};

export default FeeForm;
