"use client";

import React, { useRef, useState, useEffect } from "react";
import StudentIDCard, { StudentData } from "@/components/StudentIDCard";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getStudentIdCardData } from "@/lib/actions";
import { ADToBS } from "bikram-sambat-js";

export default function IDCardPage({ params }: { params: { id: string } }) {
  const [form, setForm] = useState<StudentData>({
    regNo: "",
    name: "",
    classGrade: "",
    dob: "",
    bloodGroup: "",
    contactNo: "",
    studentType: "",
    address: "",
    photoUrl: "",
  });

  const idCardRef = useRef<HTMLDivElement>(null);

  // Fetch student data on mount
  useEffect(() => {
    (async () => {
      const res = await getStudentIdCardData(params.id);
      if (res.success && res.data) {
        const d = res.data;
        setForm({
          regNo: d.StudentId || "",
          name: `${d.name} ${d.surname}`,
          classGrade: d.enrollments?.[0]?.class?.name || "",
          dob: d.birthday
            ? typeof d.birthday === "string"
              ? d.birthday
              : d.birthday.toISOString().slice(0, 10)
            : "",
          bloodGroup: d.bloodType || "",
          contactNo: d.phone || "",
          studentType: "Foot",
          address: d.address || "",
          photoUrl: d.img || "",
        });
      }
    })();
  }, [params.id]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({ ...prev, photoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Download as PDF
  const handleDownload = async () => {
    if (!idCardRef.current) return;
    const canvas = await html2canvas(idCardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [350, 550],
    });
    pdf.addImage(imgData, "PNG", 0, 0, 350, 550);
    pdf.save(`${form.name.replace(/\s+/g, "_")}_ID_Card.pdf`);
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        background: "white",
        padding: 20,
        borderRadius: 8,
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#333" }}>Student ID Card Generator</h1>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 30,
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        {/* Form */}
        <div style={{ flex: "1 0 320px", minWidth: 320 }}>
          <div style={{ marginBottom: 12 }}>
            <label>Registration Number:</label>
            <input
              type="text"
              name="regNo"
              value={form.regNo}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Student Name:</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Class/Grade:</label>
            <input
              type="text"
              name="classGrade"
              value={form.classGrade}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>
          {/* AD input */}
        
          {/* BS display */}
          <div style={{ marginBottom: 12 }}>
            <label>Date of Birth (B.S.):</label>
            <input
              type="text"
              value={form.dob ? ADToBS(form.dob) : ""}
              readOnly
              style={{ width: "100%", background: "#f3f3f3" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Blood Group:</label>
            <input
              type="text"
              name="bloodGroup"
              value={form.bloodGroup}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Contact Number:</label>
            <input
              type="text"
              name="contactNo"
              value={form.contactNo}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Student Type:</label>
            <input
              type="text"
              name="studentType"
              value={form.studentType}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Address:</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Student Photo:</label>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} />
          </div>
          <button
            onClick={handleDownload}
            style={{
              background: "#7c4dbe",
              color: "white",
              border: "none",
              padding: "10px 20px",
              fontSize: 16,
              borderRadius: 4,
              cursor: "pointer",
              marginTop: 20,
              width: "100%",
            }}
          >
            Download ID Card
          </button>
        </div>
        {/* ID Card Preview */}
        <div style={{ flex: "1 0 350px", minWidth: 350 }}>
          <StudentIDCard
            data={{
              ...form,
              dob: form.dob ? ADToBS(form.dob) : "",
            }}
            idCardRef={idCardRef}
          />
        </div>
      </div>
    </div>
  );
}
