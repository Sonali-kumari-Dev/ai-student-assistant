import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Users } from '../db/mongo.js';

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await Users.findById(req.user._id);
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ profile: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile data.' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, course, semester, rollNumber, department, designation } = req.body;
    const updateData: Record<string, any> = {};

    if (name) updateData.name = name.trim();
    if (req.user.role === 'student') {
      if (course !== undefined) updateData.course = course;
      if (semester !== undefined) updateData.semester = semester;
      if (rollNumber !== undefined) updateData.rollNumber = rollNumber;
    } else if (req.user.role === 'teacher') {
      if (department !== undefined) updateData.department = department;
      if (designation !== undefined) updateData.designation = designation;
    }

    const updated = await Users.findByIdAndUpdate(req.user._id, updateData);
    if (!updated) {
      res.status(404).json({ error: 'User profile could not be found for update.' });
      return;
    }

    const { passwordHash: _, ...safeUser } = updated;
    res.json({
      message: 'Profile updated successfully.',
      profile: safeUser,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
}
