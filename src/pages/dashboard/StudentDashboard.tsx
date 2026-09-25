import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { StudentProgress, Announcement, Exam, Assignment } from '../../types/index.js';
import { StatCard } from '../../components/common/StatCard.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Badge } from '../../components/common/Badge.js';
import {
  BookOpen,
  CalendarCheck2,
  FileText,
  GraduationCap,
  CalendarDays,
  Bot,
  Megaphone,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [progRes, annRes] = await Promise.all([
        api.getProgress(),
        api.getAnnouncements(),
      ]);
      setProgress(progRes);
      setAnnouncements(annRes.announcements || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load student dashboard records.');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving your academic records from database..." />;
  }

  const metrics = progress?.metrics || {
    totalCourses: 0,
    attendanceRate: 0,
    totalClasses: 0,
    attendedClasses: 0,
    absentClasses: 0,
    totalAssignments: 0,
    submittedAssignments: 0,
    pendingAssignments: 0,
    assignmentCompletionRate: 0,
    upcomingExamsCount: 0,
    completedTasksCount: 0,
    totalTasksCount: 0,
    plannerCompletionRate: 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-blue-200 tracking-wider uppercase">
                Student Academic Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {getGreeting()}, {user?.name}
            </h1>
            <p className="text-xs text-blue-100/80 mt-1">
              {user?.course || 'Degree Program'} · Semester {user?.semester || '4'} · Roll No:{' '}
              <span className="font-mono font-semibold">{user?.rollNumber || 'N/A'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => onNavigate('ai-assistant')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 backdrop-blur-xs transition-colors"
            >
              <Bot className="w-4 h-4 text-indigo-300" />
              <span>Ask AI Tutor</span>
            </button>
            <button
              onClick={() => onNavigate('subjects')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 rounded-lg shadow-xs transition-colors"
            >
              <span>My Subjects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Courses"
          value={metrics.totalCourses}
          subtitle={metrics.totalCourses > 0 ? 'Enrolled subjects' : 'No courses assigned'}
          icon={BookOpen}
          variant="blue"
          onClick={() => onNavigate('subjects')}
        />
        <StatCard
          title="Attendance Rate"
          value={`${metrics.attendanceRate}%`}
          subtitle={`${metrics.attendedClasses} attended / ${metrics.totalClasses} total`}
          icon={CalendarCheck2}
          variant={metrics.attendanceRate >= 75 ? 'emerald' : 'amber'}
          onClick={() => onNavigate('attendance')}
        />
        <StatCard
          title="Pending Assignments"
          value={metrics.pendingAssignments}
          subtitle={`${metrics.submittedAssignments} of ${metrics.totalAssignments} completed`}
          icon={FileText}
          variant={metrics.pendingAssignments === 0 ? 'emerald' : 'amber'}
          onClick={() => onNavigate('assignments')}
        />
        <StatCard
          title="Upcoming Exams"
          value={metrics.upcomingExamsCount}
          subtitle={metrics.upcomingExamsCount > 0 ? 'Scheduled in your courses' : 'No exams scheduled'}
          icon={GraduationCap}
          variant="purple"
          onClick={() => onNavigate('exams')}
        />
      </div>

      {/* Two Column Layout: Urgent Items + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Actionable Academic Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Assignments Widget */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Assignments Requiring Attention
                </h3>
              </div>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {progress?.pendingAssignmentsList && progress.pendingAssignmentsList.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {progress.pendingAssignmentsList.map((item) => (
                  <div key={item._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Due: {item.dueDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          item.priority === 'High' ? 'danger' : item.priority === 'Medium' ? 'warning' : 'neutral'
                        }
                        size="sm"
                      >
                        {item.priority}
                      </Badge>
                      <button
                        onClick={() => onNavigate('assignments')}
                        className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No pending assignments"
                description={
                  metrics.totalCourses === 0
                    ? 'You have not been assigned to any courses yet.'
                    : 'You are all caught up! No assignments are currently pending submission.'
                }
              />
            )}
          </div>

          {/* Upcoming Exams Widget */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Scheduled Examination Timeline
                </h3>
              </div>
              <button
                onClick={() => onNavigate('exams')}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Full Schedule</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {progress?.recentExams && progress.recentExams.length > 0 ? (
              <div className="space-y-2.5">
                {progress.recentExams.map((exam) => (
                  <div
                    key={exam._id}
                    className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{exam.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {exam.subjectName || 'Course'} · Room: {exam.roomNumber || 'Exam Hall'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">{exam.date}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{exam.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="No upcoming exams"
                description={
                  metrics.totalCourses === 0
                    ? 'No courses enrolled yet.'
                    : 'No examinations have been scheduled by your instructors yet.'
                }
              />
            )}
          </div>
        </div>

        {/* Right 1 Col: Course Announcements & AI Quick Assist */}
        <div className="space-y-6">
          {/* AI Helper Teaser Card */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200/80 dark:border-indigo-900/50">
            <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Gemini Academic Assistant</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Have questions about your courses or need a personalized exam study plan?
            </p>
            <div className="space-y-1.5 mb-3">
              {[
                'Create a study plan for my courses',
                'Explain Normalization in DBMS with examples',
                'Give me 10 viva questions on Data Structures',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate('ai-assistant')}
                  className="w-full text-left p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-700 dark:text-slate-200 truncate transition-colors"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
            <button
              onClick={() => onNavigate('ai-assistant')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Open AI Assistant</span>
            </button>
          </div>

          {/* Announcements Feed */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Course Announcements
              </h3>
            </div>

            {announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.slice(0, 4).map((ann) => (
                  <div
                    key={ann._id}
                    className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {ann.title}
                      </span>
                      {ann.priority && ann.priority !== 'Normal' && (
                        <Badge variant={ann.priority === 'Urgent' ? 'danger' : 'warning'} size="sm">
                          {ann.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {ann.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                      <span>{ann.subjectName}</span>
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
                  metrics.totalCourses === 0
                    ? 'No courses enrolled yet.'
                    : 'Your instructors have not posted any announcements for your courses.'
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
