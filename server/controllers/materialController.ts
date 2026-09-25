import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { StudyMaterials, Subjects } from '../db/mongo.js';

export async function getMaterials(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { subjectId } = req.query;

    if (user.role === 'student') {
      const enrolledSubjects = await Subjects.find({ enrolledStudents: user._id });
      const enrolledSubjIds = enrolledSubjects.map((s: any) => s._id);

      if (enrolledSubjIds.length === 0) {
        res.json({ materials: [] });
        return;
      }

      const filter: Record<string, any> = { subjectId: { $in: enrolledSubjIds } };
      if (subjectId && enrolledSubjIds.includes(String(subjectId))) {
        filter.subjectId = String(subjectId);
      }

      const materials = await StudyMaterials.find(filter, { sort: { createdAt: -1 } });

      const subjMap = new Map<string, { name: string; code: string }>();
      enrolledSubjects.forEach((s: any) => subjMap.set(s._id, { name: s.name, code: s.code }));

      const enriched = materials.map((m: any) => ({
        ...m,
        subjectName: subjMap.get(m.subjectId)?.name || 'Course',
        subjectCode: subjMap.get(m.subjectId)?.code || '',
      }));

      res.json({ materials: enriched });
      return;
    }

    // Teacher
    const teacherSubjects = await Subjects.find({ teacherId: user._id });
    const teacherSubjIds = teacherSubjects.map((s: any) => s._id);

    const filter: Record<string, any> = { subjectId: { $in: teacherSubjIds } };
    if (subjectId) {
      filter.subjectId = String(subjectId);
    }

    const materials = await StudyMaterials.find(filter, { sort: { createdAt: -1 } });

    const subjMap = new Map<string, { name: string; code: string }>();
    teacherSubjects.forEach((s: any) => subjMap.set(s._id, { name: s.name, code: s.code }));

    const enriched = materials.map((m: any) => ({
      ...m,
      subjectName: subjMap.get(m.subjectId)?.name || 'Course',
      subjectCode: subjMap.get(m.subjectId)?.code || '',
    }));

    res.json({ materials: enriched });
  } catch (err) {
    console.error('getMaterials error:', err);
    res.status(500).json({ error: 'Failed to retrieve study materials.' });
  }
}

export async function createMaterial(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, subjectId, fileType } = req.body;

    if (!title || !subjectId) {
      res.status(400).json({ error: 'Title and course are required.' });
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

    let fileUrl = '';
    let fileOriginalName = '';
    let fileSize = 0;

    if (req.file) {
      fileUrl = `/api/files/${req.file.filename}`;
      fileOriginalName = req.file.originalname;
      fileSize = req.file.size;
    }

    const material = await StudyMaterials.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      subjectId,
      teacherId: req.user._id,
      fileUrl,
      fileOriginalName,
      fileSize,
      fileType: fileType || 'Document',
    });

    res.status(201).json({
      message: 'Study material uploaded successfully.',
      material,
    });
  } catch (err) {
    console.error('createMaterial error:', err);
    res.status(500).json({ error: 'Failed to upload study material.' });
  }
}

export async function updateMaterial(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description, fileType } = req.body;

    const material = await StudyMaterials.findById(id);
    if (!material) {
      res.status(404).json({ error: 'Material not found.' });
      return;
    }

    if (material.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not authorized to edit this material.' });
      return;
    }

    const updateData: Record<string, any> = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (fileType) updateData.fileType = fileType;

    if (req.file) {
      updateData.fileUrl = `/api/files/${req.file.filename}`;
      updateData.fileOriginalName = req.file.originalname;
      updateData.fileSize = req.file.size;
    }

    const updated = await StudyMaterials.findByIdAndUpdate(id, updateData);
    res.json({
      message: 'Study material updated successfully.',
      material: updated,
    });
  } catch (err) {
    console.error('updateMaterial error:', err);
    res.status(500).json({ error: 'Failed to update study material.' });
  }
}

export async function deleteMaterial(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const material = await StudyMaterials.findById(id);
    if (!material) {
      res.status(404).json({ error: 'Material not found.' });
      return;
    }

    if (material.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not authorized to delete this material.' });
      return;
    }

    await StudyMaterials.findByIdAndDelete(id);
    res.json({ message: 'Study material removed successfully.' });
  } catch (err) {
    console.error('deleteMaterial error:', err);
    res.status(500).json({ error: 'Failed to delete study material.' });
  }
}
