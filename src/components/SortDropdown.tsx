"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

interface SortOption {
  label: string;
  value: string;
  direction: "asc" | "desc";
}

interface SortDropdownProps {
  options: SortOption[];
  defaultSort?: string;
}

const SortDropdown = ({ options, defaultSort }: SortDropdownProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOption | null>(null);

  useEffect(() => {
    const sortParam = searchParams.get("sort");
    const directionParam = searchParams.get("direction");
    
    if (sortParam && directionParam) {
      const option = options.find(
        (opt) => opt.value === sortParam && opt.direction === directionParam
      );
      if (option) {
        setSelectedSort(option);
      }
    } else if (defaultSort) {
      const defaultOption = options.find((opt) => opt.value === defaultSort);
      if (defaultOption) {
        setSelectedSort(defaultOption);
      }
    }
  }, [searchParams, options, defaultSort]);

  const handleSort = (option: SortOption) => {
    setSelectedSort(option);
    setIsOpen(false);

    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());
    
    // Update sort parameters
    params.set("sort", option.value);
    params.set("direction", option.direction);
    
    // Preserve other query parameters
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellow/90 transition-colors"
      >
        <FiChevronDown className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={`${option.value}-${option.direction}`}
                onClick={() => handleSort(option)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  selectedSort?.value === option.value &&
                  selectedSort?.direction === option.direction
                    ? "bg-gray-100"
                    : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;
