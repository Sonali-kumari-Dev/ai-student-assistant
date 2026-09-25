import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  Subjects,
  Users,
  Assignments,
  StudyMaterials,
  Exams,
  AttendanceRecords,
  Announcements,
} from '../db/mongo.js';

export async function getSubjects(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    let subjects = [];

    if (user.role === 'student') {
      // RULE: Student sees ONLY subjects where they are enrolled!
      subjects = await Subjects.find({ enrolledStudents: user._id });
    } else {
      // Teacher sees subjects they teach
      subjects = await Subjects.find({ teacherId: user._id });
    }

    // Attach instructor details & enrolled students count
    const enriched = await Promise.all(
      subjects.map(async (subj: any) => {
        const teacher = await Users.findById(subj.teacherId);
        const enrolledCount = Array.isArray(subj.enrolledStudents) ? subj.enrolledStudents.length : 0;
        return {
          ...subj,
          teacherName: teacher ? teacher.name : 'Faculty Instructor',
          enrolledCount,
        };
      })
    );

    res.json({ subjects: enriched });
  } catch (err) {
    console.error('getSubjects error:', err);
    res.status(500).json({ error: 'Failed to retrieve academic courses.' });
  }
}

export async function getSubjectById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const subject = await Subjects.findById(id);

    if (!subject) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }

    const user = req.user;
    // Security check: Student must be enrolled or teacher must own it
    if (user.role === 'student') {
      const isEnrolled = Array.isArray(subject.enrolledStudents) && subject.enrolledStudents.includes(user._id);
      if (!isEnrolled) {
        res.status(403).json({ error: 'Access denied. You are not enrolled in this course.' });
        return;
      }
    }

    const teacher = await Users.findById(subject.teacherId);

    // Fetch enrolled students full details (for teacher or student roster view)
    const studentIds = subject.enrolledStudents || [];
    const students = await Users.find({ _id: { $in: studentIds } });
    const safeStudents = students.map((s: any) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      rollNumber: s.rollNumber || 'N/A',
      semester: s.semester || 'N/A',
      course: s.course || 'N/A',
    }));

    // Fetch counts of related resources
    const assignmentsCount = await Assignments.countDocuments({
      subjectId: subject._id,
      ...(user.role === 'student' ? { status: 'published' } : {}),
    });
    const materialsCount = await StudyMaterials.countDocuments({ subjectId: subject._id });
    const examsCount = await Exams.countDocuments({ subjectId: subject._id });
    const attendanceSessionsCount = await AttendanceRecords.countDocuments({ subjectId: subject._id });
    const announcementsCount = await Announcements.countDocuments({ subjectId: subject._id });

    res.json({
      subject: {
        ...subject,
        teacherName: teacher ? teacher.name : 'Faculty Instructor',
        teacherEmail: teacher ? teacher.email : '',
        students: safeStudents,
        stats: {
          assignmentsCount,
          materialsCount,
          examsCount,
          attendanceSessionsCount,
          announcementsCount,
        },
      },
    });
  } catch (err) {
    console.error('getSubjectById error:', err);
    res.status(500).json({ error: 'Failed to retrieve course details.' });
  }
}

export async function createSubject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, code, description, enrolledStudents } = req.body;

    if (!name || !code) {
      res.status(400).json({ error: 'Course name and course code are required.' });
      return;
    }

    const cleanCode = String(code).trim().toUpperCase();

    // Check if code already exists for this teacher
    const existing = await Subjects.findOne({ code: cleanCode });
    if (existing) {
      res.status(400).json({ error: `A course with code "${cleanCode}" already exists.` });
      return;
    }

    const subject = await Subjects.create({
      name: name.trim(),
      code: cleanCode,
      description: description ? description.trim() : '',
      teacherId: req.user._id,
      enrolledStudents: Array.isArray(enrolledStudents) ? enrolledStudents : [],
    });

    res.status(201).json({
      message: 'Course created successfully.',
      subject,
    });
  } catch (err) {
    console.error('createSubject error:', err);
    res.status(500).json({ error: 'Failed to create course.' });
  }
}

export async function updateSubject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, code, description, enrolledStudents } = req.body;

    const subject = await Subjects.findById(id);
    if (!subject) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }

    if (subject.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not the instructor of this course.' });
      return;
    }

    const updateData: Record<string, any> = {};
    if (name) updateData.name = name.trim();
    if (code) updateData.code = String(code).trim().toUpperCase();
    if (description !== undefined) updateData.description = description.trim();
    if (Array.isArray(enrolledStudents)) updateData.enrolledStudents = enrolledStudents;

    const updated = await Subjects.findByIdAndUpdate(id, updateData);

    res.json({
      message: 'Course updated successfully.',
      subject: updated,
    });
  } catch (err) {
    console.error('updateSubject error:', err);
    res.status(500).json({ error: 'Failed to update course.' });
  }
}

export async function deleteSubject(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const subject = await Subjects.findById(id);
    if (!subject) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }

    if (subject.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not the instructor of this course.' });
      return;
    }

    await Subjects.findByIdAndDelete(id);

    // Cascade delete associated academic items for consistency
    await Assignments.deleteMany({ subjectId: id });
    await StudyMaterials.deleteMany({ subjectId: id });
    await Exams.deleteMany({ subjectId: id });
    await AttendanceRecords.deleteMany({ subjectId: id });
    await Announcements.deleteMany({ subjectId: id });

    res.json({ message: 'Course and related records removed successfully.' });
  } catch (err) {
    console.error('deleteSubject error:', err);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
}
