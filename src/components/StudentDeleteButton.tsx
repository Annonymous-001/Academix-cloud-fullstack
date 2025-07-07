/* eslint-disable @next/next/no-img-element */
"use client";
import { useTransition, useEffect } from "react";
import { toast } from "react-toastify";
import { useFormState } from "react-dom";
import { removeStudentFromClass } from "@/lib/actions";

export default function StudentDeleteButton({ enrollmentId }: { enrollmentId: string }) {
  const [state, formAction] = useFormState(removeStudentFromClass, { success: false, error: false });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      toast.success("Student removed!");
      window.location.reload();
    } else if (state.error) {
      toast.error(state.message || "Failed to remove student");
    }
  }, [state]);

  return (
    <form action={formAction} style={{ display: "inline" }}>
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <button
        type="submit"
        className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple"
        title="Remove from class"
        disabled={pending}
      >
        <img src="/delete.png" alt="Delete" width={16} height={16} />
      </button>
    </form>
  );
} 