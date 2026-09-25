import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { Assignment, AssignmentSubmission } from '../../types/index.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import {
  ArrowLeft,
  FileText,
  Download,
  Award,
  CheckCircle2,
  Clock,
  User as UserIcon,
  MessageSquare,
} from 'lucide-react';

interface SubmissionsReviewPageProps {
  assignmentId: string;
  onBack: () => void;
}

export const SubmissionsReviewPage: React.FC<SubmissionsReviewPageProps> = ({
  assignmentId,
  onBack,
}) => {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Grade Modal State
  const [selectedSub, setSelectedSub] = useState<AssignmentSubmission | null>(null);
  const [marks, setMarks] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [assignmentId]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const [assignRes, subRes] = await Promise.all([
        api.getAssignmentById(assignmentId),
        api.getSubmissions(assignmentId),
      ]);
      setAssignment(assignRes.assignment);
      setSubmissions(subRes.submissions || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openGradeModal = (sub: AssignmentSubmission) => {
    setSelectedSub(sub);
    setMarks(sub.marks !== null && sub.marks !== undefined ? sub.marks : assignment?.totalMarks || 100);
    setFeedback(sub.feedback || '');
    setGradeError(null);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    setGrading(true);
    setGradeError(null);
    try {
      await api.gradeSubmission(selectedSub._id, {
        marks,
        feedback,
      });
      setSelectedSub(null);
      await loadSubmissions();
    } catch (err: any) {
      setGradeError(err.message || 'Failed to grade submission.');
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving student assignment submissions..." />;
  }

  if (!assignment) return null;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>← Back to Assignments</span>
      </button>

      {/* Header Info */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              {assignment.subjectCode}
            </span>
            <span className="text-xs text-slate-500">{assignment.subjectName}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Submissions: {assignment.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            Due: {assignment.dueDate} · Max Marks: {assignment.totalMarks}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="text-right">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Received</span>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {submissions.length} Submissions
            </p>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {submissions.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Student Turn-in Roster
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {submissions.filter((s) => s.status === 'Reviewed').length} Reviewed / {submissions.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-medium">
                <tr>
                  <th className="py-3 px-4 font-mono w-24">Roll No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Delivered File</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center font-mono">Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {submissions.map((sub) => {
                  const isReviewed = sub.status === 'Reviewed';
                  return (
                    <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {sub.studentRollNumber || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {sub.studentName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{sub.studentEmail}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {sub.fileUrl ? (
                          <a
                            href={sub.fileUrl}
                            download={sub.fileOriginalName || 'submission'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-mono text-[11px]"
                          >
                            <Download className="w-3 h-3" />
                            <span className="truncate max-w-[140px]">{sub.fileOriginalName}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Text response only</span>
                        )}
                        {sub.submissionNotes && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            "{sub.submissionNotes}"
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            sub.status === 'Reviewed'
                              ? 'success'
                              : sub.status === 'Late'
                              ? 'danger'
                              : 'primary'
                          }
                          size="sm"
                        >
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                        {isReviewed ? `${sub.marks} / ${assignment.totalMarks}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openGradeModal(sub)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition-colors"
                        >
                          {isReviewed ? 'Edit Grade' : 'Grade Work'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No submissions received yet"
          description="Students enrolled in this course have not turned in any deliverables for this assignment yet."
        />
      )}

      {/* Grade Submission Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={`Grade Submission: ${selectedSub.studentName}`}
          subtitle={`Roll Number: ${selectedSub.studentRollNumber || 'N/A'}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveGrade} className="space-y-4">
            {gradeError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300">
                {gradeError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Marks Awarded (Max: {assignment.totalMarks})
              </label>
              <input
                type="number"
                required
                min="0"
                max={assignment.totalMarks}
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Faculty Feedback & Evaluation Remarks
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Detailed critique on code clarity, schema normalization, viva response..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={grading}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-60"
              >
                {grading ? 'Recording...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
