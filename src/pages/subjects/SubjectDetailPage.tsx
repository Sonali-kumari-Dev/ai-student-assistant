import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  Subject,
  Assignment,
  StudyMaterial,
  Exam,
  Announcement,
} from '../../types/index.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  FolderArchive,
  GraduationCap,
  CalendarCheck2,
  Megaphone,
  Users,
  Download,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SubjectDetailPageProps {
  subjectId: string;
  onBack: () => void;
  onNavigateToTab?: (tab: string, contextId?: string) => void;
}

export const SubjectDetailPage: React.FC<SubjectDetailPageProps> = ({
  subjectId,
  onBack,
  onNavigateToTab,
}) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [subject, setSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'assignments' | 'materials' | 'exams' | 'attendance' | 'announcements' | 'students'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourseAll();
  }, [subjectId]);

  const loadCourseAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subjRes, assignRes, matRes, examRes, annRes, attRes] = await Promise.all([
        api.getSubjectById(subjectId),
        api.getAssignments({ subjectId }),
        api.getMaterials({ subjectId }),
        api.getExams({ subjectId }),
        api.getAnnouncements({ subjectId }),
        api.getAttendance({ subjectId }),
      ]);

      setSubject(subjRes.subject);
      setAssignments(assignRes.assignments || []);
      setMaterials(matRes.materials || []);
      setExams(examRes.exams || []);
      setAnnouncements(annRes.announcements || []);
      setAttendanceData(attRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving course records and syllabus..." />;
  }

  if (error || !subject) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </button>
        <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
          {error || 'Course not found or access denied.'}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'assignments', label: `Assignments (${assignments.length})`, icon: FileText },
    { id: 'materials', label: `Materials (${materials.length})`, icon: FolderArchive },
    { id: 'exams', label: `Exams (${exams.length})`, icon: GraduationCap },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck2 },
    { id: 'announcements', label: `Announcements (${announcements.length})`, icon: Megaphone },
    ...(isTeacher ? [{ id: 'students', label: `Enrolled Students (${subject.students?.length || 0})`, icon: Users }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>← Back to All Courses</span>
      </button>

      {/* Course Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              {subject.code}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Instructor: {subject.teacherName || 'Faculty Member'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {subject.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {subject.description || 'Core academic syllabus course for computer engineering.'}
          </p>
        </div>

        {isTeacher && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab?.('attendance')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Mark Attendance</span>
            </button>
          </div>
        )}
      </div>

      {/* Course Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <nav className="flex items-center gap-2 min-w-max pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Course Syllabus & Description
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {subject.description || 'No detailed syllabus description provided.'}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 uppercase font-medium">Assignments</span>
                <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {assignments.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 uppercase font-medium">Materials</span>
                <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {materials.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 uppercase font-medium">Exams</span>
                <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {exams.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 uppercase font-medium">Notices</span>
                <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {announcements.length}
                </p>
              </div>
            </div>
          </div>

          {/* Instructor & Class Meta */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Faculty Instructor
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  {subject.teacherName ? subject.teacherName.charAt(0) : 'F'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {subject.teacherName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {subject.teacherEmail || 'faculty@university.edu'}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance Summary for this Course */}
            {!isTeacher && attendanceData?.summary && (
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  My Course Attendance
                </h3>
                <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                  {attendanceData.summary.percentage}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {attendanceData.summary.present} present out of {attendanceData.summary.total} recorded sessions
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge
                        variant={
                          assignment.priority === 'High'
                            ? 'danger'
                            : assignment.priority === 'Medium'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {assignment.priority} Priority
                      </Badge>
                      {assignment.status === 'draft' && (
                        <Badge variant="neutral" size="sm">
                          Draft
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {assignment.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {assignment.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {assignment.dueDate}</span>
                    </div>

                    <button
                      onClick={() => onNavigateToTab?.('assignments', assignment._id)}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {isTeacher ? 'Manage Task →' : 'View & Submit →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No assignments have been published for this course yet"
              description={
                isTeacher
                  ? 'Create an assignment for this class to test submissions, grading, and deadlines.'
                  : 'Your instructor has not published any assignments for this course.'
              }
              actionText={isTeacher ? 'Create Assignment' : undefined}
              onAction={isTeacher ? () => onNavigateToTab?.('assignments') : undefined}
            />
          )}
        </div>
      )}

      {/* 3. STUDY MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((mat) => (
                <div
                  key={mat._id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="purple" size="sm">
                        {mat.fileType || 'Document'}
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {mat.fileSize ? `${Math.round(mat.fileSize / 1024)} KB` : ''}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {mat.title}
                    </h4>
                    {mat.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {mat.description}
                      </p>
                    )}
                  </div>

                  {mat.fileUrl ? (
                    <a
                      href={mat.fileUrl}
                      download={mat.fileOriginalName || 'material'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderArchive}
              title="No materials have been uploaded yet"
              description={
                isTeacher
                  ? 'Upload lecture slides, notes, or PDFs for this class.'
                  : 'Your instructor has not uploaded any study materials or lecture notes yet.'
              }
              actionText={isTeacher ? 'Upload Study Material' : undefined}
              onAction={isTeacher ? () => onNavigateToTab?.('materials') : undefined}
            />
          )}
        </div>
      )}

      {/* 4. EXAMS */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          {exams.length > 0 ? (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam._id}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="purple" size="sm">
                        {exam.examType}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Room: {exam.roomNumber}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {exam.description}
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                      {exam.date}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {exam.time}
                    </p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                      Max Marks: {exam.totalMarks}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={GraduationCap}
              title="No exams scheduled yet"
              description={
                isTeacher
                  ? 'Schedule midterm, quiz, practical, or final examinations for this course.'
                  : 'No examinations have been scheduled for this course.'
              }
              actionText={isTeacher ? 'Schedule Exam' : undefined}
              onAction={isTeacher ? () => onNavigateToTab?.('exams') : undefined}
            />
          )}
        </div>
      )}

      {/* 5. ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {!isTeacher ? (
            // Student View of Course Attendance
            <div>
              {attendanceData?.records && attendanceData.records.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Attendance History Log
                    </h3>
                    <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {attendanceData.summary.percentage}% Present
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {attendanceData.records.map((rec: any, idx: number) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {rec.date}
                        </span>
                        <Badge variant={rec.status === 'Present' ? 'success' : 'danger'} size="sm">
                          {rec.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={CalendarCheck2}
                  title="No attendance records yet"
                  description="Your instructor has not recorded attendance for this course yet."
                />
              )}
            </div>
          ) : (
            // Teacher quick button to roll-call
            <div className="p-6 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <CalendarCheck2 className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Attendance Management
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Record today's roll-call, edit past dates, or view attendance statistics for {subject.name}.
              </p>
              <button
                onClick={() => onNavigateToTab?.('attendance')}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                Open Attendance Roll-Call
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {ann.title}
                    </h3>
                    {ann.priority && ann.priority !== 'Normal' && (
                      <Badge variant={ann.priority === 'Urgent' ? 'danger' : 'warning'} size="sm">
                        {ann.priority}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {ann.message}
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Posted by: {ann.authorName || 'Instructor'}</span>
                    <span>{ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              description={
                isTeacher
                  ? 'Post your first course broadcast announcement for students in this class.'
                  : 'No notices or announcements have been posted for this course yet.'
              }
              actionText={isTeacher ? 'Post Announcement' : undefined}
              onAction={isTeacher ? () => onNavigateToTab?.('announcements') : undefined}
            />
          )}
        </div>
      )}

      {/* 7. ENROLLED STUDENTS (TEACHER VIEW) */}
      {activeTab === 'students' && isTeacher && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Enrolled Student Roster ({subject.students?.length || 0})
            </h3>
          </div>
          {subject.students && subject.students.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subject.students.map((st) => (
                <div key={st._id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {st.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Roll: {st.rollNumber} · {st.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {st.course || 'B.Tech'} - Sem {st.semester || '4'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-6 text-center text-xs text-slate-500">No students are currently enrolled in this course.</p>
          )}
        </div>
      )}
    </div>
  );
};
