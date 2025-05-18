export const ITEM_PER_PAGE = 10

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  // Admin routes
  "/admin(.*)": ["admin"],
  
  // User type routes
  "/student(.*)": ["student"],
  "/teacher(.*)": ["teacher"],
  "/parent(.*)": ["parent"],

  // List routes
  "/list/teachers": ["admin", "teacher"],
  "/list/teachers/:id": ["admin", "teacher"],
  "/list/students": ["admin", "teacher"],
  "/list/students(.*)": ["admin", "teacher"],
  "/list/students/:id": ["admin", "teacher"],
  "/list/parents": ["admin", "teacher"],
  "/list/subjects": ["admin"],
  "/list/classes": ["admin", "teacher"],
  "/list/lessons": ["admin", "teacher"],
  "/list/lessons/:id": ["admin", "teacher"],
  
  // Academic routes
  "/list/exams": ["admin", "teacher", "student", "parent"],
  "/list/assignments": ["admin", "teacher", "student", "parent"],
  "/list/results": ["admin", "teacher", "student", "parent"],
  "/list/attendence": ["admin", "teacher", "student", "parent"],
  "/list/events": ["admin", "teacher", "student", "parent"],
  "/list/announcements": ["admin", "teacher", "student", "parent"],
  
  // Financial routes
  "/list/finance": ["admin", "accountant"],
  "/list/fees": ["admin", "accountant"],
  "/list/payments": ["admin", "accountant"],
  
  // Administrative routes
  "/list/teacherattendance": ["admin", "teacher"],
  "/list/idcard": ["admin", "teacher", "student"],
  "/list/idcard/:id": ["admin", "teacher", "student"],
  "/list/reportcard": ["admin", "teacher", "student", "parent"],
  "/list/reportcard/:id": ["admin", "teacher", "student", "parent"],
  "/upload-students": ["admin"],
  "/generate-template": ["admin"],


};