import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';
import { createTeacher } from '@/lib/actions';
import { convertBSToAD, isValidBSDate } from '@/lib/utils';

const prisma = new PrismaClient();

// Helper to pick a random subject
async function getRandomSubjectId() {
  const subjects = await prisma.subject.findMany({ select: { id: true } });
  if (!subjects.length) throw new Error('No subjects found in DB');
  const idx = Math.floor(Math.random() * subjects.length);
  return subjects[idx].id;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const gender = formData.get('gender') as string;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!gender) return NextResponse.json({ error: 'No gender selected' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return NextResponse.json({ error: 'Invalid Excel file' }, { status: 400 });

    // Find column indexes
    const headers = worksheet.getRow(1).values as string[];
    const colMap: Record<string, number> = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      const h = String(header).toLowerCase().replace(/\s+/g, '');
      if (h.includes('fullname')) colMap.fullName = idx;
      else if (h.includes('contact')) colMap.contact = idx;
      else if (h.includes('dateofbirth') || h.includes('dob')) colMap.dob = idx;
    });
    if (!colMap.fullName || !colMap.contact || !colMap.dob) {
      return NextResponse.json({ error: 'Missing required columns: Full Name, Contact Number, Date Of Birth' }, { status: 400 });
    }

    const results = {
      success: 0,
      errors: [] as string[],
      processedRows: 0,
      skippedRows: 0
    };

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      try {
        const fullName = row.getCell(colMap.fullName).value?.toString().trim() || '';
        const contact = row.getCell(colMap.contact).value?.toString().trim() || '';
        const dobRaw = row.getCell(colMap.dob).value;
        if (!fullName || !contact || !dobRaw) throw new Error('Missing required values');
        // Split name
        const nameParts = fullName.split(' ');
        if (nameParts.length < 2) throw new Error('Full name must have at least two parts');
        const name = nameParts[0];
        const surname = nameParts.slice(1).join(' ');
        // Parse DOB
        let dob: Date;
        if (typeof dobRaw === 'string' && isValidBSDate(dobRaw)) {
          // Convert BS date to AD
          const adDateString = convertBSToAD(dobRaw);
          dob = new Date(adDateString);
        } else if (dobRaw instanceof Date) {
          dob = dobRaw;
        } else {
          // Try to parse as regular date
          dob = new Date(dobRaw.toString());
        }
        if (isNaN(dob.getTime())) {
          throw new Error('Invalid date format for DOB. Please use BS date format (YYYY-MM-DD) or standard date format');
        }
        // Check for duplicate phone
        const existingTeacher = await prisma.teacher.findUnique({ where: { phone: contact } });
        if (existingTeacher) {
          throw new Error('Teacher with this phone number already exists');
        }
        // Generate username/email/password
        const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 digits
        const randomStr = Math.random().toString(36).substring(2, 6); // 4 random chars
        const username = `${name.toLowerCase()}${randomDigits}`;
        const email = `${username}@gmail.com`;
        // Password: name + random 4 digits + @ + year + random 4 chars (always >10 chars)
        const password = `${name.slice(0, 4).toLowerCase()}${randomDigits}@${dob.getFullYear()}${randomStr}`;
        // Assign random subject
        const subjectId = await getRandomSubjectId();
        // Prepare teacher data
        const teacherData = {
          username,
          name,
          surname,
          phone: contact,
          birthday: dob.toISOString(),
          sex: gender as 'MALE' | 'FEMALE',
          email,
          password,
          bloodType: 'N/A',
          address: 'N/A',
          subjects: [String(subjectId)],
        };
        const result = await createTeacher({ success: false, error: false }, teacherData);
        if (result.success) {
          results.success++;
        } else {
          results.errors.push(`Row ${rowNumber}: ${result.message || 'Failed to create teacher'}`);
        }
        results.processedRows++;
      } catch (error: any) {
        results.errors.push(`Row ${rowNumber}: ${error.message || 'Error processing row'}`);
        results.skippedRows++;
      }
    }
    return NextResponse.json({
      message: `Successfully uploaded ${results.success} teachers${results.errors.length > 0 ? ` with ${results.errors.length} errors` : ''}`,
      errors: results.errors,
      stats: {
        totalRows: worksheet.rowCount - 1,
        processedRows: results.processedRows,
        successCount: results.success,
        errorCount: results.errors.length,
        skippedRows: results.skippedRows
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error processing file: ' + error.message }, { status: 500 });
  }
} 