import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { StudentProgress } from '../../types/index.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { StatCard } from '../../components/common/StatCard.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { Badge } from '../../components/common/Badge.js';
import {
  LineChart,
  CalendarCheck2,
  FileText,
  GraduationCap,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const res = await api.getProgress();
      setProgress(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Calculating academic performance metrics..." />;
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

  const hasData = progress?.hasData ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Academic Progress Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time metrics computed directly from institutional lecture logs, assignment turn-ins, and exams
        </p>
      </div>

      {!hasData ? (
        <EmptyState
          icon={LineChart}
          title="Not enough data to calculate metrics yet"
          description="Once your faculty assigns you to courses, records lecture attendance, and publishes assignments, your academic progress metrics will appear here."
        />
      ) : (
        <>
          {/* Main Key Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Attendance Rate"
              value={`${metrics.attendanceRate}%`}
              subtitle={
                metrics.totalClasses > 0
                  ? `${metrics.attendedClasses} attended / ${metrics.totalClasses} classes`
                  : 'No attendance marked yet'
              }
              icon={CalendarCheck2}
              variant={metrics.attendanceRate >= 75 ? 'emerald' : 'amber'}
            />
            <StatCard
              title="Assignment Completion"
              value={`${metrics.assignmentCompletionRate}%`}
              subtitle={
                metrics.totalAssignments > 0
                  ? `${metrics.submittedAssignments} of ${metrics.totalAssignments} turned in`
                  : 'No assignments assigned yet'
              }
              icon={FileText}
              variant={metrics.assignmentCompletionRate >= 75 ? 'emerald' : 'blue'}
            />
            <StatCard
              title="Scheduled Exams"
              value={metrics.upcomingExamsCount}
              subtitle="Upcoming evaluation dates"
              icon={GraduationCap}
              variant="purple"
            />
            <StatCard
              title="Study Goal Completion"
              value={`${metrics.plannerCompletionRate}%`}
              subtitle={`${metrics.completedTasksCount} of ${metrics.totalTasksCount} tasks finished`}
              icon={CalendarDays}
              variant="slate"
            />
          </div>

          {/* Detailed Progress Bars & Visual Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Health Gauge */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Attendance Criterion (Min. 75% Required)
                  </h3>
                </div>
                <Badge
                  variant={metrics.attendanceRate >= 75 ? 'success' : 'warning'}
                  size="sm"
                >
                  {metrics.attendanceRate >= 75 ? 'Eligible' : 'Attendance Shortage'}
                </Badge>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Current Standing</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {metrics.attendanceRate}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metrics.attendanceRate >= 75
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-amber-500 dark:bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(metrics.attendanceRate, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                  <span>0%</span>
                  <span>75% Target Threshold</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 uppercase">Conducted</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{metrics.totalClasses}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30">
                  <span className="text-[10px] text-emerald-600 uppercase">Attended</span>
                  <p className="font-bold text-emerald-600">{metrics.attendedClasses}</p>
                </div>
                <div className="p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/30">
                  <span className="text-[10px] text-rose-600 uppercase">Missed</span>
                  <p className="font-bold text-rose-600">{metrics.absentClasses}</p>
                </div>
              </div>
            </div>

            {/* Coursework Turn-in Health */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Assignment Submission Pace
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {metrics.assignmentCompletionRate}% Turned In
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Completion Ratio</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {metrics.submittedAssignments} / {metrics.totalAssignments}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                    style={{ width: `${Math.min(metrics.assignmentCompletionRate, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-center text-xs font-mono">
                <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30">
                  <span className="text-[10px] text-emerald-600 uppercase">Submitted</span>
                  <p className="font-bold text-emerald-600">{metrics.submittedAssignments}</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/30">
                  <span className="text-[10px] text-amber-600 uppercase">Pending Review</span>
                  <p className="font-bold text-amber-600">{metrics.pendingAssignments}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
