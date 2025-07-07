"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { subjectSchema, SubjectSchema } from "@/lib/formValidationSchemas";
import { createSubject, updateSubject } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import ErrorDisplay from "../ui/error-display";

type FormState = {
  success: boolean;
  error: boolean;
  message?: string;
  details?: any;
};

const SubjectForm = ({
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
  // Extract teacher IDs from data.teachers (could be objects or IDs)
  const getInitialTeacherIds = () => {
    if (!data?.teachers) return [];
    
    // If teachers is an array of objects, extract the IDs
    if (Array.isArray(data.teachers) && data.teachers.length > 0) {
      if (typeof data.teachers[0] === 'object' && data.teachers[0]?.id) {
        return data.teachers.map((teacher: any) => teacher.id);
      }
      // If it's already an array of IDs
      return data.teachers;
    }
    
    return [];
  };

  const initialTeacherIds = getInitialTeacherIds();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      teachers: initialTeacherIds,
    },
  });

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(initialTeacherIds);

  const [state, formAction] = useFormState<FormState, SubjectSchema>(
    async (_, data) => {
      if (type === "create") {
        return createSubject({ success: false, error: false }, data);
      }
      return updateSubject({ success: false, error: false }, data);
    },
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
    // Update the form data with selected teachers
    formData.teachers = selectedTeachers;
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Subject has been ${type === "create" ? "created" : "updated"}!`);
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

  const { teachers } = relatedData;

  const addTeacher = (teacherId: string) => {
    if (!selectedTeachers.includes(teacherId)) {
      const updatedTeachers = [...selectedTeachers, teacherId];
      setSelectedTeachers(updatedTeachers);
      setValue("teachers", updatedTeachers);
    }
  };

  const removeTeacher = (teacherId: string) => {
    const updatedTeachers = selectedTeachers.filter(id => id !== teacherId);
    setSelectedTeachers(updatedTeachers);
    setValue("teachers", updatedTeachers);
  };

  const getSelectedTeacherNames = () => {
    return selectedTeachers.map(teacherId => {
      const teacher = teachers.find((t: any) => t.id === teacherId);
      return teacher ? `${teacher.name} ${teacher.surname}` : teacherId;
    });
  };

  const getAvailableTeachers = () => {
    return teachers.filter((teacher: any) => !selectedTeachers.includes(teacher.id));
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new subject" : "Update the subject"}
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
        <InputField
          label="Subject name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
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

        {/* Teacher Selection Section */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-700">Teachers</label>
          
          {/* Selected Teachers Display */}
          {selectedTeachers.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Selected Teachers:</h4>
              <div className="flex flex-wrap gap-2">
                {getSelectedTeacherNames().map((teacherName, index) => (
                  <div
                    key={selectedTeachers[index]}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{teacherName}</span>
                    <button
                      type="button"
                      onClick={() => removeTeacher(selectedTeachers[index])}
                      className="text-blue-600 hover:text-blue-800 text-lg font-bold leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Teachers */}
          <div className="bg-white border border-gray-300 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Available Teachers:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {getAvailableTeachers().map((teacher: any) => (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-700">
                    {teacher.name} {teacher.surname}
                  </span>
                  <button
                    type="button"
                    onClick={() => addTeacher(teacher.id)}
                    className="text-green-600 hover:text-green-800 text-lg font-bold leading-none ml-2"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
            {getAvailableTeachers().length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                All teachers have been selected
              </p>
            )}
          </div>

          {/* Hidden input for form validation */}
          <input
            type="hidden"
            {...register("teachers")}
            value={selectedTeachers.join(",")}
          />
          
          {errors.teachers?.message && (
            <p className="text-xs text-red-400">
              {errors.teachers.message.toString()}
            </p>
          )}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className={`${
          loading ? "bg-gray-400" : "bg-blue-400 hover:bg-blue-500"
        } text-white p-3 rounded-md transition-colors font-medium`}
      >
        {loading
          ? `${type === "create" ? "Creating" : "Updating"}...`
          : type === "create"
          ? "Create Subject"
          : "Update Subject"}
      </button>
    </form>
  );
};

export default SubjectForm;
