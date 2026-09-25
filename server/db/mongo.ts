import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generates a valid 24-character hexadecimal MongoDB ObjectId
 */
export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = crypto.randomBytes(8).toString('hex');
  return timestamp + random; // 8 + 16 = 24 hex characters
}

export function isValidObjectId(id: any): boolean {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

export interface BaseDoc {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export class MongoCollection<T extends BaseDoc> {
  private filePath: string;
  public name: string;

  constructor(collectionName: string) {
    this.name = collectionName;
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
    }
  }

  private read(): T[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error(`Error reading collection ${this.name}:`, err);
      return [];
    }
  }

  private write(data: T[]): void {
    try {
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error(`Error writing collection ${this.name}:`, err);
    }
  }

  private matches(doc: T, filter: Record<string, any>): boolean {
    if (!filter || Object.keys(filter).length === 0) return true;

    for (const [key, val] of Object.entries(filter)) {
      if (val === undefined) continue;

      if (val && typeof val === 'object' && !Array.isArray(val)) {
        // Query operators
        if ('$in' in val) {
          const list = val.$in;
          const docVal = doc[key];
          if (Array.isArray(docVal)) {
            if (!docVal.some((item) => list.includes(item))) return false;
          } else {
            if (!list.includes(docVal)) return false;
          }
          continue;
        }
        if ('$nin' in val) {
          const list = val.$nin;
          if (list.includes(doc[key])) return false;
          continue;
        }
        if ('$ne' in val) {
          if (doc[key] === val.$ne) return false;
          continue;
        }
        if ('$regex' in val) {
          const reg = new RegExp(val.$regex, val.$options || 'i');
          if (!reg.test(String(doc[key] || ''))) return false;
          continue;
        }
      }

      // Array containment check
      const docVal = doc[key];
      if (Array.isArray(docVal)) {
        if (!docVal.includes(val)) return false;
      } else {
        if (docVal !== val) return false;
      }
    }
    return true;
  }

  async find(filter: Record<string, any> = {}, options?: { sort?: Record<string, 1 | -1>; limit?: number; skip?: number }): Promise<T[]> {
    let items = this.read().filter((doc) => this.matches(doc, filter));

    if (options?.sort) {
      const [field, order] = Object.entries(options.sort)[0];
      items.sort((a: any, b: any) => {
        if (a[field] < b[field]) return order === 1 ? -1 : 1;
        if (a[field] > b[field]) return order === 1 ? 1 : -1;
        return 0;
      });
    }

    if (options?.skip) {
      items = items.slice(options.skip);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }

    return items;
  }

  async findOne(filter: Record<string, any>): Promise<T | null> {
    const items = this.read();
    const found = items.find((doc) => this.matches(doc, filter));
    return found || null;
  }

  async findById(id: string): Promise<T | null> {
    return this.findOne({ _id: id });
  }

  async create(data: Omit<T, '_id' | 'createdAt' | 'updatedAt'> & Partial<BaseDoc>): Promise<T> {
    const items = this.read();
    const now = new Date().toISOString();
    const doc: T = {
      ...data,
      _id: data._id || generateObjectId(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    } as unknown as T;

    items.push(doc);
    this.write(items);
    return doc;
  }

  async findByIdAndUpdate(id: string, update: Partial<T>): Promise<T | null> {
    const items = this.read();
    const idx = items.findIndex((doc) => doc._id === id);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    items[idx] = {
      ...items[idx],
      ...update,
      _id: id,
      updatedAt: now,
    };

    this.write(items);
    return items[idx];
  }

  async updateOne(filter: Record<string, any>, update: Partial<T>): Promise<boolean> {
    const items = this.read();
    const idx = items.findIndex((doc) => this.matches(doc, filter));
    if (idx === -1) return false;

    const now = new Date().toISOString();
    items[idx] = {
      ...items[idx],
      ...update,
      updatedAt: now,
    };
    this.write(items);
    return true;
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    const items = this.read();
    const idx = items.findIndex((doc) => doc._id === id);
    if (idx === -1) return null;

    const [deleted] = items.splice(idx, 1);
    this.write(items);
    return deleted;
  }

  async deleteOne(filter: Record<string, any>): Promise<boolean> {
    const items = this.read();
    const idx = items.findIndex((doc) => this.matches(doc, filter));
    if (idx === -1) return false;

    items.splice(idx, 1);
    this.write(items);
    return true;
  }

  async deleteMany(filter: Record<string, any>): Promise<number> {
    const items = this.read();
    const remaining = items.filter((doc) => !this.matches(doc, filter));
    const deletedCount = items.length - remaining.length;
    this.write(remaining);
    return deletedCount;
  }

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    const items = this.read().filter((doc) => this.matches(doc, filter));
    return items.length;
  }
}

// Database collections matching the Mongoose models requested in section 16 & 54
export const Users = new MongoCollection<any>('users');
export const Subjects = new MongoCollection<any>('subjects');
export const Enrollments = new MongoCollection<any>('enrollments');
export const AttendanceRecords = new MongoCollection<any>('attendance');
export const Assignments = new MongoCollection<any>('assignments');
export const AssignmentSubmissions = new MongoCollection<any>('submissions');
export const StudyMaterials = new MongoCollection<any>('materials');
export const Exams = new MongoCollection<any>('exams');
export const PlannerTasks = new MongoCollection<any>('planner_tasks');
export const Announcements = new MongoCollection<any>('announcements');
export const ChatMessages = new MongoCollection<any>('chat_messages');

/**
 * Seeds the initial controlled Teacher and 5 Student accounts if DB is empty
 */
export async function seedInitialDatabase() {
  const userCount = await Users.countDocuments();
  if (userCount === 0) {
    console.log('[Database] Seeding initial Faculty and 5 Student database records...');

    const salt = await bcrypt.genSalt(10);
    const teacherHash = await bcrypt.hash('faculty123', salt);
    const studentHash = await bcrypt.hash('student123', salt);

    // 1. Seed Teacher
    await Users.create({
      _id: '65f010000000000000000001',
      name: 'Prof. Rajesh Sharma',
      email: 'prof.sharma@university.edu',
      passwordHash: teacherHash,
      role: 'teacher',
      department: 'Computer Science & Engineering',
      designation: 'Associate Professor & HOD',
      avatarUrl: '',
    });

    // 2. Seed 5 demo students (starter records as specified in prompt section 5 & 21)
    const starterStudents = [
      {
        _id: '65f020000000000000000101',
        name: 'Aarav Sharma',
        email: 'student1@university.edu',
        passwordHash: studentHash,
        role: 'student',
        rollNumber: '101',
        course: 'B.Tech Computer Science',
        semester: '4',
        avatarUrl: '',
      },
      {
        _id: '65f020000000000000000102',
        name: 'Priya Patel',
        email: 'student2@university.edu',
        passwordHash: studentHash,
        role: 'student',
        rollNumber: '102',
        course: 'B.Tech Computer Science',
        semester: '4',
        avatarUrl: '',
      },
      {
        _id: '65f020000000000000000103',
        name: 'Rohan Gupta',
        email: 'student3@university.edu',
        passwordHash: studentHash,
        role: 'student',
        rollNumber: '103',
        course: 'B.Tech Computer Science',
        semester: '4',
        avatarUrl: '',
      },
      {
        _id: '65f020000000000000000104',
        name: 'Sneha Reddy',
        email: 'student4@university.edu',
        passwordHash: studentHash,
        role: 'student',
        rollNumber: '104',
        course: 'B.Tech Computer Science',
        semester: '4',
        avatarUrl: '',
      },
      {
        _id: '65f020000000000000000105',
        name: 'Vikram Singh',
        email: 'student5@university.edu',
        passwordHash: studentHash,
        role: 'student',
        rollNumber: '105',
        course: 'B.Tech Computer Science',
        semester: '4',
        avatarUrl: '',
      },
    ];

    for (const student of starterStudents) {
      await Users.create(student);
    }

    console.log('[Database] Seeded 1 Teacher and 5 Student records with real MongoDB ObjectIds.');
  }
}
