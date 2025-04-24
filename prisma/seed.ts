import { PrismaClient, Day, UserSex, AttendanceStatus, FeeStatus, PaymentMethod } from '@prisma/client';
import { faker } from '@faker-js/faker';

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Get current date once to use throughout
  const today = new Date();

  // Clear existing data in reverse order of dependencies
  await prisma.payment.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.accountant.deleteMany({});
  await prisma.admin.deleteMany({});

  console.log('Deleted existing data');

  // Create admin
  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
    },
  });
  console.log(`Created admin: ${admin.username}`);

  // Create accountant
  const accountant = await prisma.accountant.create({
    data: {
      username: 'accountant',
      name: 'Finance',
      surname: 'Manager',
      email: 'finance@school.edu',
      phone: '123-456-7890',
      address: '123 School St, Finance Dept',
    },
  });
  console.log(`Created accountant: ${accountant.username}`);

  // Create grades from 1 to 12
  const grades = [];
  for (let i = 1; i <= 12; i++) {
    const grade = await prisma.grade.create({
      data: {
        level: i,
      },
    });
    grades.push(grade);
    console.log(`Created grade: ${grade.level}`);
  }

  // Create subjects
  const subjectNames = [
    'Mathematics',
    'Science',
    'English',
    'History',
    'Geography',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Physical Education',
    'Art',
    'Music',
    'Foreign Language',
    'Social Studies',
    'Economics',
  ];

  const subjects = [];
  for (const name of subjectNames) {
    const subject = await prisma.subject.create({
      data: {
        name,
      },
    });
    subjects.push(subject);
    console.log(`Created subject: ${subject.name}`);
  }

  // Create 30 teachers
  const teachers = [];
  for (let i = 1; i <= 30; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });
    
    // Generate unique teacher ID
    const teacherId = `${i}480730003`;
    
    // Create teacher in database
    const teacher = await prisma.teacher.create({
      data: {
        username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${faker.number.int(999)}`.replace(/[^a-z0-9_-]/g, ''),
        teacherId: teacherId,
        name: firstName,
        surname: lastName,
        email: email,
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        img: faker.image.avatar(),
        bloodType: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
        sex: faker.helpers.arrayElement(['MALE', 'FEMALE']) as UserSex,
        birthday: faker.date.birthdate({ min: 25, max: 65, mode: 'age' }),
        subjects: {
          connect: faker.helpers.arrayElements(
            subjects.map(subject => ({ id: subject.id })),
            { min: 1, max: 3 }
          ),
        },
      },
      include: {
        subjects: true
      }
    });
    
    teachers.push(teacher);
    console.log(`Created teacher: ${teacher.name} ${teacher.surname} with ID ${teacherId}`);
  }

  // Create classes with sections for each grade
  const classCapacity = 30;
  const classes = [];

  for (const grade of grades) {
    // For grades 1-4, create sections A and B
    if (grade.level <= 4) {
      const sections = ['A', 'B'];
      for (const section of sections) {
        const classTeacher = faker.helpers.arrayElement(teachers);
        const classObj = await prisma.class.create({
          data: {
            name: `${grade.level}${section}`,
            capacity: classCapacity,
            gradeId: grade.id,
            supervisorId: classTeacher.id,
          },
        });
        classes.push(classObj);
        console.log(`Created class: ${classObj.name}`);
      }
    }
    // For grades 5-8, create sections A, B, and C
    else if (grade.level <= 8) {
      const sections = ['A', 'B', 'C'];
      for (const section of sections) {
        const classTeacher = faker.helpers.arrayElement(teachers);
        const classObj = await prisma.class.create({
          data: {
            name: `${grade.level}${section}`,
            capacity: classCapacity,
            gradeId: grade.id,
            supervisorId: classTeacher.id,
          },
        });
        classes.push(classObj);
        console.log(`Created class: ${classObj.name}`);
      }
    }
    // For grades 9-12, create sections A, B, C, and D
    else {
      const sections = ['A', 'B', 'C', 'D'];
      for (const section of sections) {
        const classTeacher = faker.helpers.arrayElement(teachers);
        const classObj = await prisma.class.create({
          data: {
            name: `${grade.level}${section}`,
            capacity: classCapacity,
            gradeId: grade.id,
            supervisorId: classTeacher.id,
          },
        });
        classes.push(classObj);
        console.log(`Created class: ${classObj.name}`);
      }
    }
  }

  // Create 50 parents
  const parents = [];
  for (let i = 1; i <= 50; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });
    
    // Generate parent ID
    const currentYear = new Date().getFullYear();
    const parentId = `P-${currentYear}-${String(i).padStart(4, '0')}`;
    
    // Create parent in database
    const parent = await prisma.parent.create({
      data: {
        username: `parent_${firstName.toLowerCase()}${lastName.toLowerCase()}${faker.number.int(999)}`.replace(/[^a-z0-9_-]/g, ''),
        parentId: parentId,
        name: firstName,
        surname: lastName,
        email: email,
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
    });
    
    parents.push(parent);
    console.log(`Created parent: ${parent.name} ${parent.surname} with ID ${parentId}`);
  }

  // Create 100 students
  const students = [];
  let studentCount = 0;
  
  while (studentCount < 100) {
    const classObj = faker.helpers.arrayElement(classes);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });
    
    // Assign parent (each parent should have 2 students)
    const parentIndex = Math.floor(studentCount / 2);
    const parent = parents[parentIndex % parents.length];
    
    // Generate student ID
    const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const nameInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    const randomDigits = Math.floor(Math.random() * 900) + 100;
    const studentId = `${dateString}${nameInitials}${randomDigits}`;
    
    // Create student in database
    const student = await prisma.student.create({
      data: {
        username: `student_${firstName.toLowerCase()}${lastName.toLowerCase()}${faker.number.int(999)}`.replace(/[^a-z0-9_-]/g, ''),
        StudentId: studentId,
        IEMISCODE: faker.number.int({ min: 100000, max: 999999 }),
        name: firstName,
        surname: lastName,
        motherName: faker.person.firstName() + ' ' + faker.person.lastName(),
        fatherName: faker.person.firstName() + ' ' + faker.person.lastName(),
        email: email,
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        img: faker.image.avatar(),
        bloodType: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
        sex: faker.helpers.arrayElement(['MALE', 'FEMALE']) as UserSex,
        birthday: faker.date.birthdate({ min: 6, max: 18, mode: 'age' }),
        disability: 'NONE',
        classId: classObj.id,
        gradeId: classObj.gradeId,
        parentId: parent.id,
      },
    });
    
    students.push(student);
    console.log(`Created student: ${student.name} ${student.surname} in class ${classObj.name} with ID ${studentId}, Parent: ${parent.name} ${parent.surname}`);
    
    // Create fee for student
    const totalAmount = BigInt(faker.number.int({ min: 5000, max: 10000 }));
    const paidAmount = BigInt(faker.number.int({ min: 0, max: Number(totalAmount) }));
    const balance = totalAmount - paidAmount; // Calculate correct balance
    const dueDate = faker.date.future();
    
    // Determine fee status based on payment amount and due date
    let feeStatus: FeeStatus;
    if (balance <= BigInt(0)) {
      feeStatus = 'PAID';
    } else if (paidAmount === BigInt(0)) {
      feeStatus = dueDate < today ? 'OVERDUE' : 'UNPAID';
    } else {
      // Partially paid
      feeStatus = dueDate < today ? 'OVERDUE' : 'PARTIAL';
    }
    
    const fee = await prisma.fee.create({
      data: {
        studentId: student.id,
        totalAmount,
        paidAmount,
        dueDate,
        status: feeStatus,
        description: 'Tuition fee for academic year',
      },
    });
    
    // Create payment for fee
    if (paidAmount > BigInt(0)) {
      const paymentMethod = faker.helpers.arrayElement(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI']) as PaymentMethod;
      
      // For cash payments, don't use a transaction ID
      const transactionId = paymentMethod === 'CASH' 
        ? null 
        : `TXN${faker.string.alphanumeric(8).toUpperCase()}`;
      
      await prisma.payment.create({
        data: {
          transactionId,
          amount: paidAmount,
          date: faker.date.recent(),
          method: paymentMethod,
          reference: paymentMethod === 'CASH' ? 'Cash Payment' : faker.finance.accountNumber(),
          feeId: fee.id,
        },
      });
    }
    
    studentCount++;
  }

  // Create lessons for each class (limited number)
  const dayOptions: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY','SATURDAY'];
  
  // Create only 50 lessons total
  const totalLessons = 50;
  let lessonCount = 0;
  
  for (const classObj of classes) {
    if (lessonCount >= totalLessons) break;
    
    // Assign 2-3 subjects to each class
    const classSubjects = faker.helpers.arrayElements(subjects, { min: 2, max: 3 });
    
    for (const subject of classSubjects) {
      if (lessonCount >= totalLessons) break;
      
      // Assign a teacher who teaches this subject
      const eligibleTeachers = teachers.filter(teacher => 
        teacher.subjects.some(s => s.id === subject.id)
      );
      
      const teacher = eligibleTeachers.length > 0 
        ? faker.helpers.arrayElement(eligibleTeachers) 
        : faker.helpers.arrayElement(teachers);
      
      // Create 1-2 lessons per subject
      const lessonsPerSubject = faker.number.int({ min: 1, max: 2 });
      
      for (let i = 0; i < lessonsPerSubject; i++) {
        if (lessonCount >= totalLessons) break;
        
        const day = faker.helpers.arrayElement(dayOptions);
        const startHour = faker.number.int({ min: 8, max: 14 });
        const startTime = new Date();
        startTime.setHours(startHour, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(startHour + 1, 0, 0);
        
        const lesson = await prisma.lesson.create({
          data: {
            name: `${subject.name} - ${classObj.name}`,
            day,
            startTime,
            endTime,
            subjectId: subject.id,
            classId: classObj.id,
            teacherId: teacher.id,
          },
        });
        
        console.log(`Created lesson: ${lesson.name} on ${day}`);
        lessonCount++;
        
        // Create attendance records for this lesson (limited to 5-10 students per lesson)
        const classStudents = students.filter(student => student.classId === classObj.id);
        const studentsForAttendance = faker.helpers.arrayElements(
          classStudents,
          faker.number.int({ min: 5, max: 10 })
        );
        
        for (const student of studentsForAttendance) {
          const attendanceDate = faker.date.recent();
          const inTime = new Date(attendanceDate);
          inTime.setHours(startHour, faker.number.int({ min: 0, max: 30 }), 0);
          
          await prisma.attendance.create({
            data: {
              date: attendanceDate,
              studentId: student.id,
              lessonId: lesson.id,
              inTime: inTime,
              status: faker.helpers.arrayElement(['PRESENT', 'ABSENT', 'LATE']) as AttendanceStatus,
            },
          });
        }
        
        // Create assignments for some lessons
        if (faker.datatype.boolean()) {
          const assignment = await prisma.assignment.create({
            data: {
              title: `${subject.name} Assignment`,
              startDate: faker.date.recent(),
              dueDate: faker.date.future(),
              lessonId: lesson.id,
            },
          });
          
          // Create results for the assignment (limited to 5-10 students)
          const studentsForResults = faker.helpers.arrayElements(
            classStudents,
            faker.number.int({ min: 5, max: 10 })
          );
          
          for (const student of studentsForResults) {
            await prisma.result.create({
              data: {
                score: faker.number.int({ min: 0, max: 100 }),
                assignmentId: assignment.id,
                studentId: student.id,
              },
            });
          }
        }
        
        // Create exams for some lessons
        if (faker.datatype.boolean()) {
          const exam = await prisma.exam.create({
            data: {
              title: `${subject.name} Exam`,
              startTime: faker.date.recent(),
              endTime: faker.date.recent(),
              lessonId: lesson.id,
            },
          });
          
          // Create results for the exam (limited to 5-10 students)
          const studentsForExamResults = faker.helpers.arrayElements(
            classStudents,
            faker.number.int({ min: 5, max: 10 })
          );
          
          for (const student of studentsForExamResults) {
            await prisma.result.create({
              data: {
                score: faker.number.int({ min: 0, max: 100 }),
                examId: exam.id,
                studentId: student.id,
              },
            });
          }
        }
      }
    }
  }

  // Create events
  for (let i = 0; i < 10; i++) {
    const startTime = faker.date.future();
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + faker.number.int({ min: 1, max: 3 }));
    
    await prisma.event.create({
      data: {
        title: faker.helpers.arrayElement([
          'Annual Sports Day', 
          'Science Exhibition', 
          'Parent-Teacher Meeting', 
          'Cultural Festival', 
          'Career Counseling Session'
        ]),
        description: faker.lorem.paragraph(),
        startTime,
        endTime,
        classId: faker.helpers.arrayElement([null, ...classes.map(c => c.id)]),
      },
    });
  }

  // Create announcements
  for (let i = 0; i < 15; i++) {
    await prisma.announcement.create({
      data: {
        title: faker.helpers.arrayElement([
          'Important Notice', 
          'Upcoming Event', 
          'Schedule Change', 
          'Holiday Announcement', 
          'Exam Schedule'
        ]),
        description: faker.lorem.paragraph(),
        date: faker.date.recent(),
        classId: faker.helpers.arrayElement([null, ...classes.map(c => c.id)]),
      },
    });
  }

  console.log('Seeding completed successfully!');
  console.log(`Created 30 teachers, 50 parents, and 100 students`);
  console.log('Each parent is associated with 2 students');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });