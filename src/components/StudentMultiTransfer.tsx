"use client";
import { useState } from "react";
import { toast } from "react-toastify";
import { transferSelectedStudents } from "@/lib/actions"; // You will create this

// Define types for props
interface Enrollment {
  id: string;
  student: {
    id: string;
    name: string;
    surname?: string;
    StudentId?: string;
  };
}
interface ClassOption {
  id: number;
  name: string;
}

interface StudentMultiTransferProps {
  enrollments: Enrollment[];
  classes: ClassOption[];
  currentClassId: number;
}

export default function StudentMultiTransfer({ enrollments, classes, currentClassId }: StudentMultiTransferProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [destination, setDestination] = useState<number | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleTransfer = async () => {
    if (!destination || selectedIds.length === 0) {
      toast.error("Select students and a destination class.");
      return;
    }
    const result = await transferSelectedStudents(selectedIds, destination);
    if (result.success) {
      toast.success("Students transferred!");
      window.location.reload();
    } else {
      toast.error(result.message || "Transfer failed");
    }
  };

  return (
    <div className="mb-4">
      <div className="flex gap-2 items-center mb-2">
        <select
          value={destination ?? ""}
          onChange={e => setDestination(Number(e.target.value))}
          className="border rounded p-2"
        >
          <option value="">Select destination class</option>
          {classes.filter(c => c.id !== currentClassId).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button onClick={handleTransfer} className="bg-blue-500 text-white px-4 py-2 rounded" disabled={!destination || selectedIds.length === 0}>
          Transfer Selected
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr>
              <th className="p-2 border-b"></th>
              <th className="p-2 border-b text-left">Name</th>
              <th className="p-2 border-b text-left">Student ID</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(enrollment.id)}
                    onChange={() => toggleSelect(enrollment.id)}
                  />
                </td>
                <td className="p-2">{enrollment.student.name} {enrollment.student.surname}</td>
                <td className="p-2">{enrollment.student.StudentId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
