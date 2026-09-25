import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Exams, Subjects } from '../db/mongo.js';

export async function getExams(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { subjectId } = req.query;

    if (user.role === 'student') {
      const enrolledSubjects = await Subjects.find({ enrolledStudents: user._id });
      const enrolledSubjIds = enrolledSubjects.map((s: any) => s._id);

      if (enrolledSubjIds.length === 0) {
        res.json({ exams: [] });
        return;
      }

      const filter: Record<string, any> = { subjectId: { $in: enrolledSubjIds } };
      if (subjectId && enrolledSubjIds.includes(String(subjectId))) {
        filter.subjectId = String(subjectId);
      }

      const exams = await Exams.find(filter, { sort: { date: 1 } });

      const subjMap = new Map<string, { name: string; code: string }>();
      enrolledSubjects.forEach((s: any) => subjMap.set(s._id, { name: s.name, code: s.code }));

      const enriched = exams.map((e: any) => ({
        ...e,
        subjectName: subjMap.get(e.subjectId)?.name || 'Course',
        subjectCode: subjMap.get(e.subjectId)?.code || '',
      }));

      res.json({ exams: enriched });
      return;
    }

    // Teacher
    const teacherSubjects = await Subjects.find({ teacherId: user._id });
    const teacherSubjIds = teacherSubjects.map((s: any) => s._id);

    const filter: Record<string, any> = { subjectId: { $in: teacherSubjIds } };
    if (subjectId) {
      filter.subjectId = String(subjectId);
    }

    const exams = await Exams.find(filter, { sort: { date: 1 } });

    const subjMap = new Map<string, { name: string; code: string }>();
    teacherSubjects.forEach((s: any) => subjMap.set(s._id, { name: s.name, code: s.code }));

    const enriched = exams.map((e: any) => ({
      ...e,
      subjectName: subjMap.get(e.subjectId)?.name || 'Course',
      subjectCode: subjMap.get(e.subjectId)?.code || '',
    }));

    res.json({ exams: enriched });
  } catch (err) {
    console.error('getExams error:', err);
    res.status(500).json({ error: 'Failed to retrieve exams.' });
  }
}

export async function createExam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, subjectId, date, time, examType, description, roomNumber, totalMarks } = req.body;

    if (!title || !subjectId || !date || !time) {
      res.status(400).json({ error: 'Exam title, course, date, and time are required.' });
      return;
    }

    const subject = await Subjects.findById(subjectId);
    if (!subject) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }

    if (subject.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not the instructor of this course.' });
      return;
    }

    const exam = await Exams.create({
      title: title.trim(),
      subjectId,
      teacherId: req.user._id,
      date,
      time: time.trim(),
      examType: examType || 'Midterm',
      description: description ? description.trim() : '',
      roomNumber: roomNumber ? roomNumber.trim() : 'Main Examination Hall',
      totalMarks: Number(totalMarks) || 100,
    });

    res.status(201).json({
      message: 'Exam scheduled successfully.',
      exam,
    });
  } catch (err) {
    console.error('createExam error:', err);
    res.status(500).json({ error: 'Failed to schedule exam.' });
  }
}

export async function updateExam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, date, time, examType, description, roomNumber, totalMarks } = req.body;

    const exam = await Exams.findById(id);
    if (!exam) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }

    if (exam.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not authorized to edit this exam.' });
      return;
    }

    const updateData: Record<string, any> = {};
    if (title) updateData.title = title.trim();
    if (date) updateData.date = date;
    if (time) updateData.time = time.trim();
    if (examType) updateData.examType = examType;
    if (description !== undefined) updateData.description = description.trim();
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber.trim();
    if (totalMarks !== undefined) updateData.totalMarks = Number(totalMarks);

    const updated = await Exams.findByIdAndUpdate(id, updateData);
    res.json({
      message: 'Exam schedule updated successfully.',
      exam: updated,
    });
  } catch (err) {
    console.error('updateExam error:', err);
    res.status(500).json({ error: 'Failed to update exam.' });
  }
}

export async function deleteExam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const exam = await Exams.findById(id);
    if (!exam) {
      res.status(404).json({ error: 'Exam not found.' });
      return;
    }

    if (exam.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not authorized to delete this exam.' });
      return;
    }

    await Exams.findByIdAndDelete(id);
    res.json({ message: 'Exam removed from schedule.' });
  } catch (err) {
    console.error('deleteExam error:', err);
    res.status(500).json({ error: 'Failed to delete exam.' });
  }
}
