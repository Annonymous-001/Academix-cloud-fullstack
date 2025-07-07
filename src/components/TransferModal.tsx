'use client';

import { useState, useEffect } from 'react';
import { getAllClassesExceptCurrent, transferStudentsToNextClass } from '@/lib/actions';
import { toast } from 'react-hot-toast';

interface TransferModalProps {
  classId: number;
  onClose: () => void;
  currentClassName: string;
}

interface NextClassData {
  id: number;
  name: string;
  capacity: number;
  _count: { students: number };
}

const TransferModal = ({ classId, onClose, currentClassName }: TransferModalProps) => {
  const [nextClasses, setNextClasses] = useState<NextClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getAllClassesExceptCurrent(classId);
      if (result.success) {
        setNextClasses(result.data || []);
      } else {
        setError(result.message || 'Failed to load classes');
      }
      setIsLoading(false);
    };
    fetchClasses();
  }, [classId]);

  const handleTransfer = async () => {
    if (selectedClassId === null) {
      toast.error('Please select a class to transfer students to.');
      return;
    }

    setIsLoading(true);
    const result = await transferStudentsToNextClass(
      { classId, nextClassId: selectedClassId }
    );

    if (result.success) {
      toast.success('Students transferred successfully');
      onClose();
      window.location.reload();
    } else {
      toast.error(result.message || 'Failed to transfer students');
      setError(result.message || 'Failed to transfer students');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold mb-4">Transfer Students from {currentClassName}</h3>
        
        {isLoading && <p>Loading classes...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!isLoading && !error && nextClasses.length === 0 && (
          <p>No available classes found.</p>
        )}

        {!isLoading && !error && nextClasses.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Destination Class:</label>
            <select
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              onChange={(e) => setSelectedClassId(parseInt(e.target.value))}
              defaultValue=""
            >
              <option value="" disabled>-- Select a class --</option>
              {nextClasses.map((c) => {
                const spots = c.capacity - c._count.students;
                return (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={spots <= 0}
                  >
                    {c.name} ({spots} spots available{spots <= 0 ? " - FULL" : ""})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {!isLoading && !error && nextClasses.every(c => c.capacity - c._count.students <= 0) && (
          <p className="text-red-500 text-sm mt-2">
            All destination classes are full or over capacity. Please increase class capacity or remove students.
          </p>
        )}

        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md text-sm hover:bg-gray-400"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
            disabled={selectedClassId === null || isLoading}
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal; 