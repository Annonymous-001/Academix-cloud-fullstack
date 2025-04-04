'use client';

import { ReportCard } from '@/components/ReportCard';
import html2pdf from 'html2pdf.js';
import { useEffect, useState } from 'react';
import { getStudentReportData } from '@/lib/actions';
import { Exam, Result } from '@prisma/client';

type StudentWithResults = {
  id: string;
  name: string;
  surname: string;
  StudentId: string;
  class: {
    name: string;
  };
  results: (Result & {
    exam: (Exam & {
      title: string;
      lesson: {
        subject: {
          name: string;
        };
      };
    }) | null;
  })[];
};

export default function ReportCardPage({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<StudentWithResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    async function fetchStudentData() {
      try {
        setLoading(true);
        const response = await getStudentReportData(params.id);
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
    const element = document.getElementById('report-card');
    
    // More compact PDF settings for single page
    html2pdf().set({
      margin: [0.2, 0.2], // Smaller margins
      filename: `${student?.name}_${student?.surname}_report_card.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { 
        scale: 1.5, // Lower scale for smaller file
        useCORS: true,
        logging: true, // Help debug
        letterRendering: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Student Report Card</h1>
        <ReportCard student={student} onLogoLoad={() => setLogoLoaded(true)} />
        <div className="text-center mt-6">
          <button
            onClick={handleDownload}
            disabled={!logoLoaded}
            className={`px-6 py-3 ${!logoLoaded ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors shadow-md`}
          >
            {logoLoaded ? 'Download as PDF' : 'Loading images...'}
          </button>
        </div>
      </div>
    </div>
  );
} 