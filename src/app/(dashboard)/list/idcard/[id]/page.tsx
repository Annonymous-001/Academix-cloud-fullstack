'use client';

import { StudentIDCard } from '@/components/StudentIDCard';
import html2pdf from 'html2pdf.js';
import { useEffect, useState } from 'react';
import { getStudentIdCardData } from '@/lib/actions';

type StudentWithDetails = {
  id: string;
  name: string;
  surname: string;
  StudentId: string;
  bloodType: string;
  birthday: Date;
  phone: string | null;
  img: string | null;
  address: string;
  sex: 'MALE' | 'FEMALE';
  class: {
    name: string;
  };
  grade: {
    level: number;
  };
  parent?: {
    name: string;
    surname: string;
    phone: string;
  } | null;
};

export default function IDCardPage({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<StudentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const currentYear = new Date().getFullYear();
  const schoolYear = `${currentYear}-${currentYear + 1}`;
  const expiryDate = `31/07/${currentYear + 1}`;

  useEffect(() => {
    async function fetchStudentData() {
      try {
        setLoading(true);
        const response = await getStudentIdCardData(params.id);
        if (response.success && response.data) {
          setStudent(response.data);
        } else {
          setError(response.message || 'Failed to load student data');
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();
    
    // Preload the logo image
    const logoImage = new Image();
    logoImage.src = '/logo.png';
    logoImage.onload = () => setLogoLoaded(true);
  }, [params.id]);

  const handleDownload = () => {
    const element = document.getElementById('student-id-card');
    
    html2pdf().set({
      margin: [0.1, 0.1],
      filename: `${student?.name}_${student?.surname}_id_card.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'in', 
        format: [3.375, 5.25], // Standard ID card size
        orientation: 'portrait',
        compress: true
      },
    }).from(element).save();
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold text-red-500">{error}</h2>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold text-red-500">Student data not found</h2>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Student ID Card</h1>
        <StudentIDCard 
          student={student} 
          onLogoLoad={() => setLogoLoaded(true)}
          schoolYear={schoolYear}
          expiryDate={expiryDate}
        />
        <div className="text-center mt-6">
          <button
            onClick={handleDownload}
            disabled={!logoLoaded}
            className={`px-6 py-3 ${!logoLoaded ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors shadow-md`}
          >
            {logoLoaded ? 'Download ID Card' : 'Loading images...'}
          </button>
          <p className="mt-3 text-sm text-gray-500">
            ID card will be downloaded as a PDF document
          </p>
        </div>
      </div>
    </div>
  );
}