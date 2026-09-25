import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Assignment, Subject } from '../../types/index.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { Badge } from '../../components/common/Badge.js';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Clock,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface AssignmentsPageProps {
  onSelectAssignment: (assignmentId: string) => void;
  onReviewSubmissions: (assignmentId: string) => void;
}

export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({
  onSelectAssignment,
  onReviewSubmissions,
}) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');

  // Create Assignment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [totalMarks, setTotalMarks] = useState('100');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignRes, subRes] = await Promise.all([
        api.getAssignments(),
        api.getSubjects(),
      ]);
      setAssignments(assignRes.assignments || []);
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('subjectId', subjectId);
      formData.append('dueDate', dueDate);
      formData.append('priority', priority);
      formData.append('totalMarks', totalMarks);
      formData.append('status', status);
      if (file) {
        formData.append('file', file);
      }

      await api.createAssignment(formData);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setFile(null);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishDraft = async (assignmentId: string) => {
    try {
      const formData = new FormData();
      formData.append('status', 'published');
      await api.updateAssignment(assignmentId, formData);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment and all submissions?')) return;
    try {
      await api.deleteAssignment(assignmentId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete assignment');
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.subjectName && a.subjectName.toLowerCase().includes(search.toLowerCase()));
    const matchesCourse = filterCourse === 'all' || a.subjectId === filterCourse;
    return matchesSearch && matchesCourse;
  });

  if (loading) {
    return <LoadingSpinner message="Loading course assignments from database..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isTeacher ? 'Assignment Manager' : 'Academic Assignments'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isTeacher
              ? 'Draft, publish, and evaluate course coursework and project deliverables'
              : 'View deadlines, download problem sheets, and submit assignments'}
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments by title or course..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="w-full sm:w-56 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Courses</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Assignment Cards Grid */}
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((assignment) => {
            const isDraft = assignment.status === 'draft';
            return (
              <div
                key={assignment._id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {assignment.subjectCode || 'COURSE'}
                    </span>
                    <div className="flex items-center gap-1.5">
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
                        {assignment.priority}
                      </Badge>
                      {isDraft && (
                        <Badge variant="neutral" size="sm">
                          Draft (Hidden from students)
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {assignment.description || 'No additional instructions.'}
                  </p>

                  {/* Submission Status or Progress */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {!isTeacher ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">My Status:</span>
                        <Badge
                          variant={
                            assignment.submissionStatus === 'Reviewed'
                              ? 'success'
                              : assignment.submissionStatus === 'Submitted'
                              ? 'primary'
                              : assignment.submissionStatus === 'Late'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {assignment.submissionStatus || 'Not Submitted'}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                        <span>Submissions:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {assignment.submissionCount || 0} of {assignment.enrolledCount || 0} students
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {assignment.dueDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isTeacher && isDraft && (
                      <button
                        onClick={() => handlePublishDraft(assignment._id)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 rounded hover:bg-emerald-100 transition-colors"
                      >
                        Publish
                      </button>
                    )}

                    {isTeacher ? (
                      <button
                        onClick={() => onReviewSubmissions(assignment._id)}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>Submissions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectAssignment(assignment._id)}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>{assignment.submissionStatus === 'Not Submitted' ? 'Submit' : 'View'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isTeacher && (
                      <button
                        onClick={() => handleDeleteAssignment(assignment._id)}
                        title="Delete assignment"
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No assignments available"
          description={
            isTeacher
              ? 'You have not created any assignments yet. Click "Create Assignment" to post coursework for your students.'
              : 'No assignments have been published for your enrolled courses yet.'
          }
          actionText={isTeacher ? 'Create Assignment' : undefined}
          onAction={isTeacher ? () => setIsModalOpen(true) : undefined}
        />
      )}

      {/* Teacher Create Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Assignment"
        subtitle="Specify assignment guidelines, due date, and upload problem sheets"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Assignment Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lab Assignment 2: B+ Tree Implementation"
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
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
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

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Publish Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="published">Publish Now (Visible to Students)</option>
                <option value="draft">Save as Draft (Hidden from Students)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Instructions & Problem Statement
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed guidelines, submission criteria, coding format..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Optional Problem Sheet / Attachment (PDF, DOCX, ZIP, etc.)
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/60 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
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
              {submitting ? 'Saving...' : status === 'published' ? 'Publish Assignment' : 'Save Draft'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
