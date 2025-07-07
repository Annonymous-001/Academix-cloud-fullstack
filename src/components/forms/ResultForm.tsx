"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { resultSchema, ResultSchema } from "@/lib/formValidationSchemas";
import { createResult, updateResult } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import ErrorDisplay from "../ui/error-display";

const ResultForm = ({
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema),
  });

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const [state, formAction] = useFormState(
    type === "create" ? createResult : updateResult,
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
      toast.success(`Result has been ${type === "create" ? "created" : "updated"}!`);
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

  const { students, exams, assignments } = relatedData;

  // Watch the assessment type to conditionally render exam/assignment select
  const assessmentType = watch("assessmentType");

  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    if (data?.studentId && students.length > 0) {
      const initialStudent = students.find((s: any) => s.id === data.studentId);
      if (initialStudent) {
        setSelectedStudent(initialStudent);
        setSearchTerm(
          `${initialStudent.name} ${initialStudent.surname} (${
            initialStudent.StudentId || "N/A"
          })`
        );
      }
    }
  }, [data, students]);

  const filteredStudents = students.filter((student: any) => {
    const fullName = `${student.name} ${student.surname}`.toLowerCase();
    const studentId = student.StudentId?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();
    return fullName.includes(searchLower) || studentId.includes(searchLower);
  });

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setSearchTerm(
      `${student.name} ${student.surname} (${student.StudentId || "N/A"})`
    );
    setValue("studentId", student.id);
    setTimeout(() => setIsDropdownOpen(false), 100);
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
        {type === "create" ? "Create a new result" : "Update the result"}
      </h1>

      {showError && state.error && (
        <ErrorDisplay
          error={state.details || state.message || "An error occurred"}
          title="Error Details"
          onClose={() => setShowError(false)}
          className="mb-4"
        />
      )}

      <div className="flex justify-between flex-wrap gap-4">
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

        <div className="flex flex-col gap-2 w-full md:w-1/3 student-dropdown-container">
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

        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Assessment Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("assessmentType")}
            defaultValue={data?.exam ? "exam" : "assignment"}
          >
            <option value="">Select type</option>
            <option value="exam">Exam</option>
            <option value="assignment">Assignment</option>
          </select>
        </div>

        {assessmentType === "exam" && (
          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <label className="text-xs text-gray-500">Exam</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("examId")}
              defaultValue={data?.examId}
            >
              <option value="">Select an exam</option>
              {exams.map((exam: { id: number; title: string; lesson: any }) => (
                <option value={exam.id} key={exam.id}>
                  {exam.title} - {exam.lesson?.class?.name}
                </option>
              ))}
            </select>
            {errors.examId?.message && (
              <p className="text-xs text-red-400">
                {errors.examId.message.toString()}
              </p>
            )}
          </div>
        )}

        {assessmentType === "assignment" && (
          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <label className="text-xs text-gray-500">Assignment</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("assignmentId")}
              defaultValue={data?.assignmentId}
            >
              <option value="">Select an assignment</option>
              {assignments.map(
                (assignment: { id: number; title: string; lesson: any }) => (
                  <option value={assignment.id} key={assignment.id}>
                    {assignment.title} - {assignment.lesson?.class?.name}
                  </option>
                )
              )}
            </select>
            {errors.assignmentId?.message && (
              <p className="text-xs text-red-400">
                {errors.assignmentId.message.toString()}
              </p>
            )}
          </div>
        )}

        <InputField
          label="Score"
          name="score"
          type="number"
          defaultValue={data?.score}
          register={register}
          error={errors?.score}
        />
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

export default ResultForm;
