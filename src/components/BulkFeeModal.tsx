"use client";

import { useState } from "react";
import Image from "next/image";
import BulkFeeForm from "./forms/BulkFeeForm";

interface BulkFeeModalProps {
  classId: number;
  className: string;
}

const BulkFeeModal = ({ classId, className }: BulkFeeModalProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="px-4 py-2 bg-lamaYellow text-black rounded-md text-sm hover:bg-lamaYellow/90 flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Image src="/create.png" alt="" width={16} height={16} />
        Create Bulk Fees
      </button>
      
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <BulkFeeForm 
              classId={classId} 
              className={className} 
              onSuccess={() => setOpen(false)}
            />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkFeeModal; 