import { GoogleGenAI } from '@google/genai';
import { Subjects, Exams, Assignments, PlannerTasks, ChatMessages } from '../db/mongo.js';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface StudentAcademicContext {
  studentName: string;
  courseName?: string;
  semester?: string;
  enrolledSubjects: Array<{ name: string; code: string }>;
  upcomingExams: Array<{ title: string; subject: string; date: string; time: string; type: string }>;
  pendingAssignments: Array<{ title: string; subject: string; dueDate: string; priority: string }>;
  activeTasks: Array<{ title: string; category: string; dueDate?: string }>;
}

export async function buildStudentContext(studentId: string): Promise<StudentAcademicContext | null> {
  try {
    // 1. Enrolled subjects
    const subjects = await Subjects.find({ enrolledStudents: studentId });
    const subjectMap = new Map<string, string>();
    const enrolledSubjects = subjects.map((s: any) => {
      subjectMap.set(s._id, s.name);
      return { name: s.name, code: s.code };
    });

    const subjectIds = subjects.map((s: any) => s._id);

    // 2. Upcoming exams for these subjects
    const today = new Date().toISOString().split('T')[0];
    const allExams = await Exams.find({ subjectId: { $in: subjectIds } });
    const upcomingExams = allExams
      .filter((e: any) => e.date >= today)
      .map((e: any) => ({
        title: e.title,
        subject: subjectMap.get(e.subjectId) || 'Course',
        date: e.date,
        time: e.time,
        type: e.examType,
      }));

    // 3. Pending assignments
    const allAssignments = await Assignments.find({
      subjectId: { $in: subjectIds },
      status: 'published',
    });
    const pendingAssignments = allAssignments.map((a: any) => ({
      title: a.title,
      subject: subjectMap.get(a.subjectId) || 'Course',
      dueDate: a.dueDate,
      priority: a.priority,
    }));

    // 4. Incomplete planner tasks
    const tasks = await PlannerTasks.find({ studentId, completed: false });
    const activeTasks = tasks.map((t: any) => ({
      title: t.title,
      category: t.category,
      dueDate: t.dueDate,
    }));

    return {
      studentName: '',
      enrolledSubjects,
      upcomingExams,
      pendingAssignments,
      activeTasks,
    };
  } catch (err) {
    console.error('Error compiling student academic context:', err);
    return null;
  }
}

export async function askGeminiAssistant(
  prompt: string,
  user: any,
  academicContext: StudentAcademicContext | null
): Promise<string> {
  const ai = getAIClient();

  // Build grounded system prompt
  let systemInstruction = `You are the AI Academic Assistant for college and university students and faculty in the AI-Integrated Student Assistant platform.
Your mission is to provide rigorous, clear, conceptually accurate, and encouraging academic help.
You can help with:
- Academic concepts, derivations, and coding explanations (DBMS, Data Structures, Algorithms, OS, Computer Networks, Discrete Math, AI/ML, etc.)
- Viva voce interview preparation with sample questions & answers
- Structuring customized study plans and revision timetables
- Step-by-step problem solving
- Clarification of academic assignments and research topics

Formatting Guidelines:
- Use clean Markdown with headers (##, ###), bullet points, and code blocks with syntax highlighting where relevant.
- Keep explanations structured, scannable, and practical for university exams.
- Never invent fake grades or hallucinate exams that do not exist.
`;

  if (user.role === 'student' && academicContext) {
    systemInstruction += `\nAUTHENTICATED STUDENT ACADEMIC PROFILE:
Student Name: ${user.name}
Program/Degree: ${user.course || 'B.Tech'}
Semester: ${user.semester || 'Current'}
Enrolled Subjects (${academicContext.enrolledSubjects.length}):
${academicContext.enrolledSubjects.length > 0 ? academicContext.enrolledSubjects.map((s) => `- ${s.name} (${s.code})`).join('\n') : 'No courses assigned yet.'}

Scheduled Upcoming Exams (${academicContext.upcomingExams.length}):
${academicContext.upcomingExams.length > 0 ? academicContext.upcomingExams.map((e) => `- ${e.title} [${e.subject}] on ${e.date} (${e.time}) - Type: ${e.type}`).join('\n') : 'No upcoming exams recorded.'}

Current Published Assignments (${academicContext.pendingAssignments.length}):
${academicContext.pendingAssignments.length > 0 ? academicContext.pendingAssignments.map((a) => `- ${a.title} [${a.subject}] - Due: ${a.dueDate} (${a.priority} Priority)`).join('\n') : 'No assignments available.'}

Active Planner Tasks (${academicContext.activeTasks.length}):
${academicContext.activeTasks.length > 0 ? academicContext.activeTasks.map((t) => `- ${t.title} (${t.category})${t.dueDate ? ' Due: ' + t.dueDate : ''}`).join('\n') : 'No active planner tasks.'}

PERSONALIZATION RULES:
- When the student asks about their schedule, study plan, exams, or courses, directly utilize the above verified database data!
- If the student asks for a study plan or exam prep and they have NO upcoming exams, state clearly: "You currently have no upcoming exams recorded." Offer to help them study any subject of their choice.
- Never invent assignments, exams, or courses not listed in their profile.`;
  } else if (user.role === 'teacher') {
    systemInstruction += `\nAUTHENTICATED FACULTY PROFILE:
Faculty Name: ${user.name}
Department: ${user.department || 'Academic Department'}
Designation: ${user.designation || 'Faculty Member'}
Assist the instructor with syllabus planning, assignment prompt drafting, rubric generation, and lecture outlines.`;
  }

  // Retrieve last 6 messages from ChatMessages for multi-turn conversational context
  const recentHistory = await ChatMessages.find(
    { userId: user._id },
    { sort: { createdAt: 1 }, limit: 6 }
  );

  const contents: any[] = [];
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.message }],
    });
  }
  // Add current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastErr = null;

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents.length === 1 ? prompt : contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text;
      if (replyText) {
        return replyText;
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} returned error, trying fallback if available:`, err?.message || err);
      lastErr = err;
      // If error is high demand (503) or rate limit, continue to next model
      continue;
    }
  }

  throw lastErr || new Error('No response returned from the Gemini AI service.');
}
