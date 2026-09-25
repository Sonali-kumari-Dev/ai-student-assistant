import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Users } from '../db/mongo.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';

const TEACHER_ACCESS_CODE = 'FACULTY2026';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role, course, semester, rollNumber, department, designation, teacherCode } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Please provide full name, email, password, and role.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await Users.findOne({ email: cleanEmail });
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
      return;
    }

    if (role === 'teacher') {
      if (!teacherCode || teacherCode !== TEACHER_ACCESS_CODE) {
        res.status(400).json({
          error: `Invalid Faculty Access Code. Use "${TEACHER_ACCESS_CODE}" to register a teacher account.`,
        });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await Users.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role === 'teacher' ? 'teacher' : 'student',
      course: course || (role === 'student' ? 'B.Tech Computer Science' : undefined),
      semester: semester || (role === 'student' ? '4' : undefined),
      rollNumber: rollNumber || (role === 'student' ? String(Math.floor(100 + Math.random() * 900)) : undefined),
      department: department || (role === 'teacher' ? 'Computer Science & Engineering' : undefined),
      designation: designation || (role === 'teacher' ? 'Faculty Member' : undefined),
      avatarUrl: '',
    });

    const token = generateToken({ id: user._id, email: user.email, role: user.role });
    const { passwordHash: _, ...safeUser } = user;

    res.status(201).json({
      message: 'Account created successfully.',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed due to a server error. Please try again.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter both email and password.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await Users.findOne({ email: cleanEmail });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({ id: user._id, email: user.email, role: user.role });
    const { passwordHash: _, ...safeUser } = user;

    res.json({
      message: 'Login successful.',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Unable to connect to the authentication service. Please try again.' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching current user profile.' });
  }
}
