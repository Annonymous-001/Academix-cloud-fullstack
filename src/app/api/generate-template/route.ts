import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  // Create sample data
  const data = [
    {
      username: 'aditya',
      name: 'aditya',
      surname: 'kumar',
      motherName: 'adityamother',
      fatherName: 'adtiyafather',
      IEMISCODE: '234325',
      email: 'aditya@example.com',
      phone: '9845673284',
      address: '123 Main St',
      bloodType: 'A+',
      sex: 'MALE',
      birthday: '2000-01-01',
      gradeId: '85',
      classId: '179',
      parentId: ''
    }
  ];

  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students');

  // Add headers
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);

  // Add data
  data.forEach(row => {
    worksheet.addRow(Object.values(row));
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 15;
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Return the file
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="student-upload-template.xlsx"'
    }
  });
}