import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  Subjects,
  AttendanceRecords,
  Assignments,
  AssignmentSubmissions,
  Exams,
  PlannerTasks,
  Announcements,
} from '../db/mongo.js';

export async function getProgress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const today = new Date().toISOString().split('T')[0];

    if (user.role === 'student') {
      const enrolledSubjects = await Subjects.find({ enrolledStudents: user._id });
      const enrolledSubjIds = enrolledSubjects.map((s: any) => s._id);

      if (enrolledSubjIds.length === 0) {
        res.json({
          metrics: {
            totalCourses: 0,
            attendanceRate: 0,
            totalClasses: 0,
            attendedClasses: 0,
            absentClasses: 0,
            totalAssignments: 0,
            submittedAssignments: 0,
            pendingAssignments: 0,
            assignmentCompletionRate: 0,
            upcomingExamsCount: 0,
            completedTasksCount: 0,
            totalTasksCount: 0,
            plannerCompletionRate: 0,
          },
          recentExams: [],
          pendingAssignmentsList: [],
          hasData: false,
        });
        return;
      }

      // 1. Attendance Calculation
      const attendanceSessions = await AttendanceRecords.find({ subjectId: { $in: enrolledSubjIds } });
      let totalClasses = 0;
      let attendedClasses = 0;

      for (const session of attendanceSessions) {
        const record = (session.records || []).find((r: any) => r.studentId === user._id);
        if (record) {
          totalClasses++;
          if (record.status === 'Present') attendedClasses++;
        }
      }

      const attendanceRate = totalClasses > 0 ? Number(((attendedClasses / totalClasses) * 100).toFixed(1)) : 0;
      const absentClasses = totalClasses - attendedClasses;

      // 2. Assignment Calculation
      const publishedAssignments = await Assignments.find({
        subjectId: { $in: enrolledSubjIds },
        status: 'published',
      });
      const mySubmissions = await AssignmentSubmissions.find({ studentId: user._id });
      const submittedAssignmentIds = new Set(mySubmissions.map((s: any) => s.assignmentId));

      let submittedCount = 0;
      const pendingList: any[] = [];

      for (const a of publishedAssignments) {
        if (submittedAssignmentIds.has(a._id)) {
          submittedCount++;
        } else {
          pendingList.push({
            _id: a._id,
            title: a.title,
            dueDate: a.dueDate,
            priority: a.priority,
          });
        }
      }

      const totalAssignments = publishedAssignments.length;
      const pendingAssignments = totalAssignments - submittedCount;
      const assignmentCompletionRate = totalAssignments > 0 ? Number(((submittedCount / totalAssignments) * 100).toFixed(1)) : 0;

      // 3. Upcoming Exams
      const allExams = await Exams.find({ subjectId: { $in: enrolledSubjIds } }, { sort: { date: 1 } });
      const upcomingExams = allExams.filter((e: any) => e.date >= today);

      // 4. Planner Tasks
      const allTasks = await PlannerTasks.find({ studentId: user._id });
      const completedTasks = allTasks.filter((t: any) => t.completed);
      const totalTasks = allTasks.length;
      const plannerRate = totalTasks > 0 ? Number(((completedTasks.length / totalTasks) * 100).toFixed(1)) : 0;

      const hasData = enrolledSubjects.length > 0 || totalClasses > 0 || totalAssignments > 0;

      res.json({
        metrics: {
          totalCourses: enrolledSubjects.length,
          attendanceRate,
          totalClasses,
          attendedClasses,
          absentClasses,
          totalAssignments,
          submittedAssignments: submittedCount,
          pendingAssignments,
          assignmentCompletionRate,
          upcomingExamsCount: upcomingExams.length,
          completedTasksCount: completedTasks.length,
          totalTasksCount: totalTasks,
          plannerCompletionRate: plannerRate,
        },
        recentExams: upcomingExams.slice(0, 5),
        pendingAssignmentsList: pendingList.slice(0, 5),
        hasData,
      });
      return;
    }

    // Teacher view:
    const teacherSubjects = await Subjects.find({ teacherId: user._id });
    const teacherSubjIds = teacherSubjects.map((s: any) => s._id);

    // Count unique students enrolled
    const uniqueStudentIds = new Set<string>();
    teacherSubjects.forEach((s: any) => {
      if (Array.isArray(s.enrolledStudents)) {
        s.enrolledStudents.forEach((stId: string) => uniqueStudentIds.add(stId));
      }
    });

    // Assignments & Submissions
    const assignments = await Assignments.find({ subjectId: { $in: teacherSubjIds } });
    const assignmentIds = assignments.map((a: any) => a._id);

    const submissions = await AssignmentSubmissions.find({ assignmentId: { $in: assignmentIds } });
    const pendingGrading = submissions.filter((s: any) => s.status !== 'Reviewed').length;

    // Upcoming exams
    const allExams = await Exams.find({ subjectId: { $in: teacherSubjIds } }, { sort: { date: 1 } });
    const upcomingExams = allExams.filter((e: any) => e.date >= today);

    // Announcements
    const announcements = await Announcements.find({ subjectId: { $in: teacherSubjIds } });

    res.json({
      metrics: {
        totalCourses: teacherSubjects.length,
        totalStudents: uniqueStudentIds.size,
        totalAssignments: assignments.length,
        pendingSubmissionsToGrade: pendingGrading,
        upcomingExamsCount: upcomingExams.length,
        totalAnnouncements: announcements.length,
      },
      upcomingExams: upcomingExams.slice(0, 5),
    });
  } catch (err) {
    console.error('getProgress error:', err);
    res.status(500).json({ error: 'Failed to calculate academic progress metrics.' });
  }
}
