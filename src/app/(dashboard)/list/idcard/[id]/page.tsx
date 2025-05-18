'use client';

import { StudentIDCard } from '@/components/StudentIDCard';
import { useEffect, useState, useRef } from 'react';
import { getStudentIdCardData } from '@/lib/actions';
import html2pdf from 'html2pdf.js';

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

export default function IDCardPage(props: { params: { id: string } }) {
  const { id } = props.params;
  const [student, setStudent] = useState<StudentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const schoolYear = `${currentYear}-${currentYear + 1}`;
  const expiryDate = `31/07/${currentYear + 1}`;

  useEffect(() => {
    async function fetchStudentData() {
      try {
        setLoading(true);
        const response = await getStudentIdCardData(id);
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
  }, [id]);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const element = cardRef.current;
      
      if (!element) {
        throw new Error('ID card element not found');
      }
      
      // Pre-load all images in the card
      const images = Array.from(element.querySelectorAll('img'));
      
      // Wait for all images to load
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
      
      // Add a delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const opt = {
        margin: [0, 0],
        filename: `${student?.name}_${student?.surname}_id_card.pdf`,
        image: { 
          type: 'jpeg', 
          quality: 1
        },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          letterRendering: true,
          imageTimeout: 0,
          backgroundColor: '#ffffff',
          windowWidth: 800,
          windowHeight: 1200
        },
        jsPDF: { 
          unit: 'in', 
          format: [3.375, 5.25],
          orientation: 'portrait',
          compress: true,
          hotfixes: ["px_scaling"]
        }
      };
      
      // Generate and save the PDF
      await html2pdf().set(opt).from(element).save();
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden" ref={cardRef}>
          <StudentIDCard 
            student={student}
            schoolYear={schoolYear}
            expiryDate={expiryDate}
          />
        </div>
        <div className="text-center mt-6">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`px-6 py-3 ${
              isGenerating 
                ? 'bg-gray-400' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-md transition-colors shadow-md`}
          >
            {isGenerating 
              ? 'Generating PDF...' 
              : 'Download ID Card'}
          </button>
          <p className="mt-3 text-sm text-gray-500">
            {isGenerating 
              ? 'Please wait while we prepare your PDF...' 
              : 'ID card will be downloaded as a PDF document'}
          </p>
        </div>
      </div>
    </div>
  );
}