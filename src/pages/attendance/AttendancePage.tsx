import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Subject, AttendanceSummary, CourseAttendanceSummary } from '../../types/index.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { Badge } from '../../components/common/Badge.js';
import { StatCard } from '../../components/common/StatCard.js';
import {
  CalendarCheck2,
  Calendar,
  Check,
  X,
  Save,
  CheckCheck,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

interface StudentAttendanceRecord {
  sessionId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  date: string;
  status: 'Present' | 'Absent';
  recordedAt: string;
}

interface RollCallStudent {
  studentId: string;
  rollNumber: string;
  studentName: string;
  email: string;
  status: 'Present' | 'Absent' | 'Not Marked';
}

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Teacher Roll-call state
  const [roster, setRoster] = useState<RollCallStudent[]>([]);
  const [isNewDate, setIsNewDate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Student Attendance View State
  const [studentSummary, setStudentSummary] = useState<AttendanceSummary | null>(null);
  const [courseSummaries, setCourseSummaries] = useState<CourseAttendanceSummary[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentAttendanceRecord[]>([]);

  useEffect(() => {
    initAttendance();
  }, []);

  const initAttendance = async () => {
    setLoading(true);
    try {
      const subRes = await api.getSubjects();
      const list = subRes.subjects || [];
      setSubjects(list);

      if (list.length > 0) {
        setSelectedSubjectId(list[0]._id);
        if (isTeacher) {
          await loadTeacherRollCall(list[0]._id, selectedDate);
        } else {
          await loadStudentAttendance();
        }
      } else {
        if (!isTeacher) {
          await loadStudentAttendance();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize attendance.');
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherRollCall = async (subjId: string, dateStr: string) => {
    setLoading(true);
    setSaveSuccess(null);
    setErrorMessage(null);
    try {
      const res = await api.getAttendance({ subjectId: subjId, date: dateStr });
      setRoster(res.roster || []);
      setIsNewDate(res.isNewDate);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load class roster for attendance.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.getAttendance();
      setStudentSummary(res.summary);
      setCourseSummaries(res.courseSummaries || []);
      setStudentRecords(res.records || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  // Teacher actions
  const handleSubjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSelectedSubjectId(sId);
    if (isTeacher) {
      await loadTeacherRollCall(sId, selectedDate);
    }
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dStr = e.target.value;
    setSelectedDate(dStr);
    if (isTeacher && selectedSubjectId) {
      await loadTeacherRollCall(selectedSubjectId, dStr);
    }
  };

  const handleSetStudentStatus = (studentId: string, status: 'Present' | 'Absent') => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
    setSaveSuccess(null);
  };

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: 'Present' })));
    setSaveSuccess(null);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSubjectId || !selectedDate) return;

    // Check if any students remain "Not Marked"
    const unmarkCount = roster.filter((r) => r.status === 'Not Marked').length;
    if (unmarkCount > 0) {
      setErrorMessage(`Please mark attendance (Present/Absent) for all ${roster.length} students. ${unmarkCount} student(s) currently Not Marked.`);
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(null);
    try {
      const res = await api.saveAttendance({
        subjectId: selectedSubjectId,
        date: selectedDate,
        records: roster,
      });
      setSaveSuccess(res.message || 'Attendance saved successfully.');
      setIsNewDate(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save attendance record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Accessing database attendance logs..." />;
  }

  // ==========================================
  // TEACHER VIEW: REAL ROLL-CALL MANAGEMENT
  // ==========================================
  if (isTeacher) {
    const presentCount = roster.filter((s) => s.status === 'Present').length;
    const absentCount = roster.filter((s) => s.status === 'Absent').length;
    const notMarkedCount = roster.filter((s) => s.status === 'Not Marked').length;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Attendance Roll-Call System
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select course and session date to record or update official student attendance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              disabled={roster.length === 0}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark All Present</span>
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={saving || roster.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>

        {/* Course & Date Picker Card */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Select Course
            </label>
            <select
              value={selectedSubjectId}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} — {s.name} ({s.enrolledCount || 0} enrolled)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Alerts */}
        {saveSuccess && (
          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Session Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Enrolled Students</span>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{roster.length}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 uppercase">Marked Present</span>
            <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">{presentCount}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60">
            <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 uppercase">Marked Absent</span>
            <p className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300 mt-0.5">{absentCount}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 uppercase">Not Marked Yet</span>
            <p className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-0.5">{notMarkedCount}</p>
          </div>
        </div>

        {/* Student Roll-Call Table */}
        {roster.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Student Roll Call Roster ({isNewDate ? 'New Session — Default: Not Marked' : 'Recorded Session'})
              </span>
              <span className="text-xs font-mono text-slate-400">
                Date: {selectedDate}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold font-mono w-24">Roll No</th>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold text-center w-36">Current Status</th>
                    <th className="py-3 px-4 font-semibold text-right w-48">Mark Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {roster.map((student) => {
                    const isPresent = student.status === 'Present';
                    const isAbsent = student.status === 'Absent';
                    const isNotMarked = student.status === 'Not Marked';

                    return (
                      <tr
                        key={student.studentId}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {student.rollNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {student.studentName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {student.email}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={
                              isPresent ? 'success' : isAbsent ? 'danger' : 'warning'
                            }
                            size="sm"
                          >
                            {student.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.studentId, 'Present')}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                                isPresent
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.studentId, 'Absent')}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                                isAbsent
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Click "Save Attendance" above to commit records to MongoDB database.
              </span>
              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={CalendarCheck2}
            title="No students enrolled in this course"
            description="Assign students to this course in the Course Management tab to record attendance."
          />
        )}
      </div>
    );
  }

  // ==========================================
  // STUDENT VIEW: ACCURATE RECORDED ATTENDANCE
  // ==========================================
  const summary = studentSummary || { total: 0, present: 0, absent: 0, percentage: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          My Academic Attendance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Verified lecture attendance records entered and verified by course instructors
        </p>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance Rate"
          value={`${summary.percentage}%`}
          subtitle={
            summary.total > 0
              ? `${summary.present} attended out of ${summary.total} sessions`
              : 'No recorded sessions yet'
          }
          icon={CalendarCheck2}
          variant={summary.percentage >= 75 ? 'emerald' : summary.total === 0 ? 'slate' : 'amber'}
        />
        <StatCard
          title="Total Recorded Lectures"
          value={summary.total}
          subtitle="Classes conducted by faculty"
          icon={Calendar}
          variant="blue"
        />
        <StatCard
          title="Sessions Attended"
          value={summary.present}
          subtitle="Present days marked"
          icon={Check}
          variant="emerald"
        />
        <StatCard
          title="Sessions Missed"
          value={summary.absent}
          subtitle="Absences recorded"
          icon={X}
          variant="amber"
        />
      </div>

      {/* Course Breakdown */}
      {courseSummaries.length > 0 && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Course-by-Course Attendance Breakdown
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseSummaries.map((cs) => (
              <div
                key={cs.subjectId}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                    {cs.subjectCode}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                    {cs.subjectName}
                  </h4>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 dark:text-slate-400">
                    {cs.present} / {cs.total} classes
                  </span>
                  <span
                    className={`font-bold ${
                      cs.percentage >= 75
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : cs.total === 0
                        ? 'text-slate-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {cs.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date-by-Date Attendance Log */}
      {studentRecords.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recorded Lecture Log ({studentRecords.length} sessions)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Database verified records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold font-mono">Date</th>
                  <th className="py-3 px-4 font-semibold font-mono">Course Code</th>
                  <th className="py-3 px-4 font-semibold">Course Title</th>
                  <th className="py-3 px-4 font-semibold text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {studentRecords.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {rec.date}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      {rec.subjectCode}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {rec.subjectName}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant={rec.status === 'Present' ? 'success' : 'danger'} size="sm">
                        {rec.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={CalendarCheck2}
          title="No attendance records available yet"
          description="Your instructors have not recorded attendance for your enrolled courses yet. When your teacher records a roll-call session, your attendance percentage and dates will appear here."
        />
      )}
    </div>
  );
};
