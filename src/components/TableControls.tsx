"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import TableSearch from "./TableSearch";

interface TableControlsProps {
  table: string;
  sortField: string;
  sortOrder: string;
}

const TableControls = ({ table, sortField, sortOrder }: TableControlsProps) => {
  const router = useRouter();

  const handleSearch = (value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("search", value);
    } else {
      url.searchParams.delete("search");
    }
    router.push(url.pathname + url.search);
  };

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = new URL(window.location.href);
    const [field, order] = e.target.value.split("-");
    url.searchParams.set("sortBy", field);
    url.searchParams.set("sortOrder", order);
    router.push(url.pathname + url.search);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
      <TableSearch 
        placeholder={`Search ${table}...`}
        debounceTime={300}
        onSearch={handleSearch}
      />
      <div className="flex items-center gap-4 self-end">
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
          <Image src="/filter.png" alt="" width={14} height={14} />
        </button>
        <select 
          className="px-2 py-1 rounded border border-gray-300"
          onChange={handleSort}
          value={`${sortField}-${sortOrder}`}
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="teacherId-asc">Teacher ID (A-Z)</option>
          <option value="teacherId-desc">Teacher ID (Z-A)</option>
          <option value="phone-asc">Phone (A-Z)</option>
          <option value="phone-desc">Phone (Z-A)</option>
        </select>
      </div>
    </div>
  );
};

export default TableControls; 