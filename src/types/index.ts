export type UserRole = 'student' | 'teacher';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  course?: string;
  semester?: string;
  rollNumber?: string;
  department?: string;
  designation?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  teacherEmail?: string;
  enrolledStudents?: string[];
  enrolledCount?: number;
  students?: Array<{
    _id: string;
    name: string;
    email: string;
    rollNumber: string;
    course?: string;
    semester?: string;
  }>;
  stats?: {
    assignmentsCount: number;
    materialsCount: number;
    examsCount: number;
    attendanceSessionsCount: number;
    announcementsCount: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRecordItem {
  studentId: string;
  rollNumber: string;
  studentName: string;
  status: 'Present' | 'Absent' | 'Not Marked';
}

export interface AttendanceSession {
  _id?: string;
  sessionId?: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  date: string;
  teacherId?: string;
  records?: AttendanceRecordItem[];
  totalStudents?: number;
  presentCount?: number;
  absentCount?: number;
  status?: 'Present' | 'Absent';
  recordedAt?: string;
  updatedAt?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface CourseAttendanceSummary {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  teacherId: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'draft' | 'published';
  totalMarks: number;
  attachmentUrl?: string;
  attachmentOriginalName?: string;
  attachmentSize?: number;
  enrolledCount?: number;
  submissionCount?: number;
  reviewedCount?: number;
  mySubmission?: AssignmentSubmission | null;
  submissionStatus?: 'Not Submitted' | 'Submitted' | 'Late' | 'Reviewed';
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentSubmission {
  _id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentRollNumber?: string;
  fileUrl?: string;
  fileOriginalName?: string;
  fileSize?: number;
  submissionNotes?: string;
  submittedAt: string;
  status: 'Submitted' | 'Late' | 'Reviewed';
  marks?: number | null;
  feedback?: string;
  reviewedAt?: string;
}

export interface StudyMaterial {
  _id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  teacherId: string;
  fileUrl: string;
  fileOriginalName: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

export interface Exam {
  _id: string;
  title: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  teacherId: string;
  date: string;
  time: string;
  examType: 'Midterm' | 'Final' | 'Quiz' | 'Practical' | 'Viva';
  description: string;
  roomNumber: string;
  totalMarks: number;
  createdAt?: string;
}

export interface PlannerTask {
  _id: string;
  studentId: string;
  title: string;
  category: 'Study' | 'Assignment' | 'Exam' | 'Personal' | 'Other';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  dueTime?: string;
  completed: boolean;
  createdAt?: string;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  teacherId: string;
  authorName?: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  createdAt: string;
}

export interface ChatMessage {
  _id: string;
  userId: string;
  role: 'user' | 'model';
  message: string;
  createdAt: string;
}

export interface StudentProgress {
  metrics: {
    totalCourses: number;
    attendanceRate: number;
    totalClasses: number;
    attendedClasses: number;
    absentClasses: number;
    totalAssignments: number;
    submittedAssignments: number;
    pendingAssignments: number;
    assignmentCompletionRate: number;
    upcomingExamsCount: number;
    completedTasksCount: number;
    totalTasksCount: number;
    plannerCompletionRate: number;
  };
  recentExams: Exam[];
  pendingAssignmentsList: Array<{ _id: string; title: string; dueDate: string; priority: string }>;
  hasData: boolean;
}

export interface TeacherProgress {
  metrics: {
    totalCourses: number;
    totalStudents: number;
    totalAssignments: number;
    pendingSubmissionsToGrade: number;
    upcomingExamsCount: number;
    totalAnnouncements: number;
  };
  upcomingExams: Exam[];
}
