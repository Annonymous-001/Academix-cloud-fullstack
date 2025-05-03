"use client";

import React from "react";

export default function SortDropdown({ sort }: { sort?: string }) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(window.location.search);
    params.set("sort", e.target.value);
    window.location.search = params.toString();
  };
  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      defaultValue={sort || "dueDate"}
      onChange={handleChange}
    >
      <option value="dueDate">Sort by Due Date</option>
      <option value="amount">Sort by Amount</option>
      <option value="status">Sort by Status</option>
    </select>
  );
}
