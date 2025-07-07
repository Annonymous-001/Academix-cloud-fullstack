'use client';

import { useState } from 'react';
import TransferModal from './TransferModal';
import { Class } from '@prisma/client';

interface TransferButtonProps {
  classId: number;
  currentClassName: string;
}

const TransferButton = ({ classId, currentClassName }: TransferButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button 
        onClick={openModal}
        className="px-4 py-2 bg-lamaSky text-black rounded-md text-sm hover:bg-lamaSky/90"
      >
        Transfer Students
      </button>
      
      {isModalOpen && (
        <TransferModal 
          classId={classId} 
          onClose={closeModal} 
          currentClassName={currentClassName}
        />
      )}
    </>
  );
};

export default TransferButton; 