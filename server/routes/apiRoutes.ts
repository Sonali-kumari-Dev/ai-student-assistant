import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

import * as authCtrl from '../controllers/authController.js';
import * as userCtrl from '../controllers/userController.js';
import * as subjectCtrl from '../controllers/subjectController.js';
import * as studentCtrl from '../controllers/studentController.js';
import * as attendanceCtrl from '../controllers/attendanceController.js';
import * as assignmentCtrl from '../controllers/assignmentController.js';
import * as materialCtrl from '../controllers/materialController.js';
import * as examCtrl from '../controllers/examController.js';
import * as plannerCtrl from '../controllers/plannerController.js';
import * as announcementCtrl from '../controllers/announcementController.js';
import * as progressCtrl from '../controllers/progressController.js';
import * as aiCtrl from '../controllers/aiController.js';

export const apiRouter = Router();

// 1. Authentication
apiRouter.post('/auth/register', authCtrl.register);
apiRouter.post('/auth/login', authCtrl.login);
apiRouter.get('/auth/me', authenticate, authCtrl.getMe);

// 2. User & Profile
apiRouter.get('/users/profile', authenticate, userCtrl.getProfile);
apiRouter.put('/users/profile', authenticate, userCtrl.updateProfile);

// 3. Subjects / Courses
apiRouter.get('/subjects', authenticate, subjectCtrl.getSubjects);
apiRouter.get('/subjects/:id', authenticate, subjectCtrl.getSubjectById);
apiRouter.post('/subjects', authenticate, requireRole(['teacher']), subjectCtrl.createSubject);
apiRouter.put('/subjects/:id', authenticate, requireRole(['teacher']), subjectCtrl.updateSubject);
apiRouter.delete('/subjects/:id', authenticate, requireRole(['teacher']), subjectCtrl.deleteSubject);

// 4. Students Directory (Teacher Management)
apiRouter.get('/students', authenticate, studentCtrl.getStudents);
apiRouter.post('/students', authenticate, requireRole(['teacher']), studentCtrl.createStudent);
apiRouter.put('/students/:id', authenticate, requireRole(['teacher']), studentCtrl.updateStudent);
apiRouter.delete('/students/:id', authenticate, requireRole(['teacher']), studentCtrl.deleteStudent);

// 5. Attendance
apiRouter.get('/attendance', authenticate, attendanceCtrl.getAttendance);
apiRouter.post('/attendance', authenticate, requireRole(['teacher']), attendanceCtrl.saveAttendance);
apiRouter.put('/attendance/:id', authenticate, requireRole(['teacher']), attendanceCtrl.updateAttendance);

// 6. Assignments
apiRouter.get('/assignments', authenticate, assignmentCtrl.getAssignments);
apiRouter.get('/assignments/:id', authenticate, assignmentCtrl.getAssignmentById);
apiRouter.post(
  '/assignments',
  authenticate,
  requireRole(['teacher']),
  upload.single('file'),
  assignmentCtrl.createAssignment
);
apiRouter.put(
  '/assignments/:id',
  authenticate,
  requireRole(['teacher']),
  upload.single('file'),
  assignmentCtrl.updateAssignment
);
apiRouter.delete('/assignments/:id', authenticate, requireRole(['teacher']), assignmentCtrl.deleteAssignment);

// 7. Submissions & Grading
apiRouter.post(
  '/assignments/:id/submit',
  authenticate,
  requireRole(['student']),
  upload.single('file'),
  assignmentCtrl.submitAssignment
);
apiRouter.get('/assignments/:id/submissions', authenticate, assignmentCtrl.getSubmissions);
apiRouter.put(
  '/assignments/submissions/:submissionId/grade',
  authenticate,
  requireRole(['teacher']),
  assignmentCtrl.gradeSubmission
);

// 8. Study Materials
apiRouter.get('/materials', authenticate, materialCtrl.getMaterials);
apiRouter.post(
  '/materials',
  authenticate,
  requireRole(['teacher']),
  upload.single('file'),
  materialCtrl.createMaterial
);
apiRouter.put(
  '/materials/:id',
  authenticate,
  requireRole(['teacher']),
  upload.single('file'),
  materialCtrl.updateMaterial
);
apiRouter.delete('/materials/:id', authenticate, requireRole(['teacher']), materialCtrl.deleteMaterial);

// 9. Exams
apiRouter.get('/exams', authenticate, examCtrl.getExams);
apiRouter.post('/exams', authenticate, requireRole(['teacher']), examCtrl.createExam);
apiRouter.put('/exams/:id', authenticate, requireRole(['teacher']), examCtrl.updateExam);
apiRouter.delete('/exams/:id', authenticate, requireRole(['teacher']), examCtrl.deleteExam);

// 10. Planner
apiRouter.get('/planner', authenticate, plannerCtrl.getTasks);
apiRouter.post('/planner', authenticate, plannerCtrl.createTask);
apiRouter.put('/planner/:id', authenticate, plannerCtrl.updateTask);
apiRouter.delete('/planner/:id', authenticate, plannerCtrl.deleteTask);

// 11. Announcements
apiRouter.get('/announcements', authenticate, announcementCtrl.getAnnouncements);
apiRouter.post('/announcements', authenticate, requireRole(['teacher']), announcementCtrl.createAnnouncement);
apiRouter.put('/announcements/:id', authenticate, requireRole(['teacher']), announcementCtrl.updateAnnouncement);
apiRouter.delete('/announcements/:id', authenticate, requireRole(['teacher']), announcementCtrl.deleteAnnouncement);

// 12. Progress Analytics
apiRouter.get('/progress', authenticate, progressCtrl.getProgress);

// 13. AI Assistant
apiRouter.post('/ai/chat', authenticate, aiCtrl.chatWithAI);
apiRouter.get('/ai/history', authenticate, aiCtrl.getChatHistory);
apiRouter.delete('/ai/history', authenticate, aiCtrl.clearChatHistory);

// 14. Real File Download/Serving Route
apiRouter.get('/files/:filename', (req: Request, res: Response): void => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.resolve(process.cwd(), 'uploads', safeFilename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Requested file not found or has been removed.' });
    return;
  }

  // Determine mime type / disposition
  const ext = path.extname(safeFilename).toLowerCase();
  const inlineTypes = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.txt'];
  if (!inlineTypes.includes(ext)) {
    res.download(filePath, safeFilename);
  } else {
    res.sendFile(filePath);
  }
});
