'use client';

import { useState } from "react";
import Image from "next/image";

type Student = {
  id: number | string;
  name: string;
  surname?: string;
  studentId?: string;
  img?: string;
  phone?: string;
  address?: string;
};

type Props = {
  students: Student[];
};

export default function StudentTransferTable({ students }: Props) {
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  return (
    <div>
      <table className="w-full mb-4">
        <thead>
          <tr>
            <th>Name</th>
            <th>Student ID</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.name} {student.surname}</td>
              <td>{student.studentId}</td>
              <td>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky"
                  onClick={() => setViewStudent(student)}
                >
                  <Image src="/view.png" alt="" width={16} height={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {viewStudent && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Student Details</h3>
          <div className="flex items-center gap-4">
            <Image
              src={viewStudent.img || "/noAvatar.png"}
              alt={viewStudent.name}
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <div><strong>Name:</strong> {viewStudent.name} {viewStudent.surname}</div>
              <div><strong>Student ID:</strong> {viewStudent.studentId}</div>
              <div><strong>Phone:</strong> {viewStudent.phone}</div>
              <div><strong>Address:</strong> {viewStudent.address}</div>
            </div>
          </div>
          <button
            className="mt-4 px-3 py-1 bg-gray-200 rounded"
            onClick={() => setViewStudent(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
