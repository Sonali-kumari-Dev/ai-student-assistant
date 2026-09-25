import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Assignment, AssignmentSubmission } from '../../types/index.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Badge } from '../../components/common/Badge.js';
import {
  ArrowLeft,
  FileText,
  Clock,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileUp,
  MessageSquare,
  Award,
} from 'lucide-react';

interface AssignmentDetailPageProps {
  assignmentId: string;
  onBack: () => void;
}

export const AssignmentDetailPage: React.FC<AssignmentDetailPageProps> = ({
  assignmentId,
  onBack,
}) => {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  // Submit form state
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    setLoading(true);
    try {
      const res = await api.getAssignmentById(assignmentId);
      setAssignment(res.assignment);
      setSubmission(res.assignment.mySubmission || null);
      if (res.assignment.mySubmission?.submissionNotes) {
        setNotes(res.assignment.mySubmission.submissionNotes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assignment details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !notes) {
      setError('Please attach a file or write notes for your submission.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (notes) formData.append('notes', notes);

      const res = await api.submitAssignment(assignmentId, formData);
      setMessage(res.message);
      setSubmission(res.submission);
      setFile(null);
      await loadAssignment();
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving assignment brief..." />;
  }

  if (error && !assignment) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assignments</span>
        </button>
        <div className="p-5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
          {error}
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>← Back to Assignments List</span>
      </button>

      {/* Main Assignment Details Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {assignment.subjectCode}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {assignment.subjectName}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {assignment.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Badge
              variant={
                assignment.priority === 'High'
                  ? 'danger'
                  : assignment.priority === 'Medium'
                  ? 'warning'
                  : 'neutral'
              }
            >
              {assignment.priority} Priority
            </Badge>
          </div>
        </div>

        {/* Due Date & Marks Info Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
          <div>
            <span className="text-slate-400 font-mono text-[11px] uppercase">Submission Deadline</span>
            <p className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {assignment.dueDate}
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-mono text-[11px] uppercase">Maximum Marks</span>
            <p className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {assignment.totalMarks} Points
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-400 font-mono text-[11px] uppercase">My Status</span>
            <p className="mt-0.5">
              <Badge
                variant={
                  submission?.status === 'Reviewed'
                    ? 'success'
                    : submission?.status === 'Submitted'
                    ? 'primary'
                    : submission?.status === 'Late'
                    ? 'danger'
                    : 'warning'
                }
                size="sm"
              >
                {submission?.status || 'Not Submitted'}
              </Badge>
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Assignment Brief & Instructions
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            {assignment.description || 'No specific instructions provided.'}
          </p>
        </div>

        {/* Faculty Attachment Download */}
        {assignment.attachmentUrl && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Instructor Attachment
            </h3>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {assignment.attachmentOriginalName || 'Problem_Brief.pdf'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {assignment.attachmentSize ? `${Math.round(assignment.attachmentSize / 1024)} KB` : 'Attached Document'}
                  </p>
                </div>
              </div>
              <a
                href={assignment.attachmentUrl}
                download={assignment.attachmentOriginalName || 'attachment'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Brief</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Teacher Grade & Evaluation Box if already reviewed */}
      {submission && submission.status === 'Reviewed' && (
        <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold">Faculty Evaluation & Marks</h3>
            </div>
            <span className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-200">
              Score: {submission.marks} / {assignment.totalMarks}
            </span>
          </div>
          {submission.feedback ? (
            <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed whitespace-pre-line bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
              {submission.feedback}
            </p>
          ) : (
            <p className="text-xs text-emerald-700/80">No additional remarks left by instructor.</p>
          )}
        </div>
      )}

      {/* Student Work Submission Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {submission ? 'Your Submitted Work' : 'Submit Your Work'}
            </h3>
          </div>
          {submission && (
            <span className="text-[11px] text-slate-400 font-mono">
              Submitted on: {new Date(submission.submittedAt).toLocaleString()}
            </span>
          )}
        </div>

        {/* Existing Submission Preview */}
        {submission && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {submission.fileOriginalName || 'Uploaded_Submission'}
              </p>
              {submission.submissionNotes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Notes: {submission.submissionNotes}
                </p>
              )}
            </div>
            {submission.fileUrl && (
              <a
                href={submission.fileUrl}
                download={submission.fileOriginalName || 'submission'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download My File</span>
              </a>
            )}
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {message && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {submission ? 'Replace Submission File (Optional)' : 'Upload Submission File (PDF, DOCX, ZIP, Code)'}
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/60 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Submission Remarks / Solution Explanation
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide comments for the faculty member or details on how to run your submission..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <FileUp className="w-4 h-4" />
            <span>{submitting ? 'Submitting Work...' : submission ? 'Update Submission' : 'Submit Assignment'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
