import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Announcements, Subjects, Users } from '../db/mongo.js';

export async function getAnnouncements(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { subjectId } = req.query;

    if (user.role === 'student') {
      const enrolledSubjects = await Subjects.find({ enrolledStudents: user._id });
      const enrolledSubjIds = enrolledSubjects.map((s: any) => s._id);

      if (enrolledSubjIds.length === 0) {
        res.json({ announcements: [] });
        return;
      }

      const filter: Record<string, any> = { subjectId: { $in: enrolledSubjIds } };
      if (subjectId && enrolledSubjIds.includes(String(subjectId))) {
        filter.subjectId = String(subjectId);
      }

      const announcements = await Announcements.find(filter, { sort: { createdAt: -1 } });

      const subjMap = new Map<string, { name: string; code: string }>();
      enrolledSubjects.forEach((s: any) => subjMap.set(s._id, { name: s.name, code: s.code }));

      const enriched = await Promise.all(
        announcements.map(async (ann: any) => {
          const teacher = await Users.findById(ann.teacherId);
          return {
            ...ann,
            subjectName: subjMap.get(ann.subjectId)?.name || 'Course',
            subjectCode: subjMap.get(ann.subjectId)?.code || '',
            authorName: teacher ? teacher.name : 'Faculty Member',
          };
        })
      );

      res.json({ announcements: enriched });
      return;
    }

    // Teacher
    const teacherSubjects = await Subjects.find({ teacherId: user._id });
    const teacherSubjIds = teacherSubjects.map((s: any) => s._id);

    const filter: Record<string, any> = { subjectId: { $in: teacherSubjIds } };
    if (subjectId) {
      filter.subjectId = String(subjectId);
    }

    const announcements = await Announcements.find(filter, { sort: { createdAt: -1 } });

    const subjMap = new Map<string, { name: string; code: string }>();
    teacherSubjects.forEach((s: any) => subjMap.set(s._id, { name: s.name, code: s.code }));

    const enriched = announcements.map((ann: any) => ({
      ...ann,
      subjectName: subjMap.get(ann.subjectId)?.name || 'Course',
      subjectCode: subjMap.get(ann.subjectId)?.code || '',
      authorName: user.name,
    }));

    res.json({ announcements: enriched });
  } catch (err) {
    console.error('getAnnouncements error:', err);
    res.status(500).json({ error: 'Failed to retrieve announcements.' });
  }
}

export async function createAnnouncement(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, message, subjectId, priority } = req.body;

    if (!title || !message || !subjectId) {
      res.status(400).json({ error: 'Announcement title, message, and course are required.' });
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

    const announcement = await Announcements.create({
      title: title.trim(),
      message: message.trim(),
      subjectId,
      teacherId: req.user._id,
      priority: priority || 'Normal',
    });

    res.status(201).json({
      message: 'Announcement published to course students.',
      announcement,
    });
  } catch (err) {
    console.error('createAnnouncement error:', err);
    res.status(500).json({ error: 'Failed to post announcement.' });
  }
}

export async function updateAnnouncement(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, message, priority } = req.body;

    const announcement = await Announcements.findById(id);
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }

    if (announcement.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not authorized to edit this announcement.' });
      return;
    }

    const updateData: Record<string, any> = {};
    if (title) updateData.title = title.trim();
    if (message) updateData.message = message.trim();
    if (priority) updateData.priority = priority;

    const updated = await Announcements.findByIdAndUpdate(id, updateData);
    res.json({
      message: 'Announcement updated successfully.',
      announcement: updated,
    });
  } catch (err) {
    console.error('updateAnnouncement error:', err);
    res.status(500).json({ error: 'Failed to update announcement.' });
  }
}

export async function deleteAnnouncement(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const announcement = await Announcements.findById(id);
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }

    if (announcement.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not authorized to delete this announcement.' });
      return;
    }

    await Announcements.findByIdAndDelete(id);
    res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    console.error('deleteAnnouncement error:', err);
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
}
