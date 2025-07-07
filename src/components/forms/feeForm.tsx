"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { feeSchema, FeeSchema } from "@/lib/formValidationSchemas";
import { createFee, updateFee } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import BikramSambatDatePicker from "../BikramSambatDatePicker";
import { BSToAD } from "bikram-sambat-js";
import ErrorDisplay from "../ui/error-display";

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
    setValue,
    formState: { errors },
  } = useForm<FeeSchema>({
    resolver: zodResolver(feeSchema),
  });

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const [state, formAction] = useFormState(
    type === "create" ? createFee : updateFee,
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
      toast.success(`Fee has been ${type === "create" ? "created" : "updated"}!`);
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

  const students = useMemo(
    () => relatedData?.students || [],
    [relatedData?.students]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(
    data?.studentId
      ? students.find((student: any) => student.id === data.studentId)
      : null
  );

  // Ensure selected student and search term are set when editing and students are loaded
  useEffect(() => {
    if (type === "update" && data?.studentId && students.length > 0) {
      const found = students.find(
        (student: any) => student.id === data.studentId
      );
      if (found) {
        setSelectedStudent(found);
        setSearchTerm(`${found.name} ${found.surname} (${found.StudentId})`);
        setValue("studentId", found.id);
        setIsDropdownOpen(false);
      }
    }
  }, [type, data?.studentId, students, setValue]);

  const filteredStudents = useMemo(
    () =>
      students.filter((student: any) => {
        const fullName = `${student.name} ${student.surname}`.toLowerCase();
        const studentId = student.StudentId?.toLowerCase() || "";
        const searchLower = searchTerm.toLowerCase();
        return (
          fullName.includes(searchLower) || studentId.includes(searchLower)
        );
      }),
    [students, searchTerm]
  );

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setSearchTerm(`${student.name} ${student.surname} (${student.StudentId})`);
    setValue("studentId", student.id);
    setTimeout(() => setIsDropdownOpen(false), 100);
  };

  const handleDueDateSelect = (date: {
    year: number;
    month: number;
    day: number;
  }) => {
    const bsDateString = `${date.year}-${date.month
      .toString()
      .padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
    const adDateString = BSToAD(bsDateString);
    const adDate = new Date(adDateString);
    setValue("dueDate", adDate);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".student-dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create New Fee" : "Update Fee"}
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
          <div className="w-full md:w-[48%] student-dropdown-container">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Search Student</label>
              <input
                type="text"
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onClick={() => setIsDropdownOpen(true)}
              />
              {isDropdownOpen && filteredStudents.length > 0 && (
                <div className="absolute bg-white mt-12 shadow-lg rounded-md max-h-60 overflow-y-auto z-10 w-full max-w-md">
                  {filteredStudents.map((student: any) => (
                    <div
                      key={student.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleStudentSelect(student)}
                    >
                      <div className="flex justify-between items-center">
                        <span>
                          {student.name} {student.surname}
                        </span>
                        <span className="text-gray-500 text-sm">
                          ID: {student.StudentId || "N/A"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {student.class?.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedStudent ? (
                <input
                  type="hidden"
                  {...register("studentId")}
                  value={selectedStudent.id}
                />
              ) : (
                <input type="hidden" {...register("studentId")} />
              )}
              {errors.studentId?.message && (
                <p className="text-xs text-red-400">
                  {errors.studentId.message.toString()}
                </p>
              )}
            </div>
          </div>

          <InputField
            label={`Total Amount${type === "create" ? " *" : ""}`}
            name="totalAmount"
            type="number"
            defaultValue={data?.totalAmount}
            register={register}
            error={errors?.totalAmount}
          />

          <div className="w-full md:w-[48%]">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Due Date</label>
              <BikramSambatDatePicker onDateSelect={handleDueDateSelect} />
              {errors.dueDate?.message && (
                <p className="text-xs text-red-400">
                  {errors.dueDate.message.toString()}
                </p>
              )}
            </div>
          </div>

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
            defaultValue={data?.paidAmount ?? ""}
            register={register}
            error={errors?.paidAmount}
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
          ? "Create Fee"
          : "Update Fee"}
      </button>
    </form>
  );
};

export default FeeForm;
