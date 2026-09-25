import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  Assignments,
  AssignmentSubmissions,
  Subjects,
  Users,
} from '../db/mongo.js';

export async function getAssignments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { subjectId, status } = req.query;

    if (user.role === 'student') {
      // RULE: Student sees ONLY published assignments for subjects they are enrolled in!
      const enrolledSubjects = await Subjects.find({ enrolledStudents: user._id });
      const enrolledSubjIds = enrolledSubjects.map((s: any) => s._id);

      if (enrolledSubjIds.length === 0) {
        res.json({ assignments: [] });
        return;
      }

      const filter: Record<string, any> = {
        subjectId: { $in: enrolledSubjIds },
        status: 'published', // NEVER return draft to student
      };

      if (subjectId && enrolledSubjIds.includes(String(subjectId))) {
        filter.subjectId = String(subjectId);
      }

      const assignments = await Assignments.find(filter, { sort: { dueDate: 1 } });

      // Build subject map
      const subjMap = new Map<string, { name: string; code: string }>();
      enrolledSubjects.forEach((s: any) => subjMap.set(s._id, { name: s.name, code: s.code }));

      // Attach student's submission status for each assignment
      const studentSubmissions = await AssignmentSubmissions.find({ studentId: user._id });
      const subMap = new Map<string, any>();
      studentSubmissions.forEach((sub: any) => subMap.set(sub.assignmentId, sub));

      const enriched = assignments.map((a: any) => {
        const mySub = subMap.get(a._id);
        const subjInfo = subjMap.get(a.subjectId) || { name: 'Course', code: '' };
        let studentStatus = 'Not Submitted';
        if (mySub) {
          studentStatus = mySub.status || 'Submitted';
        }

        return {
          ...a,
          subjectName: subjInfo.name,
          subjectCode: subjInfo.code,
          mySubmission: mySub || null,
          submissionStatus: studentStatus,
        };
      });

      res.json({ assignments: enriched });
      return;
    }

    // Teacher view:
    const teacherSubjects = await Subjects.find({ teacherId: user._id });
    const teacherSubjIds = teacherSubjects.map((s: any) => s._id);

    const filter: Record<string, any> = {
      subjectId: { $in: teacherSubjIds },
    };

    if (subjectId) {
      filter.subjectId = String(subjectId);
    }
    if (status) {
      filter.status = String(status);
    }

    const assignments = await Assignments.find(filter, { sort: { createdAt: -1 } });

    const subjMap = new Map<string, { name: string; code: string; enrolledCount: number }>();
    teacherSubjects.forEach((s: any) => {
      subjMap.set(s._id, {
        name: s.name,
        code: s.code,
        enrolledCount: Array.isArray(s.enrolledStudents) ? s.enrolledStudents.length : 0,
      });
    });

    // Attach submission counts
    const enriched = await Promise.all(
      assignments.map(async (a: any) => {
        const subCount = await AssignmentSubmissions.countDocuments({ assignmentId: a._id });
        const reviewedCount = await AssignmentSubmissions.countDocuments({
          assignmentId: a._id,
          status: 'Reviewed',
        });
        const subjInfo = subjMap.get(a.subjectId) || { name: 'Course', code: '', enrolledCount: 0 };
        return {
          ...a,
          subjectName: subjInfo.name,
          subjectCode: subjInfo.code,
          enrolledCount: subjInfo.enrolledCount,
          submissionCount: subCount,
          reviewedCount,
        };
      })
    );

    res.json({ assignments: enriched });
  } catch (err) {
    console.error('getAssignments error:', err);
    res.status(500).json({ error: 'Failed to retrieve assignments.' });
  }
}

export async function getAssignmentById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const assignment = await Assignments.findById(id);

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }

    const subject = await Subjects.findById(assignment.subjectId);
    if (!subject) {
      res.status(404).json({ error: 'Associated course not found.' });
      return;
    }

    const user = req.user;
    if (user.role === 'student') {
      const isEnrolled = Array.isArray(subject.enrolledStudents) && subject.enrolledStudents.includes(user._id);
      if (!isEnrolled || assignment.status !== 'published') {
        res.status(403).json({ error: 'Access denied. You cannot view this assignment.' });
        return;
      }

      const mySubmission = await AssignmentSubmissions.findOne({
        assignmentId: assignment._id,
        studentId: user._id,
      });

      res.json({
        assignment: {
          ...assignment,
          subjectName: subject.name,
          subjectCode: subject.code,
          mySubmission,
        },
      });
      return;
    }

    // Teacher
    const submissionCount = await AssignmentSubmissions.countDocuments({ assignmentId: assignment._id });
    res.json({
      assignment: {
        ...assignment,
        subjectName: subject.name,
        subjectCode: subject.code,
        submissionCount,
      },
    });
  } catch (err) {
    console.error('getAssignmentById error:', err);
    res.status(500).json({ error: 'Failed to retrieve assignment details.' });
  }
}

export async function createAssignment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, subjectId, dueDate, priority, status, totalMarks } = req.body;

    if (!title || !subjectId || !dueDate) {
      res.status(400).json({ error: 'Assignment title, course, and due date are required.' });
      return;
    }

    const subject = await Subjects.findById(subjectId);
    if (!subject) {
      res.status(404).json({ error: 'Selected course not found.' });
      return;
    }

    if (subject.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not the instructor for this course.' });
      return;
    }

    let attachmentUrl = '';
    let attachmentOriginalName = '';
    let attachmentSize = 0;

    if (req.file) {
      attachmentUrl = `/api/files/${req.file.filename}`;
      attachmentOriginalName = req.file.originalname;
      attachmentSize = req.file.size;
    }

    const assignment = await Assignments.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      subjectId,
      teacherId: req.user._id,
      dueDate,
      priority: priority || 'Medium',
      status: status === 'published' ? 'published' : 'draft',
      totalMarks: Number(totalMarks) || 100,
      attachmentUrl,
      attachmentOriginalName,
      attachmentSize,
    });

    const isPublished = assignment.status === 'published';
    res.status(201).json({
      message: isPublished ? 'Assignment published successfully.' : 'Assignment saved as draft.',
      assignment,
    });
  } catch (err) {
    console.error('createAssignment error:', err);
    res.status(500).json({ error: 'Failed to create assignment.' });
  }
}

export async function updateAssignment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description, dueDate, priority, status, totalMarks } = req.body;

    const assignment = await Assignments.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }

    if (assignment.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not authorized to edit this assignment.' });
      return;
    }

    const updateData: Record<string, any> = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (dueDate) updateData.dueDate = dueDate;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;
    if (totalMarks !== undefined) updateData.totalMarks = Number(totalMarks);

    if (req.file) {
      updateData.attachmentUrl = `/api/files/${req.file.filename}`;
      updateData.attachmentOriginalName = req.file.originalname;
      updateData.attachmentSize = req.file.size;
    }

    const updated = await Assignments.findByIdAndUpdate(id, updateData);
    res.json({
      message: updated.status === 'published' ? 'Assignment published successfully.' : 'Assignment updated.',
      assignment: updated,
    });
  } catch (err) {
    console.error('updateAssignment error:', err);
    res.status(500).json({ error: 'Failed to update assignment.' });
  }
}

export async function deleteAssignment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const assignment = await Assignments.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }

    if (assignment.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not authorized to delete this assignment.' });
      return;
    }

    await Assignments.findByIdAndDelete(id);
    await AssignmentSubmissions.deleteMany({ assignmentId: id });

    res.json({ message: 'Assignment and all student submissions deleted successfully.' });
  } catch (err) {
    console.error('deleteAssignment error:', err);
    res.status(500).json({ error: 'Failed to delete assignment.' });
  }
}

export async function submitAssignment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const assignment = await Assignments.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }

    if (assignment.status !== 'published') {
      res.status(400).json({ error: 'This assignment is not accepting submissions.' });
      return;
    }

    // Verify student enrollment
    const subject = await Subjects.findById(assignment.subjectId);
    if (!subject || !Array.isArray(subject.enrolledStudents) || !subject.enrolledStudents.includes(req.user._id)) {
      res.status(403).json({ error: 'You are not enrolled in the course for this assignment.' });
      return;
    }

    if (!req.file && !notes) {
      res.status(400).json({ error: 'Please upload a submission file or provide submission notes.' });
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

    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isLate = now > dueDate;
    const submissionStatus = isLate ? 'Late' : 'Submitted';

    // Check if previous submission exists (allow re-submission)
    const existing = await AssignmentSubmissions.findOne({
      assignmentId: id,
      studentId: req.user._id,
    });

    let submission;
    if (existing) {
      submission = await AssignmentSubmissions.findByIdAndUpdate(existing._id, {
        fileUrl: fileUrl || existing.fileUrl,
        fileOriginalName: fileOriginalName || existing.fileOriginalName,
        fileSize: fileSize || existing.fileSize,
        submissionNotes: notes !== undefined ? notes.trim() : existing.submissionNotes,
        submittedAt: now.toISOString(),
        status: submissionStatus,
      });
    } else {
      submission = await AssignmentSubmissions.create({
        assignmentId: id,
        studentId: req.user._id,
        fileUrl,
        fileOriginalName,
        fileSize,
        submissionNotes: notes ? notes.trim() : '',
        submittedAt: now.toISOString(),
        status: submissionStatus,
        marks: null,
        feedback: '',
      });
    }

    res.status(201).json({
      message: isLate ? 'Assignment submitted (marked Late).' : 'Assignment submitted successfully!',
      submission,
    });
  } catch (err) {
    console.error('submitAssignment error:', err);
    res.status(500).json({ error: 'Failed to upload assignment submission.' });
  }
}

export async function getSubmissions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const assignment = await Assignments.findById(id);

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found.' });
      return;
    }

    const user = req.user;

    if (user.role === 'student') {
      const mySubmission = await AssignmentSubmissions.findOne({
        assignmentId: id,
        studentId: user._id,
      });
      res.json({ submissions: mySubmission ? [mySubmission] : [] });
      return;
    }

    // Teacher
    const submissions = await AssignmentSubmissions.find({ assignmentId: id });

    // Enrich with student details
    const studentIds = submissions.map((s: any) => s.studentId);
    const students = await Users.find({ _id: { $in: studentIds } });
    const studentMap = new Map<string, any>();
    students.forEach((s: any) => studentMap.set(s._id, s));

    const enriched = submissions.map((sub: any) => {
      const st = studentMap.get(sub.studentId) || {};
      return {
        ...sub,
        studentName: st.name || 'Unknown Student',
        studentEmail: st.email || '',
        studentRollNumber: st.rollNumber || 'N/A',
      };
    });

    res.json({ submissions: enriched });
  } catch (err) {
    console.error('getSubmissions error:', err);
    res.status(500).json({ error: 'Failed to retrieve assignment submissions.' });
  }
}

export async function gradeSubmission(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    const submission = await AssignmentSubmissions.findById(submissionId);
    if (!submission) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }

    const assignment = await Assignments.findById(submission.assignmentId);
    if (!assignment || assignment.teacherId !== req.user._id) {
      res.status(403).json({ error: 'Forbidden. You are not authorized to grade this submission.' });
      return;
    }

    const updated = await AssignmentSubmissions.findByIdAndUpdate(submissionId, {
      marks: Number(marks),
      feedback: feedback ? feedback.trim() : '',
      status: 'Reviewed',
      reviewedAt: new Date().toISOString(),
    });

    res.json({
      message: 'Submission graded successfully.',
      submission: updated,
    });
  } catch (err) {
    console.error('gradeSubmission error:', err);
    res.status(500).json({ error: 'Failed to grade submission.' });
  }
}
