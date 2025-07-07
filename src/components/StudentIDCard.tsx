/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ADToBS } from "bikram-sambat-js";

export interface StudentData {
  regNo: string;
  name: string;
  classGrade: string;
  dob: string;
  bloodGroup: string;
  contactNo: string;
  studentType: string;
  address: string;
  photoUrl?: string;
  principalSignatureUrl?: string;
}

interface StudentIDCardProps {
  data: StudentData;
  idCardRef?: React.RefObject<HTMLDivElement>;
}

// Helper to convert AD date string to BS string
function toBSDate(adDate: string): string {
  if (!adDate) return "";
  try {
    // Accepts "YYYY-MM-DD" or "YYYY/MM/DD"
    const [y, m, d] = adDate.split(/-|\//).map(Number);
    // ADToBS expects "YYYY-MM-DD"
    const adString = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const bsDate = ADToBS(adString); // returns "YYYY-MM-DD"
    return bsDate;
  } catch {
    return adDate;
  }
}

const CARD_WIDTH = 350;
const CARD_HEIGHT = 550;

const StudentIDCard: React.FC<StudentIDCardProps> = ({ data, idCardRef }) => (
  <div
    ref={idCardRef}
    style={{
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      background: "linear-gradient(to bottom, #7c4dbe 0%, #eae6f7 60%)",
      borderRadius: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      position: "relative",
      overflow: "hidden",
      fontFamily: "Arial, sans-serif",
      border: "2px solid #7c4dbe",
      margin: "0 auto",
      padding: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
    }}
  >
    {/* Header */}
    <div
      style={{
        background: "#7c4dbe",
        color: "white",
        padding: "10px 16px 6px 16px",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        position: "relative",
        minHeight: 90,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: "bold", position: "absolute", left: 10, top: 8 }}>
        Regd.No.:
      </div>
      <div style={{ fontSize: 12, fontWeight: "bold", position: "absolute", right: 10, top: 8 }}>
        {data.regNo}
      </div>
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <div style={{ fontSize: 15, fontWeight: "bold", lineHeight: 1.1 }}>
          SHREE NARAYANI GANDAKI SADHARAN TATHA<br />
          SANSKRIT SECONDARY SCHOOL
        </div>
        <div style={{ fontSize: 11, marginTop: 2 }}>
          Binayi Triveni-6, Trivenidham<br />
          Estd.: 2022 B.S.<br />
          <span style={{ fontSize: 10 }}>narayanigandakiss@gmail.com</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 10, top: 28 }}>
        <svg width="38" height="38" viewBox="0 0 38 38">
          <polygon
            points="19,3 23,15 36,15 25,23 29,35 19,27 9,35 13,23 2,15 15,15"
            fill="none"
            stroke="#fff"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>

    {/* Main Content */}
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        marginTop: 10,
        marginBottom: 10,
      }}
    >
      {/* Photo */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "white",
          border: "4px solid #7c4dbe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          zIndex: 2,
          marginBottom: 10,
        }}
      >
        <img
          src={data.photoUrl || "/api/placeholder/120/120"}
          alt="Student"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Name and Class */}
      <div style={{ width: "100%", textAlign: "center", marginBottom: 6 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "#1976d2",
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          {data.name}
        </div>
        <div
          style={{
            display: "inline-block",
            background: "#7c4dbe",
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
            borderRadius: 6,
            padding: "2px 18px",
            marginBottom: 4,
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={data.classGrade}
        >
          {data.classGrade}
        </div>
      </div>

      {/* Details Section - moved up and left */}
      <div
        style={{
          width: "100%",
          padding: "0 24px",
          fontSize: 15,
          color: "#222",
          lineHeight: 1.8,
          marginTop: -20,
          marginLeft: -10,
          textAlign: "left",
        }}
      >
        {[
          ["DOB", data.dob],
          ["Blood Group", data.bloodGroup],
          ["Contact No.", data.contactNo],
          ["Student Type", data.studentType],
          ["Address", data.address],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", marginBottom: 6 }}>
            <div style={{ width: 110, fontWeight: "bold" }}>{label}</div>
            <div>: {value || "-"}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Signature and Principal */}
    <div
      style={{
        position: "absolute",
        bottom: 38,
        left: 24,
        width: "120px",
        height: "28px",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      {data.principalSignatureUrl ? (
        <img
          src={data.principalSignatureUrl}
          alt="Principal Signature"
          style={{
            maxHeight: "28px",
            maxWidth: "100%",
            objectFit: "contain",
            opacity: 0.85,
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "20px",
            borderBottom: "1px solid #aaa",
            opacity: 0.5,
          }}
        ></div>
      )}
    </div>
    <div
      style={{
        position: "absolute",
        bottom: 38,
        right: 24,
        fontSize: 14,
        color: "#7c4dbe",
        fontWeight: "bold",
        textAlign: "right",
        width: "120px",
      }}
    >
      Principal
    </div>
    <div
      style={{
        position: "absolute",
        bottom: 0,
        width: "100%",
        background: "#7c4dbe",
        color: "white",
        fontSize: 13,
        textAlign: "center",
        padding: "7px 0",
        fontStyle: "italic",
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
      }}
    >
      If found, kindly return to the school.
    </div>
  </div>
);

export default StudentIDCard;
