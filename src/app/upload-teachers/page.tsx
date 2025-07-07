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

export default function UploadTeachersPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    message?: string;
    errors?: string[];
    stats?: UploadStats;
  } | null>(null);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gender) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('gender', gender);

    try {
      const response = await fetch('/api/upload-teachers', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      setUploadResult(result);
      showNotification.success(result.message);
      if (result.errors?.length > 0) {
        showNotification.warning('Some records failed to upload. Check the details below.');
      }
    } catch (error: any) {
      showNotification.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Download a simple template for teachers
    const url = '/api/generate-template?type=teacher';
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher-upload-template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Upload Teachers</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Gender (applies to all teachers in this upload)
            </label>
            <select
              className="block w-full mb-4 border rounded p-2"
              value={gender}
              onChange={e => setGender(e.target.value as 'MALE' | 'FEMALE' | '')}
            >
              <option value="">-- Select gender --</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
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
                  <li>Full Name</li>
                  <li>Contact Number</li>
                  <li>Date Of Birth (supports BS format YYYY-MM-DD or standard date format)</li>
                </ul>
              </div>
              <div>
                <strong>Note:</strong>
                <ul className="list-disc pl-5 mt-2">
                  <li>Other columns will be ignored.</li>
                  <li>Each teacher will be assigned a random subject from the database.</li>
                  <li>Gender will be set to the selected value above for all teachers.</li>
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
              disabled={isUploading || !gender}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
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
                    <li>Skipped Rows: {uploadResult.stats.skippedRows}</li>
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