import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { ChatMessage } from '../../types/index.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  User as UserIcon,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Code,
  FileQuestion,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear History Modal
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getAIHistory();
      setMessages(res.messages || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || sending) return;

    setError(null);
    setInputPrompt('');
    setSending(true);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      _id: `temp_${Date.now()}`,
      userId: user?._id || '',
      role: 'user',
      message: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.sendAIChat(text);
      const modelMsg: ChatMessage = {
        _id: res.messageId || `model_${Date.now()}`,
        userId: user?._id || '',
        role: 'model',
        message: res.reply,
        createdAt: res.createdAt || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setError(err.message || 'Gemini service is temporarily unavailable. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await api.clearAIHistory();
      setMessages([]);
      setIsClearModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to clear chat history.');
    } finally {
      setClearing(false);
    }
  };

  const suggestedPrompts = [
    {
      title: 'Study Plan',
      prompt: 'Create a realistic study schedule for my upcoming examinations and coursework.',
      icon: Clock,
    },
    {
      title: 'DBMS Normalization',
      prompt: 'Explain database normalization (1NF, 2NF, 3NF, BCNF) with clear relational examples and functional dependencies.',
      icon: BookOpen,
    },
    {
      title: 'Viva Questions',
      prompt: 'Give me 10 high-yield viva voce examination questions and concise model answers on Binary Search Trees.',
      icon: FileQuestion,
    },
    {
      title: 'OOP Polymorphism',
      prompt: 'Explain compile-time vs runtime polymorphism in Java/C++ with a short code example.',
      icon: Code,
    },
  ];

  if (loading) {
    return <LoadingSpinner message="Connecting to Gemini Academic Assistant..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                AI Academic Assistant
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-200/80 dark:border-indigo-800/80">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Grounded in your authenticated courses, assignments, and exam deadlines
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors border border-rose-200/60 dark:border-rose-900/60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Bot className="w-6 h-6" />
            </div>

            <div className="max-w-md space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Welcome to your Academic Copilot
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ask any academic question, request personalized exam revision schedules, or practice university viva voce questions.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {suggestedPrompts.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      <Icon className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-semibold">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      "{item.prompt}"
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg._id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/80 shadow-2xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans break-words">{msg.message}</div>
                    <div
                      className={`text-[10px] font-mono mt-2 pt-1 border-t ${
                        isUser
                          ? 'border-blue-500/50 text-blue-200 text-right'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 font-bold text-xs mt-1">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Typing Indicator */}
            {sending && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Gemini is generating response...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-100 dark:bg-rose-900/60 rounded text-rose-800 dark:text-rose-200 hover:bg-rose-200 transition-colors shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your syllabus, exam preparation, code debugging, or study plan... (Enter to send, Shift+Enter for newline)"
            className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || sending}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-xs shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Clear History Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear AI Conversation History?"
        subtitle="This action will permanently delete all conversation records from MongoDB."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to delete your entire chat history with the AI Assistant? This operation cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={clearing}
              onClick={handleClearHistory}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              {clearing ? 'Deleting...' : 'Yes, Delete History'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
