import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.payment.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.finance.deleteMany();
  await prisma.result.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.teacherAttendance.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.event.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.accountant.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.admin.deleteMany();

  console.log('��️  Cleared existing data');

  // Create Admin
  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
    },
  });
  console.log('✅ Created admin');

  // Create Grades (1-12)
  const grades = [];
  for (let i = 1; i <= 12; i++) {
    const grade = await prisma.grade.create({
      data: {
        level: i,
      },
    });
    grades.push(grade);
  }
  console.log('✅ Created grades 1-12');

  // Create Subjects
  const subjects = [
    'Mathematics', 'Science', 'English', 'Nepali', 'Social Studies',
    'Computer Science', 'Physical Education', 'Art', 'Music', 'Health'
  ];

  const createdSubjects = [];
  for (const subjectName of subjects) {
    const subject = await prisma.subject.create({
      data: {
        name: subjectName,
      },
    });
    createdSubjects.push(subject);
  }
  console.log('✅ Created subjects');

  // Create Classes for each grade
  const classes = [];
  for (let i = 0; i < grades.length; i++) {
    const grade = grades[i];
    const classNames = ['A', 'B', 'C'];
    
    for (const className of classNames) {
      const classData = await prisma.class.create({
        data: {
          name: `Grade ${grade.level} ${className}`,
          capacity: faker.number.int({ min: 25, max: 40 }),
          gradeId: grade.id,
        },
      });
      classes.push(classData);
    }
  }
  console.log('✅ Created classes');

  // Create Teachers
  const teachers = [];
  for (let i = 0; i < 20; i++) {
    const teacher = await prisma.teacher.create({
      data: {
        username: faker.internet.username(),
        name: faker.person.firstName(),
        surname: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        img: faker.image.avatar(),
        bloodType: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
        sex: faker.helpers.arrayElement(['MALE', 'FEMALE']),
        birthday: faker.date.between({ from: '1980-01-01', to: '1995-12-31' }),
        teacherId: faker.string.alphanumeric(8).toUpperCase(),
      },
    });
    teachers.push(teacher);
  }
  console.log('✅ Created teachers');

  // Assign teachers to classes as supervisors
  for (let i = 0; i < classes.length; i++) {
    if (i < teachers.length) {
      await prisma.class.update({
        where: { id: classes[i].id },
        data: { supervisorId: teachers[i].id },
      });
    }
  }

  // Assign teachers to subjects
  for (const teacher of teachers) {
    const randomSubjects = faker.helpers.arrayElements(createdSubjects, { min: 1, max: 3 });
    for (const subject of randomSubjects) {
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          subjects: {
            connect: { id: subject.id },
          },
        },
      });
    }
  }

  // Create Parents
  const parents = [];
  for (let i = 0; i < 50; i++) {
    const parent = await prisma.parent.create({
      data: {
        username: faker.internet.username(),
        name: faker.person.firstName(),
        surname: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        parentId: faker.string.alphanumeric(8).toUpperCase(),
      },
    });
    parents.push(parent);
  }
  console.log('✅ Created parents');

  // Create Students
  const students = [];
  for (let i = 0; i < 150; i++) {
    const student = await prisma.student.create({
      data: {
        username: faker.internet.username(),
        name: faker.person.firstName(),
        surname: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        img: faker.image.avatar(),
        bloodType: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
        sex: faker.helpers.arrayElement(['MALE', 'FEMALE']),
        birthday: faker.date.between({ from: '2005-01-01', to: '2015-12-31' }),
        StudentId: faker.string.alphanumeric(8).toUpperCase(),
        IEMISCODE: faker.number.int({ min: 100000, max: 999999 }),
        disability: faker.helpers.arrayElement(['NONE', 'VISION', 'HEARING', 'MOBILITY', 'COGNITIVE', 'SPEECH', 'MENTAL_HEALTH', 'OTHER']),
        fatherName: faker.person.fullName({ sex: 'male' }),
        motherName: faker.person.fullName({ sex: 'female' }),
        parentId: faker.helpers.arrayElement(parents).id,
      },
    });
    students.push(student);
  }
  console.log('✅ Created students');

  // Create Enrollments
  for (const student of students) {
    const randomClass = faker.helpers.arrayElement(classes);
    const grade = grades.find(g => g.id === randomClass.gradeId);
    
    await prisma.enrollment.create({
      data: {
        studentId: student.StudentId,
        classId: randomClass.id,
        gradeId: grade!.id,
        year: faker.number.int({ min: 2020, max: 2024 }),
      },
    });
  }
  console.log('✅ Created enrollments');

  // Create Lessons
  const lessons = [];
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
  const timeSlots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
  ];

  for (const classData of classes) {
    for (let i = 0; i < 6; i++) {
      const timeSlot = timeSlots[i];
      const lesson = await prisma.lesson.create({
        data: {
          name: faker.helpers.arrayElement(createdSubjects).name,
          day: faker.helpers.arrayElement(days),
          startTime: new Date(`2024-01-01T${timeSlot.start}:00`),
          endTime: new Date(`2024-01-01T${timeSlot.end}:00`),
          subjectId: faker.helpers.arrayElement(createdSubjects).id,
          classId: classData.id,
          teacherId: faker.helpers.arrayElement(teachers).id,
        },
      });
      lessons.push(lesson);
    }
  }
  console.log('✅ Created lessons');

  // Create Exams
  for (let i = 0; i < 30; i++) {
    await prisma.exam.create({
      data: {
        title: faker.helpers.arrayElement(['Mid Term', 'Final Term', 'Unit Test', 'Quiz']) + ` ${i + 1}`,
        startTime: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
        endTime: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
        subjectId: faker.helpers.arrayElement(createdSubjects).id,
        classId: faker.helpers.arrayElement(classes).id,
      },
    });
  }
  console.log('✅ Created exams');

  // Create Assignments
  for (let i = 0; i < 50; i++) {
    await prisma.assignment.create({
      data: {
        title: faker.lorem.sentence(),
        startDate: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
        dueDate: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
        lessonId: faker.helpers.arrayElement(lessons).id,
      },
    });
  }
  console.log('✅ Created assignments');

  // Create Results
  for (let i = 0; i < 200; i++) {
    await prisma.result.create({
      data: {
        score: faker.number.int({ min: 0, max: 100 }),
        examId: faker.helpers.arrayElement(await prisma.exam.findMany()).id,
        studentId: faker.helpers.arrayElement(students).id,
      },
    });
  }
  console.log('✅ Created results');

  // Create Attendance records
  for (let i = 0; i < 500; i++) {
    await prisma.attendance.create({
      data: {
        date: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
        studentId: faker.helpers.arrayElement(students).id,
        lessonId: faker.helpers.arrayElement(lessons).id,
        inTime: faker.date.between({ from: '2024-01-01T08:00:00', to: '2024-01-01T09:00:00' }),
        outTime: faker.date.between({ from: '2024-01-01T15:00:00', to: '2024-01-01T16:00:00' }),
        status: faker.helpers.arrayElement(['PRESENT', 'ABSENT', 'LATE']),
        classId: faker.helpers.arrayElement(classes).id,
      },
    });
  }
  console.log('✅ Created attendance records');

  // Create Teacher Attendance
  for (let i = 0; i < 200; i++) {
    await prisma.teacherAttendance.create({
      data: {
        date: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
        teacherId: faker.helpers.arrayElement(teachers).id,
        inTime: faker.date.between({ from: '2024-01-01T07:00:00', to: '2024-01-01T08:00:00' }).toTimeString().slice(0, 5),
        outTime: faker.date.between({ from: '2024-01-01T16:00:00', to: '2024-01-01T17:00:00' }).toTimeString().slice(0, 5),
        status: faker.helpers.arrayElement(['PRESENT', 'ABSENT', 'LATE']),
      },
    });
  }
  console.log('✅ Created teacher attendance records');

  // Create Events
  for (let i = 0; i < 20; i++) {
    await prisma.event.create({
      data: {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        startTime: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
        endTime: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
        classId: faker.helpers.arrayElement(classes).id,
      },
    });
  }
  console.log('✅ Created events');

  // Create Announcements
  for (let i = 0; i < 30; i++) {
    await prisma.announcement.create({
      data: {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        date: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
        classId: faker.helpers.arrayElement(classes).id,
      },
    });
  }
  console.log('✅ Created announcements');

  // Create Accountants
  for (let i = 0; i < 5; i++) {
    await prisma.accountant.create({
      data: {
        username: faker.internet.username(),
        name: faker.person.firstName(),
        surname: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
    });
  }
  console.log('✅ Created accountants');

  // Create Fees
  const fees = [];
  for (let i = 0; i < 100; i++) {
    const fee = await prisma.fee.create({
      data: {
        studentId: faker.helpers.arrayElement(students).id,
        totalAmount: BigInt(faker.number.int({ min: 50000, max: 200000 })),
        paidAmount: BigInt(faker.number.int({ min: 0, max: 200000 })),
        dueDate: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
        status: faker.helpers.arrayElement(['PAID', 'UNPAID', 'PARTIAL', 'OVERDUE', 'WAIVED']),
        description: faker.lorem.sentence(),
      },
    });
    fees.push(fee);
  }
  console.log('✅ Created fees');

  // Create Payments
  for (let i = 0; i < 80; i++) {
    await prisma.payment.create({
      data: {
        transactionId: faker.string.alphanumeric(12).toUpperCase(),
        amount: BigInt(faker.number.int({ min: 10000, max: 100000 })),
        date: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
        method: faker.helpers.arrayElement(['CASH', 'CARD', 'CHECK', 'BANK_TRANSFER', 'OTHER', 'UPI']),
        reference: faker.lorem.word(),
        feeId: faker.helpers.arrayElement(fees).id,
      },
    });
  }
  console.log('✅ Created payments');

  // Create Finance records
  for (let i = 0; i < 50; i++) {
    await prisma.finance.create({
      data: {
        expenseType: faker.helpers.arrayElement(['BUS', 'SALARY', 'MAINTENANCE', 'SUPPLIES', 'UTILITIES', 'OTHER']),
        amount: BigInt(faker.number.int({ min: 10000, max: 500000 })),
        description: faker.lorem.sentence(),
        updatedAt: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
      },
    });
  }
  console.log('✅ Created finance records');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
