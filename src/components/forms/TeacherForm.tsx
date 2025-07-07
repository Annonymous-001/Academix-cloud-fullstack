"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import { ADToBS, BSToAD } from "bikram-sambat-js";
import ErrorDisplay from "../ui/error-display";

// Add this type definition after imports
type FormState = {
  success: boolean;
  error: boolean;
  message?: string;
  details?: any;
}

const TeacherForm = ({
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
  console.log("TeacherForm props:", { type, data, relatedData });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
  });

  const [img, setImg] = useState<any>();
  const [bsBirthday, setBsBirthday] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  // Convert AD date to BS when component mounts or data changes
  useEffect(() => {
    if (data?.birthday) {
      const adDate = new Date(data.birthday);
      const year = adDate.getFullYear();
      if (!isNaN(adDate.getTime()) && year >= 1913 && year <= 2043) {
        const bsDate = ADToBS(adDate.toISOString().split('T')[0]);
        setBsBirthday(bsDate);
      } else {
        setBsBirthday("");
      }
    }
  }, [data]);

  // Set existing image when updating
  useEffect(() => {
    if (type === "update" && data?.img) {
      console.log("Setting existing image:", data.img);
      setImg({ secure_url: data.img });
    }
  }, [data, type]);

  // Set existing subjects when updating
  useEffect(() => {
    if (type === "update" && data?.subjects) {
      console.log("Setting subjects:", data.subjects);
      // Convert subjects array to array of IDs
      const subjectIds = data.subjects.map((subject: any) => 
        typeof subject === 'object' ? subject.id.toString() : subject.toString()
      );
      console.log("Subject IDs:", subjectIds);
      setValue('subjects', subjectIds);
    }
  }, [data, type, setValue]);

  // Handle BS date change
  const handleBSDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bsDate = e.target.value;
    setBsBirthday(bsDate);
    
    // Convert BS date to AD and set form value
    try {
      const adDate = BSToAD(bsDate);
      // Convert to ISO string and create a new Date object
      const dateObj = new Date(adDate);
      setValue('birthday', dateObj.toISOString());
    } catch (error) {
      console.error('Invalid BS date format');
    }
  };

  const [state, formAction] = useFormState<FormState, TeacherSchema>(
    async (_, data) => {
      if (type === "create") {
        return createTeacher({ success: false, error: false, message: "" }, data);
      }
      return updateTeacher({ success: false, error: false, message: "" }, data);
    },
    {
      success: false,
      error: false,
      message: "",
      details: null,
    }
  );

  const onSubmit = handleSubmit(async (formData) => {
    try {
      setLoading(true);
      setShowError(false);
      
      console.log("Form data:", formData);
      console.log("Teacher data:", data);
      console.log("Type:", type);
      
      // Prepare the data for submission
      const submitData = {
        ...formData,
        // Include the ID for updates
        ...(type === "update" && data?.id && { id: data.id }),
        // Handle image
        img: img?.secure_url || data?.img,
        // Ensure subjects is properly formatted
        subjects: formData.subjects || []
      };
      
      console.log("Submit data:", submitData);
      
      formAction(submitData);
    } catch (error: any) {
      console.error("Form submission error:", error);
      setLoading(false);
      
      // Handle Clerk errors
      if (error.errors?.[0]) {
        const clerkError = error.errors[0];
        if (clerkError.code === 'form_data_missing') {
          setError('email', { 
            type: 'manual',
            message: 'Invalid email format'
          });
        } else {
          toast.error(clerkError.longMessage || 'Something went wrong');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Teacher has been ${type === "create" ? "created" : "updated"}!`);
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

  const { subjects } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new teacher" : "Update the teacher"}
      </h1>

      {showError && state.error && (
        <ErrorDisplay
          error={state.details || state.message || "An error occurred"}
          title="Error Details"
          onClose={() => setShowError(false)}
          className="mb-4"
        />
      )}

      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors.surname}
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        />
        <InputField
          label="Blood Type"
          name="bloodType"
          defaultValue={data?.bloodType}
          register={register}
          error={errors.bloodType}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Birthday (BS)</label>
          <input
            type="text"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            placeholder="YYYY-MM-DD"
            value={bsBirthday}
            onChange={handleBSDateChange}
          />
          {errors.birthday?.message && (
            <p className="text-xs text-red-400">
              {errors.birthday.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sex</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
            defaultValue={data?.sex}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Subjects</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("subjects")}
            defaultValue={data?.subjects}
          >
            {subjects.map((subject: { id: number; name: string }) => (
              <option value={subject.id} key={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjects?.message && (
            <p className="text-xs text-red-400">
              {errors.subjects.message.toString()}
            </p>
          )}
        </div>
        <div className="flex justify-center w-full">
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "school"}
            onSuccess={(result, { widget }) => {
              setImg(result.info);
              widget.close();
            }}
          >
            {({ open }) => {
              return (
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
                    onClick={() => open()}
                  >
                    <Image src="/upload.png" alt="" width={28} height={28} />
                    <span>Upload a photo</span>
                  </div>

                  {img && (
                    <div className="mt-2">
                      <Image
                        src={img.secure_url}
                        alt="Uploaded Image Preview"
                        width={100}
                        height={100}
                        className="rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              );
            }}
          </CldUploadWidget>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className={`${
          loading ? "bg-gray-400" : "bg-blue-400"
        } text-white p-2 rounded-md transition-colors`}
      >
        {loading
          ? `${type === "create" ? "Creating" : "Updating"}...`
          : type === "create"
          ? "Create"
          : "Update"}
      </button>
    </form>
  );
};

export default TeacherForm;
