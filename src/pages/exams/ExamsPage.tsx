import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Exam, Subject } from '../../types/index.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { Badge } from '../../components/common/Badge.js';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Award,
  AlertCircle,
} from 'lucide-react';

export const ExamsPage: React.FC = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('all');

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM - 01:00 PM');
  const [examType, setExamType] = useState<'Midterm' | 'Final' | 'Quiz' | 'Practical' | 'Viva'>('Midterm');
  const [roomNumber, setRoomNumber] = useState('Examination Hall A-204');
  const [totalMarks, setTotalMarks] = useState('100');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [examRes, subRes] = await Promise.all([
        api.getExams(),
        api.getSubjects(),
      ]);
      setExams(examRes.exams || []);
      setSubjects(subRes.subjects || []);
      if (subRes.subjects?.length > 0) {
        setSubjectId(subRes.subjects[0]._id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    try {
      await api.createExam({
        title,
        subjectId,
        date,
        time,
        examType,
        roomNumber,
        totalMarks: Number(totalMarks),
        description,
      });
      setIsModalOpen(false);
      setTitle('');
      setDate('');
      setDescription('');
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to schedule exam.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm('Are you sure you want to remove this examination from schedule?')) return;
    try {
      await api.deleteExam(examId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete exam.');
    }
  };

  const filteredExams = exams.filter(
    (e) => filterCourse === 'all' || e.subjectId === filterCourse
  );

  if (loading) {
    return <LoadingSpinner message="Loading academic examination schedule..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Examination Schedule & Timetable
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isTeacher
              ? 'Schedule and manage Midterms, End-Semesters, Quizzes, Lab Practicals, and Vivas'
              : 'Official university examination dates, venues, timings, and maximum marks'}
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Exam</span>
          </button>
        )}
      </div>

      {/* Course Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Enrolled Courses</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Exams List */}
      {filteredExams.length > 0 ? (
        <div className="space-y-3">
          {filteredExams.map((exam) => (
            <div
              key={exam._id}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {exam.subjectCode || 'COURSE'}
                  </span>
                  <Badge variant="purple" size="sm">
                    {exam.examType}
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {exam.subjectName}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {exam.title}
                </h3>

                {exam.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {exam.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 font-mono">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Venue: {exam.roomNumber || 'Main Hall'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>Weightage: {exam.totalMarks} Marks</span>
                  </span>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
                <div className="text-left md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5 text-slate-900 dark:text-slate-100 font-bold font-mono text-sm">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{exam.date}</span>
                  </div>
                  <div className="flex items-center md:justify-end gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.time}</span>
                  </div>
                </div>

                {isTeacher && (
                  <button
                    onClick={() => handleDelete(exam._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded mt-2 transition-colors"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No upcoming exams"
          description={
            isTeacher
              ? 'You have not scheduled any examinations yet. Click "Schedule Exam" to publish exam dates and venues.'
              : 'No examinations have been scheduled for your enrolled courses yet.'
          }
          actionText={isTeacher ? 'Schedule Exam' : undefined}
          onAction={isTeacher ? () => setIsModalOpen(true) : undefined}
        />
      )}

      {/* Schedule Exam Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Academic Examination"
        subtitle="Specify examination type, date, hall location, and total marks"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Examination Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Theory Examination: Unit 1 to 3"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Course
              </label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Examination Format
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Midterm">Midterm Examination</option>
                <option value="Final">End-Semester Final Examination</option>
                <option value="Quiz">Class Quiz / Surprise Test</option>
                <option value="Practical">Lab Practical Examination</option>
                <option value="Viva">Oral Viva Voce</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Time Slot
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 10:00 AM - 01:00 PM"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Examination Room / Venue
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. Main Examination Hall"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Total Marks
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                min="10"
                max="500"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Instructions & Syllabus Chapters
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Allowed materials, calculator policy, syllabus units included..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              {submitting ? 'Scheduling...' : 'Schedule Exam'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
