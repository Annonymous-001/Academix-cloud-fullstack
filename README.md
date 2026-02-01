# Academix Cloud - School Management System

A comprehensive, full-stack school management system built with Next.js, TypeScript, and PostgreSQL. This modern web application provides a complete solution for managing students, teachers, classes, attendance, exams, fees, and more.

## 🚀 Features

### Core Functionality
- **Student Management**: Complete student profiles with enrollment, attendance tracking, and academic records
- **Teacher Management**: Teacher profiles, class assignments, and attendance tracking
- **Parent Portal**: Access to student information, attendance, results, and fee payments
- **Admin Dashboard**: Comprehensive administrative controls and system management
- **Accountant Dashboard**: Fee management, payment tracking, and financial reporting

### Academic Features
- **Class & Grade Management**: Organize students into classes and grade levels
- **Subject & Lesson Management**: Schedule lessons with time slots and teacher assignments
- **Exam Management**: Create and manage exams with scheduling
- **Assignment Management**: Create assignments with due dates and track submissions
- **Results & Report Cards**: Generate academic results and printable report cards
- **Attendance Tracking**: Track student and teacher attendance with detailed records

### Financial Features
- **Fee Management**: Create and manage student fees with due dates
- **Payment Processing**: Record payments with multiple payment methods (Cash, Card, UPI, Bank Transfer, etc.)
- **Finance Management**: Track school expenses and financial records
- **Receipt Generation**: Generate payment receipts

### Additional Features
- **Events & Announcements**: Create and manage school events and class announcements
- **Notification System**: Real-time notifications with push notifications support
- **ID Card Generation**: Generate student ID cards
- **Excel/CSV Import**: Bulk import students and teachers via Excel files
- **Chatbot**: AI-powered chatbot for assistance
- **Calendar Integration**: View schedules and events in calendar format
- **Reports & Analytics**: Generate various reports and analytics

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Prisma** - Modern ORM for database management
- **PostgreSQL** - Relational database

### Authentication & Services
- **Clerk** - Authentication and user management
- **Firebase** - Push notifications
- **Cloudinary** - Image upload and management
- **Vercel Analytics** - Analytics tracking

### Additional Libraries
- **ExcelJS** - Excel file processing
- **jsPDF** - PDF generation
- **React Big Calendar** - Calendar component
- **Recharts** - Data visualization
- **Moment.js & date-fns** - Date manipulation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- **PostgreSQL** 15 or higher (or use Docker)
- **Clerk Account** (for authentication)
- **Cloudinary Account** (for image uploads, optional)
- **Firebase Account** (for push notifications, optional)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd full-stack-school-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Database
   DB_URL="postgresql://username:password@localhost:5432/database_name"
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   
   # Cloudinary (optional)
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Firebase (optional, for push notifications)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   
   # Google GenAI (optional, for chatbot)
   GOOGLE_GENAI_API_KEY=your_google_genai_api_key
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # (Optional) Seed the database with sample data
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🐳 Docker Setup

The project includes Docker configuration for easy deployment:

1. **Update docker-compose.yml**
   
   Edit the `DATABASE_URL` in `docker-compose.yml` with your server IP or use `postgres` as hostname for local Docker setup.

2. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Next.js application on port 3000

3. **For production builds**
   ```bash
   docker build -t academix-cloud .
   docker run -p 3000:3000 academix-cloud
   ```

## 📁 Project Structure

```
full-stack-school-main/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Database seeding script
├── public/                     # Static assets
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Dashboard routes (protected)
│   │   │   ├── admin/         # Admin dashboard
│   │   │   ├── teacher/       # Teacher dashboard
│   │   │   ├── student/       # Student dashboard
│   │   │   ├── parent/        # Parent dashboard
│   │   │   ├── accountant/    # Accountant dashboard
│   │   │   └── list/          # List views (students, teachers, etc.)
│   │   ├── api/               # API routes
│   │   ├── [[...sign-in]]/    # Authentication pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript type definitions
├── components.json            # shadcn/ui configuration
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile                # Docker configuration
├── next.config.mjs           # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── package.json              # Dependencies and scripts
```

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes Prisma generation)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed the database with sample data

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **Users**: Admin, Student, Teacher, Parent, Accountant
- **Academic**: Class, Grade, Subject, Lesson, Enrollment
- **Assessment**: Exam, Assignment, Result
- **Attendance**: Attendance, TeacherAttendance
- **Financial**: Fee, Payment, Finance
- **Communication**: Announcement, Event, Notification

See `prisma/schema.prisma` for the complete schema definition.

## 🔐 Authentication

The application uses **Clerk** for authentication. Users are authenticated based on their role:
- Admin
- Teacher
- Student
- Parent
- Accountant

Role-based access control is implemented throughout the application.

## 📝 Key Features Details

### Bulk Import
- Upload Excel files to bulk import students and teachers
- Access via `/upload-students` and `/upload-teachers` routes

### Reports & Documents
- Generate report cards, ID cards, and receipts
- Export data to Excel/CSV formats
- Print-friendly layouts

### Notifications
- Real-time notifications for important events
- Push notifications support via Firebase
- Notification history and management

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- AWS
- Google Cloud Platform
- Azure
- DigitalOcean
- Railway
- Render

Make sure to:
- Set up a PostgreSQL database
- Configure all environment variables
- Run database migrations
- Build the application with `npm run build`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the terms specified in the LICENSE file.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Authentication by [Clerk](https://clerk.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Note**: Make sure to configure all required environment variables before running the application. Some features may require additional service configurations (Clerk, Cloudinary, Firebase).
