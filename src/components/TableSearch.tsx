"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TableSearchProps {
  placeholder?: string;
  debounceTime?: number;
  onSearch?: (value: string) => void;
}

const TableSearch = ({ 
  placeholder = "Search...", 
  debounceTime = 300,
  onSearch 
}: TableSearchProps) => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchValue);
      } else {
        const params = new URLSearchParams(window.location.search);
        if (searchValue) {
          params.set("search", searchValue);
        } else {
          params.delete("search");
        }
        router.push(`${window.location.pathname}?${params}`);
      }
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [searchValue, debounceTime, router, onSearch]);

  return (
    <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="w-[200px] p-2 bg-transparent outline-none"
      />
    </div>
  );
};

export default TableSearch;
