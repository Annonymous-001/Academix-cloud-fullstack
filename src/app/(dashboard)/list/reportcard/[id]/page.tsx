'use client';

import { ReportCard } from '@/components/ReportCard';
import html2pdf from 'html2pdf.js';
import { useEffect, useState, useRef } from 'react';
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

export default function ReportCardPage(props: { params: { id: string } }) {
  const { id } = props.params;
  const [student, setStudent] = useState<StudentWithResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchStudentData() {
      try {
        setLoading(true);
        const response = await getStudentReportData(id);
        if (response.success && response.data) {
          const { id, name, surname, StudentId, class: studentClass, results } = response.data as any;
          const studentData: StudentWithResults = {
            id,
            name,
            surname,
            StudentId,
            class: studentClass && studentClass.name ? studentClass : { name: '' },
            results: Array.isArray(results)
              ? results.map((r: any) => ({
                  ...r,
                  exam: r.exam
                    ? {
                        ...r.exam,
                        title: r.exam.title,
                        lesson: {
                          subject: {
                            name: r.exam.lesson.subject.name,
                          },
                        },
                      }
                    : null,
                }))
              : [],
          };
          setStudent(studentData);
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
        throw new Error('Report card element not found');
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
        filename: `${student?.name}_${student?.surname}_report_card.pdf`,
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
          windowWidth: 1200,
          windowHeight: 1600
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter',
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Student Report Card</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden" ref={cardRef}>
          <ReportCard student={student} />
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
              : 'Download Report Card'}
          </button>
          <p className="mt-3 text-sm text-gray-500">
            {isGenerating 
              ? 'Please wait while we prepare your PDF...' 
              : 'Report card will be downloaded as a PDF document'}
          </p>
        </div>
      </div>
    </div>
  );
} 