import { NextResponse } from 'next/server';
import { utils, write } from 'xlsx';

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

  // Create worksheet
  const worksheet = utils.json_to_sheet(data);

  // Create workbook
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Students');

  // Generate buffer
  const buffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Return the file
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="student-upload-template.xlsx"'
    }
  });
}