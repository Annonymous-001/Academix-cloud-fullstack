"use client";

import { ITEM_PER_PAGE } from "@/lib/settings";
import { useRouter } from "next/navigation";

const Pagination = ({ page, count }: { page: number; count: number }) => {
  const router = useRouter();

  const hasPrev = ITEM_PER_PAGE * (page - 1) > 0;
  const hasNext = ITEM_PER_PAGE * (page - 1) + ITEM_PER_PAGE < count;

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${window.location.pathname}?${params}`);
  };
  return (
    <div className="p-4 flex items-center justify-between text-gray-500">
      <button
        disabled={!hasPrev}
        className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => {
          changePage(page - 1);
        }}
      >
        Prev
      </button>
      <div className="flex items-center gap-2 text-sm">
        {(() => {
          const totalPages = Math.ceil(count / ITEM_PER_PAGE);
          const pageNumbers = [];
          
          // Always show first page
          if (totalPages > 0) {
            pageNumbers.push(1);
          }
          
          // Calculate range of pages to show around current page
          let startPage = Math.max(2, page - 1);
          let endPage = Math.min(totalPages - 1, page + 1);
          
          // Adjust if current page is near the beginning
          if (page <= 3) {
            endPage = Math.min(5, totalPages - 1);
          }
          
          // Adjust if current page is near the end
          if (page >= totalPages - 2) {
            startPage = Math.max(2, totalPages - 4);
          }
          
          // Add ellipsis after first page if needed
          if (startPage > 2) {
            pageNumbers.push("ellipsis1");
          }
          
          // Add pages in the middle
          for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
          }
          
          // Add ellipsis before last page if needed
          if (endPage < totalPages - 1) {
            pageNumbers.push("ellipsis2");
          }
          
          // Always show last page if there is more than one page
          if (totalPages > 1) {
            pageNumbers.push(totalPages);
          }
          
          return pageNumbers.map((pageItem, index) => {
            if (pageItem === "ellipsis1" || pageItem === "ellipsis2") {
              return (
                <span key={`ellipsis-${index}`} className="px-2">
                  ...
                </span>
              );
            }
            
            const pageNumber = pageItem as number;
            return (
              <button
                key={pageNumber}
                className={`px-2 rounded-sm ${
                  page === pageNumber ? "bg-lamaSky" : ""
                }`}
                onClick={() => {
                  changePage(pageNumber);
                }}
              >
                {pageNumber}
              </button>
            );
          });
        })()}
      </div>
      <button
        className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!hasNext}
        onClick={() => {
          changePage(page + 1);
        }}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
