import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { TeacherProgress, Subject, AttendanceSession } from '../../types/index.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import {
  BookOpen,
  Users,
  CalendarCheck2,
  FileText,
  GraduationCap,
  Megaphone,
  Plus,
  ArrowRight,
  Upload,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface TeacherDashboardProps {
  onNavigate: (tabId: string, contextId?: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<TeacherProgress | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [progRes, subRes] = await Promise.all([
        api.getProgress(),
        api.getSubjects(),
      ]);
      setProgress(progRes);
      setSubjects(subRes.subjects || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load faculty dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading faculty portal records..." />;
  }

  const metrics = progress?.metrics || {
    totalCourses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    pendingSubmissionsToGrade: 0,
    upcomingExamsCount: 0,
    totalAnnouncements: 0,
  };

  return (
    <div className="space-y-6">
      {/* Faculty Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-indigo-300 uppercase tracking-wider">
                Faculty Administration & Instruction
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome, {user?.name}
            </h1>
            <p className="text-xs text-indigo-200/80 mt-1">
              {user?.designation || 'Faculty Member'} · {user?.department || 'Department of Computer Science'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate('attendance')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Mark Roll-Call</span>
            </button>
            <button
              onClick={() => onNavigate('assignments')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Assignment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Active Classes"
          value={metrics.totalCourses}
          subtitle="Courses taught by you"
          icon={BookOpen}
          variant="blue"
          onClick={() => onNavigate('subjects')}
        />
        <StatCard
          title="Total Students"
          value={metrics.totalStudents}
          subtitle="Enrolled across courses"
          icon={Users}
          variant="purple"
          onClick={() => onNavigate('students')}
        />
        <StatCard
          title="Awaiting Grading"
          value={metrics.pendingSubmissionsToGrade}
          subtitle="Student submissions"
          icon={FileText}
          variant={metrics.pendingSubmissionsToGrade > 0 ? 'amber' : 'emerald'}
          onClick={() => onNavigate('assignments')}
        />
        <StatCard
          title="Upcoming Exams"
          value={metrics.upcomingExamsCount}
          subtitle="Scheduled sessions"
          icon={GraduationCap}
          variant="slate"
          onClick={() => onNavigate('exams')}
        />
        <StatCard
          title="Announcements"
          value={metrics.totalAnnouncements}
          subtitle="Course broadcast notices"
          icon={Megaphone}
          variant="blue"
          onClick={() => onNavigate('announcements')}
        />
      </div>

      {/* Quick Actions Panel */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Faculty Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => onNavigate('attendance')}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-800 transition-colors text-center group"
          >
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-1.5 group-hover:scale-105 transition-transform">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Roll-Call</span>
            <span className="text-[10px] text-slate-400">Take attendance</span>
          </button>

          <button
            onClick={() => onNavigate('assignments')}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors text-center group"
          >
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-1.5 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Assignment</span>
            <span className="text-[10px] text-slate-400">Publish task</span>
          </button>

          <button
            onClick={() => onNavigate('materials')}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-800 transition-colors text-center group"
          >
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mb-1.5 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Material</span>
            <span className="text-[10px] text-slate-400">Upload notes/PDF</span>
          </button>

          <button
            onClick={() => onNavigate('exams')}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-800 transition-colors text-center group"
          >
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mb-1.5 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Schedule Exam</span>
            <span className="text-[10px] text-slate-400">Midterm & Final</span>
          </button>

          <button
            onClick={() => onNavigate('announcements')}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-300 dark:hover:border-amber-800 transition-colors text-center group"
          >
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-1.5 group-hover:scale-105 transition-transform">
              <Megaphone className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Announcement</span>
            <span className="text-[10px] text-slate-400">Broadcast notice</span>
          </button>
        </div>
      </div>

      {/* My Courses Section */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Assigned Courses & Roster Overview
            </h3>
          </div>
          <button
            onClick={() => onNavigate('subjects')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
          >
            <span>Manage Courses</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj) => (
              <div
                key={subj._id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                      {subj.code}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                      {subj.enrolledCount || 0} Students
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {subj.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {subj.description || 'Core departmental academic course.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onNavigate('attendance')}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Take Attendance
                  </button>
                  <button
                    onClick={() => onNavigate('subjects', subj._id)}
                    className="font-medium text-slate-600 dark:text-slate-300 hover:underline"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No courses created yet"
            description="Create your first academic course, add course code, and enroll students to get started."
            actionText="Create Course"
            onAction={() => onNavigate('subjects')}
          />
        )}
      </div>
    </div>
  );
};
