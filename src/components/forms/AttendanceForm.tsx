"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { attendanceSchema, AttendanceSchema } from "@/lib/formValidationSchemas";
import { createAttendance } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import BikramSambatDatePicker from "../BikramSambatDatePicker";
import { BSToAD } from "bikram-sambat-js";
import ErrorDisplay from "../ui/error-display";

const StudentCard = ({ student, onSwipe }: { 
  student: any;
  onSwipe: (direction: "left" | "right", studentId: string) => void;
}) => {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      const progress = e.deltaX / 200;
      setSwipeProgress(progress);
      setSwipeDirection(progress > 0 ? "right" : "left");
    },
    onSwiped: (e) => {
      if (Math.abs(e.deltaX) > 100) {
        onSwipe(e.deltaX > 0 ? "right" : "left", student.id);
      }
      setSwipeProgress(0);
      setSwipeDirection(null);
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 10,
    trackTouch: true
  });

  const activeEnrollment = student.enrollments?.find(
    (enr: any) => enr.leftAt === null
  );

  return (
    <motion.div
      {...handlers}
      className="relative w-full max-w-sm mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
      style={{
        transform: `translateX(${swipeProgress * 50}px) rotate(${swipeProgress * 10}deg)`,
        transition: swipeProgress === 0 ? 'all 0.3s' : 'none'
      }}
    >
      <div className="p-8">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          {swipeDirection === "right" && (
            <div className="text-6xl text-green-500 font-bold rotate-[-30deg]">PRESENT</div>
          )}
          {swipeDirection === "left" && (
            <div className="text-6xl text-red-500 font-bold rotate-[-30deg]">ABSENT</div>
          )}
        </div>
        <div className="relative z-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{student.name} {student.surname}</h2>
            <p className="text-gray-600 mb-1">{activeEnrollment?.class?.name || "N/A"}</p>
            <p className="text-gray-500">Roll No - {student.StudentId}</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-2">
        <div 
          className="h-full transition-all duration-200"
          style={{
            backgroundColor: swipeDirection === "right" ? "#22c55e" : 
                           swipeDirection === "left" ? "#ef4444" : "#e5e7eb",
            width: `${Math.abs(swipeProgress) * 100}%`,
            marginLeft: swipeDirection === "left" ? "auto" : 0
          }}
        />
      </div>
    </motion.div>
  );
};

const AttendanceForm = ({
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
  const [currentClassId, setCurrentClassId] = useState<string>("");
  const [currentLessonId, setCurrentLessonId] = useState<string>("");
  const [processedStudents, setProcessedStudents] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [errorState, setErrorState] = useState<{ message: string; details: any } | null>(null);
  const [skippedStudents, setSkippedStudents] = useState<string[]>([]);

  const {
    handleSubmit,
    formState: { errors },
  } = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
  });

  const [state, formAction] = useFormState(
    createAttendance as any,
    {
      success: false,
      error: false
    }
  );

  const router = useRouter();
  const classes = relatedData?.classes || [];
  const lessons = relatedData?.lessons || [];
  const students = (relatedData?.students || []).filter(
    (student: any) => {
      const activeEnrollment = student.enrollments?.find(
        (enr: any) => enr.leftAt === null && (!currentClassId || enr.classId === parseInt(currentClassId))
      );
      return (
        activeEnrollment &&
        !processedStudents.includes(student.id) &&
        !skippedStudents.includes(student.id)
      );
    }
  );

  const handleSwipe = async (direction: "left" | "right", studentId: string) => {
    if (!currentClassId) {
      toast.error("Please select a class first!");
      return;
    }

    setErrorState(null); // Clear previous errors
    const status = direction === "right" ? "PRESENT" : "ABSENT";
    const result = await createAttendance(
      { success: false, error: false },
      {
        studentId,
        classId: parseInt(currentClassId),
        ...(currentLessonId ? { lessonId: parseInt(currentLessonId) } : {}),
        date: currentDate,
        status,
      }
    );

    if (result.success) {
      setProcessedStudents(prev => [...prev, studentId]);
      toast.success(`Marked ${status.toLowerCase()}`);
    } else {
      toast.error(result.message || "Failed to mark attendance");
      setErrorState({ 
        message: result.message || "An error occurred", 
        details: result.details 
      });
    }
  };

  const handleDateSelect = (date: { year: number; month: number; day: number }) => {
    const bsDateString = `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
    const adDateString = BSToAD(bsDateString);
    setCurrentDate(new Date(adDateString));
  };

  return (
    <div className="flex flex-col gap-8 p-4">
      <h1 className="text-xl font-semibold text-center">Mark Attendance</h1>

      {errorState && (
        <ErrorDisplay
          error={errorState.details || errorState.message}
          title="Attendance Error"
          onClose={() => setErrorState(null)}
          className="mb-4"
        />
      )}

      <div className="flex flex-col gap-4">
        <div className="w-full">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Class</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              value={currentClassId}
              onChange={(e) => {
                setCurrentClassId(e.target.value);
                setCurrentLessonId(""); // Reset lesson when class changes
              }}
            >
              <option value="">Select a class</option>
              {classes.map((classItem: any) => (
                <option value={classItem.id} key={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentClassId && (
          <div className="w-full">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Lesson (Optional)</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                value={currentLessonId}
                onChange={(e) => setCurrentLessonId(e.target.value)}
              >
                <option value="">General Attendance</option>
                {lessons
                  .filter((lesson: any) => lesson.classId === parseInt(currentClassId))
                  .map((lesson: any) => (
                    <option value={lesson.id} key={lesson.id}>
                      {lesson.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        <div className="w-full">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Date (Bikram Sambat)</label>
            <BikramSambatDatePicker onDateSelect={handleDateSelect} />
          </div>
        </div>

        <div className="mt-4 relative min-h-[300px]">
          <AnimatePresence>
            {students.length > 0 ? (
              <>
                <StudentCard
                  key={students[0].id}
                  student={students[0]}
                  onSwipe={handleSwipe}
                />
                <div className="flex justify-center mt-4">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                    onClick={() => setSkippedStudents(prev => [...prev, students[0].id])}
                  >
                    Skip
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {currentClassId ? "No more students to mark attendance for" : "Please select a class"}
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between text-sm text-gray-500 mt-4">
          <span>← Swipe left for Absent</span>
          <span>Swipe right for Present →</span>
        </div>
      </div>

      {state?.error && <span className="text-red-500">Something went wrong!</span>}
    </div>
  );
};

export default AttendanceForm;
