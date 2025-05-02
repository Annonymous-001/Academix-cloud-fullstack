import { NextRequest, NextResponse } from 'next/server';
import { read, utils } from 'xlsx';
import { clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { DisabilityType } from '@prisma/client';

// Define the type for our Excel row data
interface StudentRow {
  username: string;
  name: string;
  surname: string;
  motherName: string;
  fatherName: string;
  IEMISCODE: string | number;
  email?: string;
  phone?: string;
  address: string;
  bloodType: string;
  sex: 'MALE' | 'FEMALE';
  birthday: string;
  gradeId: string | number;
  classId: string | number;
  parentId?: string;
  disability?: DisabilityType;
  password?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read the Excel file
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = utils.sheet_to_json<StudentRow>(worksheet);

    // Log the first row for debugging
    console.log('First row of data:', data[0]);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each row
    for (const row of data) {
      try {
        // Log the current row being processed
        console.log('Processing row:', row);

        // Validate required fields
        const requiredFields = ['username', 'name', 'surname', 'motherName', 'fatherName', 'IEMISCODE', 'address', 'bloodType', 'sex', 'birthday', 'gradeId', 'classId'] as const;
        const missingFields = requiredFields.filter(field => !row[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate data types and formats
        if (isNaN(parseInt(String(row.IEMISCODE)))) {
          throw new Error('IEMISCODE must be a number');
        }

        if (isNaN(parseInt(String(row.gradeId)))) {
          throw new Error('gradeId must be a number');
        }

        if (isNaN(parseInt(String(row.classId)))) {
          throw new Error('classId must be a number');
        }

        // Validate sex enum
        if (!['MALE', 'FEMALE'].includes(row.sex)) {
          throw new Error('sex must be either MALE or FEMALE');
        }

        // Validate disability enum if provided
        if (row.disability && !Object.values(DisabilityType).includes(row.disability as DisabilityType)) {
          throw new Error(`Invalid disability type. Must be one of: ${Object.values(DisabilityType).join(', ')}`);
        }

        // Validate date format
        const birthday = new Date(row.birthday);
        if (isNaN(birthday.getTime())) {
          throw new Error('Invalid birthday date format. Use YYYY-MM-DD');
        }

        // Check if username already exists
        const existingUser = await prisma.student.findUnique({
          where: { username: row.username }
        });

        if (existingUser) {
          throw new Error(`Username ${row.username} already exists`);
        }

        // Check if grade exists
        const gradeExists = await prisma.grade.findUnique({
          where: { id: parseInt(String(row.gradeId)) }
        });

        if (!gradeExists) {
          throw new Error(`Grade with ID ${row.gradeId} does not exist`);
        }

        // Check if class exists
        const classExists = await prisma.class.findUnique({
          where: { id: parseInt(String(row.classId)) }
        });

        if (!classExists) {
          throw new Error(`Class with ID ${row.classId} does not exist`);
        }

        // Generate unique student ID
        const today = new Date();
        const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const nameInitials = `${row.name.charAt(0)}${row.surname.charAt(0)}`.toUpperCase();
        const randomDigits = Math.floor(Math.random() * 900) + 100;
        const studentId = `${dateString}${nameInitials}${randomDigits}`;

        // Create Clerk user using the function
        const clerk = clerkClient();
        const user = await clerk.users.createUser({
          emailAddress: row.email ? [row.email] : [],
          username: row.username,
          password: row.password || Math.random().toString(36).slice(-8),
          firstName: row.name,
          lastName: row.surname,
          publicMetadata: { role: "student" }
        });

        // Create student in database
        await prisma.student.create({
          data: {
            id: user.id,
            username: row.username,
            name: row.name,
            surname: row.surname,
            motherName: row.motherName,
            fatherName: row.fatherName,
            IEMISCODE: parseInt(String(row.IEMISCODE)),
            disability: row.disability || DisabilityType.NONE,
            email: row.email || null,
            phone: row.phone || null,
            address: row.address,
            bloodType: row.bloodType,
            sex: row.sex,
            birthday: birthday,
            gradeId: parseInt(String(row.gradeId)),
            classId: parseInt(String(row.classId)),
            StudentId: studentId,
            parentId: row.parentId || null,
          }
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        const rowNumber = results.success + results.failed;
        const errorMessage = error.message || 'Unknown error occurred';
        console.error(`Error processing row ${rowNumber}:`, error);
        results.errors.push(`Row ${rowNumber}: ${errorMessage}`);
        
        // If Clerk user was created but database insert failed, delete the Clerk user
        if (error.message.includes('database') && error.userId) {
          try {
            const clerk = clerkClient();
            await clerk.users.deleteUser(error.userId);
          } catch (deleteError) {
            console.error('Failed to delete Clerk user after database error:', deleteError);
          }
        }
      }
    }

    return NextResponse.json({
      message: `Processed ${results.success + results.failed} students. Success: ${results.success}, Failed: ${results.failed}`,
      errors: results.errors
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process upload' },
      { status: 500 }
    );
  }
} 