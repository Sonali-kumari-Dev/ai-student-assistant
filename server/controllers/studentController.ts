import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.js';
import { Users, Subjects } from '../db/mongo.js';

export async function getStudents(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { search, courseId } = req.query;

    let students = await Users.find({ role: 'student' });

    if (search) {
      const q = String(search).toLowerCase();
      students = students.filter(
        (s: any) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
      );
    }

    if (courseId) {
      const subject = await Subjects.findById(String(courseId));
      if (subject && Array.isArray(subject.enrolledStudents)) {
        students = students.filter((s: any) => subject.enrolledStudents.includes(s._id));
      }
    }

    const safeStudents = students.map((s: any) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      rollNumber: s.rollNumber || 'N/A',
      course: s.course || 'B.Tech Computer Science',
      semester: s.semester || '4',
      createdAt: s.createdAt,
    }));

    res.json({ students: safeStudents });
  } catch (err) {
    console.error('getStudents error:', err);
    res.status(500).json({ error: 'Failed to retrieve students roster.' });
  }
}

export async function createStudent(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, email, rollNumber, course, semester, password } = req.body;

    if (!name || !email || !rollNumber) {
      res.status(400).json({ error: 'Student name, email, and roll number are required.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await Users.findOne({ email: cleanEmail });
    if (existing) {
      res.status(400).json({ error: 'A student with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'student123', salt);

    const student = await Users.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'student',
      rollNumber: String(rollNumber).trim(),
      course: course ? course.trim() : 'B.Tech Computer Science',
      semester: semester ? String(semester).trim() : '4',
      avatarUrl: '',
    });

    const { passwordHash: _, ...safeStudent } = student;
    res.status(201).json({
      message: 'Student added successfully to the institution roster.',
      student: safeStudent,
    });
  } catch (err) {
    console.error('createStudent error:', err);
    res.status(500).json({ error: 'Failed to add student.' });
  }
}

export async function updateStudent(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, rollNumber, course, semester } = req.body;

    const student = await Users.findById(id);
    if (!student || student.role !== 'student') {
      res.status(404).json({ error: 'Student record not found.' });
      return;
    }

    const updateData: Record<string, any> = {};
    if (name) updateData.name = name.trim();
    if (rollNumber) updateData.rollNumber = String(rollNumber).trim();
    if (course) updateData.course = course.trim();
    if (semester) updateData.semester = String(semester).trim();

    const updated = await Users.findByIdAndUpdate(id, updateData);
    const { passwordHash: _, ...safeStudent } = updated;

    res.json({
      message: 'Student information updated successfully.',
      student: safeStudent,
    });
  } catch (err) {
    console.error('updateStudent error:', err);
    res.status(500).json({ error: 'Failed to update student.' });
  }
}

export async function deleteStudent(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const student = await Users.findById(id);
    if (!student || student.role !== 'student') {
      res.status(404).json({ error: 'Student record not found.' });
      return;
    }

    await Users.findByIdAndDelete(id);

    // Remove student from any enrolled subjects
    const subjects = await Subjects.find({ enrolledStudents: id });
    for (const subj of subjects) {
      const updatedList = (subj.enrolledStudents || []).filter((sId: string) => sId !== id);
      await Subjects.findByIdAndUpdate(subj._id, { enrolledStudents: updatedList });
    }

    res.json({ message: 'Student removed from institution records.' });
  } catch (err) {
    console.error('deleteStudent error:', err);
    res.status(500).json({ error: 'Failed to delete student.' });
  }
}
