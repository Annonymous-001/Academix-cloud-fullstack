'use client';

import { useState, useEffect } from 'react';
import { showNotification } from '@/lib/toast';

interface UploadStats {
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedRows: number;
}

export default function UploadStudentsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    message?: string;
    errors?: string[];
    stats?: UploadStats;
  } | null>(null);
  const [classes, setClasses] = useState<{ id: number; name: string; gradeId: number }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2081);

  // Generate academic years (BS) from 2070 to 2090
  const academicYears = Array.from({ length: 21 }, (_, i) => 2070 + i);

  useEffect(() => {
    fetch('/api/upload-students')
      .then(res => res.json())
      .then(data => {
        // Sort by class name as number if possible
        const sorted = data.slice().sort((a: { name: string }, b: { name: string }) => {
          const aNum = Number(a.name);
          const bNum = Number(b.name);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return a.name.localeCompare(b.name);
        });
        setClasses(sorted);
      });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClassId) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('currentClass', String(selectedClassId));
    formData.append('academicYear', String(selectedYear));

    try {
      console.log('Starting file upload:', file.name, 'for year:', selectedYear);
      const response = await fetch('/api/upload-students', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Upload failed:', result.error);
        throw new Error(result.error || 'Upload failed');
      }

      console.log('Upload completed:', result);
      setUploadResult(result);
      showNotification.success(result.message);
      
      if (result.errors?.length > 0) {
        showNotification.warning(`Some records failed to upload. Check the details below.`);
      }
    } catch (error: any) {
      console.error('Error during upload:', error);
      showNotification.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      console.log('Downloading template...');
      const response = await fetch('/api/generate-template');
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student-upload-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('Template downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading template:', error);
      showNotification.error('Failed to download template');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Upload Students</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              className="block w-full mb-4 border rounded p-2"
              value={selectedClassId ?? ''}
              onChange={e => setSelectedClassId(Number(e.target.value) || null)}
            >
              <option value="">-- Select a class --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Academic Year
            </label>
            <select
              className="block w-full mb-4 border rounded p-2"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {academicYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excel File Template
            </label>
            <div className="text-sm text-gray-600 mb-4">
              <p className="mb-2">Your Excel file should include the following columns:</p>
              
              <div className="mb-4">
                <strong>Required columns:</strong>
                <ul className="list-disc pl-5 mt-2">
                  <li>fullName (will be split into name and surname)</li>
                  <li>gender (MALE/FEMALE)</li>
                  <li>fatherName</li>
                  <li>motherName</li>
                  <li>dob (date of birth - supports BS format YYYY-MM-DD or standard date format)</li>
                  <li>studentId</li>
                </ul>
              </div>

              <div>
                <strong>Note:</strong>
                <ul className="list-disc pl-5 mt-2">
                  <li>Full name will be automatically split - first word as name, rest as surname</li>
                  <li>Username will be generated automatically (name + 3 random digits)</li>
                  <li>Password will be generated as: first 4 letters of name + @ + BS year (e.g., adit@2071)</li>
                  <li>Default values will be set for: disability (NONE), blood group (N/A)</li>
                  <li><b>The selected class will be used for all students in this upload.</b></li>
                  <li><b>The selected academic year ({selectedYear}) will be assigned to all students in this upload.</b></li>
                  <li><b>Date of Birth: You can use Bikram Sambat (BS) format (YYYY-MM-DD) or standard AD date format. BS dates will be automatically converted to AD.</b></li>
                </ul>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Download Template
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading || !selectedClassId}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {!selectedClassId && (
              <p className="text-xs text-red-500 mt-1">Please select a class first</p>
            )}
          </div>

          {isUploading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Uploading and processing...</p>
            </div>
          )}

          {uploadResult && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Upload Results</h2>
              <p className="text-sm text-gray-600 mb-4">{uploadResult.message}</p>
              
              {uploadResult.stats && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Upload Statistics:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Total Rows: {uploadResult.stats.totalRows}</li>
                    <li>Processed Rows: {uploadResult.stats.processedRows}</li>
                    <li>Successful Uploads: {uploadResult.stats.successCount}</li>
                    <li>Failed Uploads: {uploadResult.stats.errorCount}</li>
                    <li>Skipped Rows: {uploadResult.stats.skippedRows} (already enrolled for this year)</li>
                  </ul>
                </div>
              )}
              
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Errors:</h3>
                  <div className="max-h-60 overflow-y-auto">
                    <ul className="text-sm text-red-600 list-disc pl-5">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index} className="mb-1">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 