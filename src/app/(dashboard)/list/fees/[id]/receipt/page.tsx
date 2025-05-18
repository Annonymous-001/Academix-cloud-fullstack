/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { Fee, Payment, Student } from '@prisma/client';
import { getFeeReceiptData } from '@/lib/actions';

type FeeWithDetails = Fee & {
  student: Student & {
    class: {
      name: string;
    };
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

  useEffect(() => {
    async function fetchFeeData() {
      try {
        setLoading(true);
        const data = await getFeeReceiptData(id);
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

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Fee Receipt</h1>
        <div ref={receiptRef} className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded-full">
                  <img 
                    src="/logo.png" 
                    alt="School Logo" 
                    width={48} 
                    height={48} 
                    className="h-12 w-12" 
                    crossOrigin="anonymous"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Academix School</h1>
                  <p className="text-xs text-blue-100">Excellence in Education</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-100">Receipt #{receiptNumber}</p>
                <p className="text-xs text-blue-100">{format(new Date(), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-3">Student Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Name:</span> {fee.student.name} {fee.student.surname}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Class:</span> {fee.student.class.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Student ID:</span> {fee.student.StudentId}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {fee.student.email || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phone:</span> {fee.student.phone || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Info */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-3">Fee Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Fee ID:</span> {fee.id}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Description:</span> {fee.description || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Due Date:</span> {format(new Date(fee.dueDate), 'dd/MM/yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total Amount:</span> {Number(fee.totalAmount).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total Paid:</span> {totalPaid.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Remaining:</span> {remainingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3">Payment History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fee.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {format(new Date(payment.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {payment.transactionId || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {payment.method}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {payment.reference || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">
                        {Number(payment.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p>Generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                <p className="mt-1">Academix Cloud School Management System</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Total Amount: {Number(fee.totalAmount).toLocaleString()}</p>
                <p className="text-sm font-medium text-gray-900">Total Paid: {totalPaid.toLocaleString()}</p>
                <p className="text-sm font-medium text-gray-900">Remaining: {remainingAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
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