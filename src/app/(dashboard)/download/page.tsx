"use client";

import { auth } from "@clerk/nextjs/server";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

const DownloadPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('csv');
  const [selectedOptions, setSelectedOptions] = useState({
    students: true,
    teachers: true,
    classes: true,
    results: true,
    exams: true,
    assignments: true,
  });

  const handleCheckboxChange = (option: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: !prev[option as keyof typeof prev]
    }));
  };

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedOptions }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const data = await response.json();

      switch (exportFormat) {
        case 'pdf':
          exportToPDF(data);
          break;
        case 'excel':
          exportToExcel(data);
          break;
        case 'csv':
          exportToCSV(data);
          break;
      }

      toast.success('Data downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download data');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = (data: any) => {
    const doc = new jsPDF();
    const date = new Date().toISOString().split('T')[0];
    
    // Add title
    doc.setFontSize(16);
    doc.text('School Data Export', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${date}`, 14, 22);

    let yPosition = 30;

    // Add each section
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      if (value && Array.isArray(value) && value.length > 0) {
        // Add section title
        doc.setFontSize(12);
        doc.text(key.charAt(0).toUpperCase() + key.slice(1), 14, yPosition);
        yPosition += 7;

        // Create table
        const tableData = value.map((item: any) => {
          return Object.values(item);
        });

        const headers = Object.keys(value[0]);

        autoTable(doc, {
          head: [headers],
          body: tableData as string[][],
          startY: yPosition,
          margin: { top: 15 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
    });

    doc.save(`school-data-${date}.pdf`);
  };

  const exportToExcel = async (data: any) => {
    const workbook = new ExcelJS.Workbook();
    const date = new Date().toISOString().split('T')[0];

    // Add each section as a separate worksheet
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      if (value && Array.isArray(value) && value.length > 0) {
        const worksheet = workbook.addWorksheet(key);
        const headers = Object.keys(value[0]);
        worksheet.columns = headers.map(header => ({ header, key: header }));
        value.forEach((row: any) => {
          worksheet.addRow(row);
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `school-data-${date}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = (data: any) => {
    const date = new Date().toISOString().split('T')[0];
    const csvContent = Object.entries(data)
      .map(([key, value]: [string, any]) => {
        if (value && Array.isArray(value) && value.length > 0) {
          const headers = Object.keys(value[0]);
          const rows = value.map((item: any) => Object.values(item));
          return [
            `# ${key.toUpperCase()}`,
            headers.join(','),
            ...rows.map((row: any) => row.join(','))
          ].join('\n');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `school-data-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-2 md:p-4 rounded-md flex-1 m-2 md:m-4 mt-0">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Download Data</h1>
        </div>

        {/* Export Format Selection */}
        <div className="flex flex-col gap-2">
          <label className="font-medium">Export Format</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={exportFormat === 'pdf'}
                onChange={() => setExportFormat('pdf')}
                className="w-4 h-4 text-lamaPurple"
              />
              PDF
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="format"
                value="excel"
                checked={exportFormat === 'excel'}
                onChange={() => setExportFormat('excel')}
                className="w-4 h-4 text-lamaPurple"
              />
              Excel
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={() => setExportFormat('csv')}
                className="w-4 h-4 text-lamaPurple"
              />
              CSV
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Students Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="students"
                checked={selectedOptions.students}
                onChange={() => handleCheckboxChange('students')}
                className="w-4 h-4 text-lamaPurple"
              />
              <label htmlFor="students" className="font-medium">Students</label>
            </div>
            <div className="text-sm text-gray-600">
              Includes student information, enrollment details, and parent information
            </div>
          </div>

          {/* Teachers Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="teachers"
                checked={selectedOptions.teachers}
                onChange={() => handleCheckboxChange('teachers')}
                className="w-4 h-4 text-lamaPurple"
              />
              <label htmlFor="teachers" className="font-medium">Teachers</label>
            </div>
            <div className="text-sm text-gray-600">
              Includes teacher profiles, subjects taught, and class assignments
            </div>
          </div>

          {/* Classes Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="classes"
                checked={selectedOptions.classes}
                onChange={() => handleCheckboxChange('classes')}
                className="w-4 h-4 text-lamaPurple"
              />
              <label htmlFor="classes" className="font-medium">Classes</label>
            </div>
            <div className="text-sm text-gray-600">
              Includes class information, schedules, and student rosters
            </div>
          </div>

          {/* Results Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="results"
                checked={selectedOptions.results}
                onChange={() => handleCheckboxChange('results')}
                className="w-4 h-4 text-lamaPurple"
              />
              <label htmlFor="results" className="font-medium">Results</label>
            </div>
            <div className="text-sm text-gray-600">
              Includes exam and assignment results, grades, and performance data
            </div>
          </div>

          {/* Exams Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="exams"
                checked={selectedOptions.exams}
                onChange={() => handleCheckboxChange('exams')}
                className="w-4 h-4 text-lamaPurple"
              />
              <label htmlFor="exams" className="font-medium">Exams</label>
            </div>
            <div className="text-sm text-gray-600">
              Includes exam schedules, questions, and answer keys
            </div>
          </div>

          {/* Assignments Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="assignments"
                checked={selectedOptions.assignments}
                onChange={() => handleCheckboxChange('assignments')}
                className="w-4 h-4 text-lamaPurple"
              />
              <label htmlFor="assignments" className="font-medium">Assignments</label>
            </div>
            <div className="text-sm text-gray-600">
              Includes assignment details, submission dates, and grading criteria
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => setSelectedOptions({
              students: true,
              teachers: true,
              classes: true,
              results: true,
              exams: true,
              assignments: true,
            })}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Select All
          </button>
          <button
            onClick={() => setSelectedOptions({
              students: false,
              teachers: false,
              classes: false,
              results: false,
              exams: false,
              assignments: false,
            })}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Deselect All
          </button>
          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-lamaPurple rounded-md hover:bg-lamaPurpleDark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Downloading...' : 'Download Selected Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage; 