/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Fee, Payment, Student } from '@prisma/client';
import { getFeeReceiptData } from '@/lib/actions';
import { ADToBS } from 'bikram-sambat-js';

type FeeWithDetails = Fee & {
  student: Student & {
    enrollments: {
      class: {
        name: string;
      };
      leftAt: Date | null;
    }[];
  };
  payments: Payment[];
};

export default function ReceiptPage(props: { params: { id: string } }) {
  const { id } = props.params;
  const [fee, setFee] = useState<FeeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const nepaliMonths = [
    'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
    'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
  ];

  const formatBSDate = (date: Date) => {
    // Adjust for timezone by creating a new date with local timezone
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const bsDate = ADToBS(localDate.toISOString().split('T')[0]);
    const [year, month, day] = bsDate.split('-').map(Number);
    return `${nepaliMonths[month - 1]} ${day}, ${year}`;
  };

  useEffect(() => {
    async function fetchFeeData() {
      try {
        setLoading(true);
        const data = await getFeeReceiptData(id);
        // No need for type assertion, just set the data
        setFee(data);
      } catch (error) {
        console.error('Error fetching fee data:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchFeeData();
  }, [id]);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const element = receiptRef.current;
      
      if (!element) {
        throw new Error('Receipt element not found');
      }
      
      // Pre-load all images in the receipt
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
        filename: `fee_receipt_${fee?.id}.pdf`,
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
          windowWidth: 794,
          windowHeight: 1123
        },
        jsPDF: { 
          unit: 'px', 
          format: [794, 1123], // A4 in px at 96dpi
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

  if (!fee) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold text-red-500">Fee data not found</h2>
      </div>
    );
  }

  const totalPaid = fee.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remainingAmount = Number(fee.totalAmount) - totalPaid;
  const receiptNumber = `RCP-${fee.id}-${Date.now().toString().slice(-6)}`;

  const currentEnrollment = fee?.student.enrollments.find(e => e.leftAt === null);
  const studentClass = currentEnrollment?.class;

  // Move the receipt content to a separate component for reuse
  const ReceiptContent = () => (
    <div
      className="bg-white rounded-lg shadow overflow-hidden border m-2"
      style={{
        width: 'calc(100% - 16px)',
        minWidth: 0,
        fontSize: '11px', // Smaller font for compactness
        padding: '10px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div className="bg-[#9C27B0] text-white p-2 rounded-t">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src="/school_logo.png"
              alt="School Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              crossOrigin="anonymous"
            />
            <div>
              <h1 className="text-base font-bold tracking-tight leading-tight">Shree Narayani Gandaki </h1>
              <p className="text-[10px] text-purple-100 leading-tight">Excellence in Education</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-purple-100">Receipt #{receiptNumber}</p>
            <p className="text-[10px] text-purple-100">{formatBSDate(new Date())}</p>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="p-2 border-b">
        <h2 className="text-sm font-semibold mb-1">Student Information</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Name:</span> {fee.student.name} {fee.student.surname}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Class:</span> {studentClass?.name || 'N/A'}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Student ID:</span> {fee.student.StudentId}
            </p>
          </div>
          <div>
          <p className="text-xs text-gray-600">
              <span className="font-medium">Mother&apos;s Name:</span> {fee.student.motherName || 'N/A'}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Father&apos;s Name:</span> {fee.student.fatherName || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Fee Info */}
      <div className="p-2 border-b">
        <h2 className="text-sm font-semibold mb-1">Fee Information</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Fee ID:</span> {fee.id}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Description:</span> {fee.description || 'N/A'}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Due Date:</span> {formatBSDate(new Date(fee.dueDate))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Total Amount:</span> {Number(fee.totalAmount).toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Total Paid:</span> {totalPaid.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Remaining:</span> {remainingAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="p-2">
        <h2 className="text-sm font-semibold mb-1">Payment History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Date</th>
                <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Txn ID</th>
                <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Method</th>
                <th className="px-1 py-1 text-left font-medium text-gray-500 uppercase">Ref</th>
                <th className="px-1 py-1 text-right font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fee.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-1 py-1">{formatBSDate(new Date(payment.date))}</td>
                  <td className="px-1 py-1">{payment.transactionId || 'N/A'}</td>
                  <td className="px-1 py-1">{payment.method}</td>
                  <td className="px-1 py-1">{payment.reference || 'N/A'}</td>
                  <td className="px-1 py-1 text-right">{Number(payment.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 bg-gray-50 border-t">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-600">
            <p>Generated on {formatBSDate(new Date())}</p>
            <p className="mt-0.5">Academix Cloud School Management System</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-900">Total: {Number(fee.totalAmount).toLocaleString()}</p>
            <p className="text-xs font-medium text-gray-900">Paid: {totalPaid.toLocaleString()}</p>
            <p className="text-xs font-medium text-gray-900">Remain: {remainingAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Fee Receipt</h1>
        {/* A4 size: 210mm x 297mm, convert to px at 96dpi: 794 x 1123 */}
        <div
          ref={receiptRef}
          className="bg-white flex flex-col items-center justify-center"
          style={{
            width: '794px',
            height: '1123px',
            margin: '0 auto',
            padding: '12px',
            background: 'white',
            boxSizing: 'border-box',
            position: 'relative',
            gap: '8px',
          }}
        >
          {/* Two identical receipts, one below the other */}
          <ReceiptContent />
          <ReceiptContent />
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
              : 'Download Receipt'}
          </button>
          <p className="mt-3 text-sm text-gray-500">
            {isGenerating 
              ? 'Please wait while we prepare your PDF...' 
              : 'Receipt will be downloaded as a PDF document'}
          </p>
        </div>
      </div>
    </div>
  );
} 