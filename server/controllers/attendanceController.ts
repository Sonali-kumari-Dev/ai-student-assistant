import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { AttendanceRecords, Subjects, Users } from '../db/mongo.js';

export async function getAttendance(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { subjectId, date } = req.query;

    if (user.role === 'student') {
      // RULE: Student sees only attendance for subjects they are enrolled in,
      // and only the dates teacher has actually recorded!
      let studentSubjectIds: string[] = [];

      if (subjectId) {
        const subj = await Subjects.findById(String(subjectId));
        if (!subj || !Array.isArray(subj.enrolledStudents) || !subj.enrolledStudents.includes(user._id)) {
          res.json({ records: [], summary: { total: 0, present: 0, absent: 0, percentage: 0 } });
          return;
        }
        studentSubjectIds = [String(subjectId)];
      } else {
        const enrolledSubjects = await Subjects.find({ enrolledStudents: user._id });
        studentSubjectIds = enrolledSubjects.map((s: any) => s._id);
      }

      if (studentSubjectIds.length === 0) {
        res.json({ records: [], summary: { total: 0, present: 0, absent: 0, percentage: 0 }, courseSummaries: [] });
        return;
      }

      // Fetch all recorded attendance records for these subjects
      const filter: Record<string, any> = { subjectId: { $in: studentSubjectIds } };
      if (date) filter.date = String(date);

      const allSessions = await AttendanceRecords.find(filter, { sort: { date: -1 } });

      // Build subject name map
      const subjects = await Subjects.find({ _id: { $in: studentSubjectIds } });
      const subjectMap = new Map<string, { name: string; code: string }>();
      subjects.forEach((s: any) => subjectMap.set(s._id, { name: s.name, code: s.code }));

      // Extract this student's individual attendance history
      const studentHistory: any[] = [];
      let totalAttended = 0;
      let totalSessions = 0;

      // Per-course breakdown
      const perCourseStats: Record<string, { name: string; code: string; total: number; present: number; absent: number }> = {};
      subjects.forEach((s: any) => {
        perCourseStats[s._id] = { name: s.name, code: s.code, total: 0, present: 0, absent: 0 };
      });

      for (const session of allSessions) {
        const studentRecord = (session.records || []).find((r: any) => r.studentId === user._id);
        if (studentRecord) {
          totalSessions++;
          const isPresent = studentRecord.status === 'Present';
          if (isPresent) totalAttended++;

          const subjInfo = subjectMap.get(session.subjectId) || { name: 'Course', code: '' };
          studentHistory.push({
            sessionId: session._id,
            subjectId: session.subjectId,
            subjectName: subjInfo.name,
            subjectCode: subjInfo.code,
            date: session.date,
            status: studentRecord.status,
            recordedAt: session.createdAt,
            updatedAt: session.updatedAt,
          });

          if (perCourseStats[session.subjectId]) {
            perCourseStats[session.subjectId].total++;
            if (isPresent) {
              perCourseStats[session.subjectId].present++;
            } else {
              perCourseStats[session.subjectId].absent++;
            }
          }
        }
      }

      const totalAbsent = totalSessions - totalAttended;
      const percentage = totalSessions > 0 ? Number(((totalAttended / totalSessions) * 100).toFixed(1)) : 0;

      const courseSummaries = Object.entries(perCourseStats).map(([sId, stats]) => ({
        subjectId: sId,
        subjectName: stats.name,
        subjectCode: stats.code,
        total: stats.total,
        present: stats.present,
        absent: stats.absent,
        percentage: stats.total > 0 ? Number(((stats.present / stats.total) * 100).toFixed(1)) : 0,
      }));

      res.json({
        records: studentHistory,
        summary: {
          total: totalSessions,
          present: totalAttended,
          absent: totalAbsent,
          percentage,
        },
        courseSummaries,
      });
      return;
    }

    // Teacher view:
    if (!subjectId) {
      // Return list of all recorded sessions across teacher's subjects
      const teacherSubjects = await Subjects.find({ teacherId: user._id });
      const teacherSubjIds = teacherSubjects.map((s: any) => s._id);
      const sessions = await AttendanceRecords.find(
        { subjectId: { $in: teacherSubjIds } },
        { sort: { date: -1 } }
      );

      const subjMap = new Map<string, string>();
      teacherSubjects.forEach((s: any) => subjMap.set(s._id, s.name));

      const formatted = sessions.map((sess: any) => {
        const records = sess.records || [];
        const presentCount = records.filter((r: any) => r.status === 'Present').length;
        return {
          _id: sess._id,
          subjectId: sess.subjectId,
          subjectName: subjMap.get(sess.subjectId) || 'Course',
          date: sess.date,
          totalStudents: records.length,
          presentCount,
          absentCount: records.length - presentCount,
          updatedAt: sess.updatedAt,
        };
      });

      res.json({ sessions: formatted });
      return;
    }

    // Specific subject requested by teacher
    const subject = await Subjects.findById(String(subjectId));
    if (!subject) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }

    if (subject.teacherId !== user._id) {
      res.status(403).json({ error: 'Access forbidden. You are not the instructor of this course.' });
      return;
    }

    // If specific date requested
    if (date) {
      const existingSession = await AttendanceRecords.findOne({
        subjectId: String(subjectId),
        date: String(date),
      });

      // Fetch enrolled students
      const enrolledStudentIds = subject.enrolledStudents || [];
      const enrolledStudents = await Users.find({ _id: { $in: enrolledStudentIds } });

      // If existing session, map current statuses
      const existingRecordMap = new Map<string, string>();
      if (existingSession && Array.isArray(existingSession.records)) {
        existingSession.records.forEach((r: any) => existingRecordMap.set(r.studentId, r.status));
      }

      const roster = enrolledStudents.map((s: any) => ({
        studentId: s._id,
        rollNumber: s.rollNumber || 'N/A',
        studentName: s.name,
        email: s.email,
        // RULE: If new date, default is strictly 'Not Marked'!
        status: existingRecordMap.get(s._id) || 'Not Marked',
      }));

      // Sort by roll number numerically or alphabetically
      roster.sort((a: any, b: any) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));

      res.json({
        sessionId: existingSession ? existingSession._id : null,
        isNewDate: !existingSession,
        subjectId: subject._id,
        subjectName: subject.name,
        date: String(date),
        roster,
      });
      return;
    }

    // All past sessions for this subject
    const sessions = await AttendanceRecords.find({ subjectId: String(subjectId) }, { sort: { date: -1 } });
    res.json({ sessions });
  } catch (err) {
    console.error('getAttendance error:', err);
    res.status(500).json({ error: 'Failed to retrieve attendance records.' });
  }
}

export async function saveAttendance(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { subjectId, date, records } = req.body;

    if (!subjectId || !date || !Array.isArray(records)) {
      res.status(400).json({ error: 'Course, date, and student attendance records are required.' });
      return;
    }

    const subject = await Subjects.findById(subjectId);
    if (!subject) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }

    if (subject.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. Only the course instructor can record attendance.' });
      return;
    }

    // Validate that statuses are marked
    const formattedRecords = records.map((r: any) => {
      // Status must be Present or Absent. If left as 'Not Marked', warn or reject
      const status = r.status === 'Present' ? 'Present' : 'Absent';
      return {
        studentId: r.studentId,
        rollNumber: r.rollNumber || '',
        studentName: r.studentName || '',
        status,
      };
    });

    // Check if session for this subject and date already exists
    const existing = await AttendanceRecords.findOne({ subjectId, date });

    let saved;
    if (existing) {
      saved = await AttendanceRecords.findByIdAndUpdate(existing._id, {
        records: formattedRecords,
        teacherId: req.user._id,
      });
    } else {
      saved = await AttendanceRecords.create({
        subjectId,
        date,
        teacherId: req.user._id,
        records: formattedRecords,
      });
    }

    const presentCount = formattedRecords.filter((r) => r.status === 'Present').length;
    res.json({
      message: 'Attendance saved successfully.',
      session: saved,
      stats: {
        total: formattedRecords.length,
        present: presentCount,
        absent: formattedRecords.length - presentCount,
      },
    });
  } catch (err) {
    console.error('saveAttendance error:', err);
    res.status(500).json({ error: 'Failed to save attendance record.' });
  }
}

export async function updateAttendance(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { records } = req.body;

    const session = await AttendanceRecords.findById(id);
    if (!session) {
      res.status(404).json({ error: 'Attendance session not found.' });
      return;
    }

    if (session.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not authorized to edit this attendance session.' });
      return;
    }

    if (!Array.isArray(records)) {
      res.status(400).json({ error: 'Invalid attendance records format.' });
      return;
    }

    const updated = await AttendanceRecords.findByIdAndUpdate(id, { records });
    res.json({
      message: 'Attendance updated successfully.',
      session: updated,
    });
  } catch (err) {
    console.error('updateAttendance error:', err);
    res.status(500).json({ error: 'Failed to update attendance session.' });
  }
}
