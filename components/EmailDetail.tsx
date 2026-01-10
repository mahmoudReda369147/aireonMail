import React, { useState, useEffect, useRef } from 'react';
import { Email, Task } from '../types';
import { ArrowLeft, Sparkles, Trash2, MoreVertical, Paperclip, Send, Image as ImageIcon, Edit3, CheckSquare, Calendar, Clock, Users, Plus, X, Bot, ChevronRight, Wand2, CheckCircle2, Scissors, Feather, Briefcase, Smile, Zap, Loader2, ChevronLeft, ListTodo, Archive, ArchiveRestore } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './common/Button';
import { RichEditor } from './common/RichEditor'; // Import the new editor
import { Spinner } from './common/Spinner';
import { TaskModal } from './TaskModal';
import { generateReply, editImage, analyzeActionItems, improveDraft, getSmartInboxAnalysis } from '../services/geminiService';
import { useToast } from './common/Toast';
import { useAppContext } from '../contexts/AppContext';
import { useCreateCalendarTask, useSaveGmailSummary, useGmailEmailById, useCreateTask, useTasks, useUpdateTask, useDeleteTask, useSendEmailReply, useDeleteGmailEmail, useArchiveGmailEmail, useUnarchiveGmailEmail } from '../apis/hooks';
import { CalendarTaskData, GmailEmail, TaskData } from '../apis/services';
import { formatWhatsAppDate } from '../utils/dateFormat';
import { useEditorBackgroundColor } from '../hooks/useEditorBackgroundColor';

interface Props {
    email: Email;
}

export const EmailDetail: React.FC<Props> = ({ email }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { deleteEmail, requestConfirm, updateEmail, t } = useAppContext();
  const createCalendarTaskMutation = useCreateCalendarTask();
  const saveGmailSummaryMutation = useSaveGmailSummary();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const sendEmailReplyMutation = useSendEmailReply();
  const deleteGmailEmailMutation = useDeleteGmailEmail();
  const archiveGmailEmailMutation = useArchiveGmailEmail();
  const unarchiveGmailEmailMutation = useUnarchiveGmailEmail();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  const { data: tasksResponse, isLoading: isLoadingTasks } = useTasks(email.id, currentPage, tasksPerPage);
  const allTasks = tasksResponse?.data || [];
  const totalPages = tasksResponse?.meta.totalPages || 1;
  const totalTasks = tasksResponse?.meta.total || 0;
  const doneTaskes =tasksResponse?.meta.doneTasks || 0
  const pendingTaskes =tasksResponse?.meta.pendingTasks || 0


  // Fetch full email data from API
  const { data: emailDataResponse, isLoading: isLoadingEmailData } = useGmailEmailById(email.id);
  const fullEmailData = emailDataResponse?.data;
  const [replyHtml, setReplyHtml] = useState(''); // Changed to replyHtml
  const { setBgColor: setReplyBgColor, wrapWithFullHTML } = useEditorBackgroundColor();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingSummary, setIsAnalyzingSummary] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [detectedMeeting, setDetectedMeeting] = useState<any>(null);
  const [savedCalendarTask, setSavedCalendarTask] = useState<CalendarTaskData | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [calendarForm, setCalendarForm] = useState({
    title: '',
    description: '',
    status: 'pending' as 'pending' | 'completed',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: ''
  });

  // Local tasks state for Gmail emails (not in AppContext)
  const [localTasks, setLocalTasks] = useState<Task[]>(email.tasks || []);

  // AI Summary State (independent from email.summary)
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiPriority, setAiPriority] = useState<number | null>(null);

  // AI Assistant State
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [editTaskForm, setEditTaskForm] = useState({
    task: '',
    taskDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // More Actions Dropdown State
  const [showMoreActions, setShowMoreActions] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement>(null);

  // Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Reset state when email changes
  useEffect(() => {
    setReplyHtml('');
    setDetectedMeeting(null);
    setShowAi(false);
    setAiPrompt('');
    setLocalTasks(email.tasks || []);
    setSavedCalendarTask(null);
    setShowCalendarModal(false);
    setIsAddingToCalendar(false);
    setAiSummary(null); // Reset AI summary for new email
    setAiPriority(null); // Reset AI priority for new email
    setIsAnalyzingSummary(false); // Reset AI summary analyzing state
    setShowMoreActions(false); // Reset more actions dropdown
  }, [email.id]);

  // Close more actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target as Node)) {
        setShowMoreActions(false);
      }
    };

    if (showMoreActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreActions]);

  // Load AI summary and calendar task from fetched email data or generate new one
  useEffect(() => {
    if (!fullEmailData || email.folder === 'sent') return; // Skip analysis for sent emails

    // Check if there's a saved calendar task
    if (fullEmailData.calendarTask) {
      setSavedCalendarTask(fullEmailData.calendarTask as CalendarTaskData);
    }

    // If aiSummary exists in the fetched data, use it directly
    if (fullEmailData.aiSummary) {
      setAiSummary(fullEmailData.aiSummary.summary);
      setAiPriority(fullEmailData.aiSummary.priority);
    }
    // If no aiSummary exists and we haven't started analyzing, generate it
    else if (!aiSummary && !isAnalyzingSummary) {
      const analyzeEmail = async () => {
        setIsAnalyzingSummary(true);
        try {
          const emailBody = fullEmailData.textBody || fullEmailData.htmlBody || '';
          const analysis = await getSmartInboxAnalysis(emailBody, fullEmailData.subject);

          // Store in local state
          setAiSummary(analysis.summary);
          setAiPriority(analysis.priorityScore);

          // Save to database
          await saveGmailSummaryMutation.mutateAsync({
            summary: analysis.summary,
            priority: analysis.priorityScore,
            gmailId: fullEmailData.id
          });

          showToast("AI analysis completed and saved", "success");
        } catch (e) {
          console.error("AI analysis failed", e);
          showToast("Failed to save AI summary", "error");
        } finally {
          setIsAnalyzingSummary(false);
        }
      };

      analyzeEmail();
    }
  }, [fullEmailData, aiSummary, isAnalyzingSummary, email.folder]);

  const handleDelete = () => {
    requestConfirm({
        title: t('email_detail.delete_email'),
        message: t('email_detail.delete_confirm'),
        onConfirm: async () => {
            try {
                await deleteGmailEmailMutation.mutateAsync(email.id);
                showToast("Email deleted successfully", "success");
                navigate(-1);
            } catch (error) {
                console.error("Failed to delete email", error);
                showToast("Failed to delete email", "error");
            }
        },
        variant: "danger"
    });
  };

  const handleArchive = async () => {
    try {
        await archiveGmailEmailMutation.mutateAsync(email.id);
        showToast("Email archived successfully", "success");
        navigate(-1);
    } catch (error) {
        console.error("Failed to archive email", error);
        showToast("Failed to archive email", "error");
    }
  };

  const handleUnarchive = async () => {
    try {
        await unarchiveGmailEmailMutation.mutateAsync(email.id);
        showToast("Email unarchived successfully", "success");
        navigate(-1);
    } catch (error) {
        console.error("Failed to unarchive email", error);
        showToast("Failed to unarchive email", "error");
    }
  };

  const handleGenerateReply = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
        const html = await generateReply(email, aiPrompt);
        // Clean up if the model was chatty and included markdown fences
        const cleanHtml = html ? html.replace(/```html/g, '').replace(/```/g, '') : '';
        setReplyHtml(cleanHtml);
        showToast("Reply generated!", "success");
    } catch(e) {
        showToast("Failed to generate reply", "error");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleImproveReply = async (instruction: string) => {
      if (!replyHtml) return;
      setIsGenerating(true);
      try {
          const improved = await improveDraft(replyHtml, instruction);
          if (improved) setReplyHtml(improved.replace(/\n/g, '<br>'));
          showToast("Reply updated", "success");
      } catch (e) {
          showToast("Failed to improve text", "error");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleAnalyzeActions = async () => {
    if (!fullEmailData) return;

    setIsAnalyzing(true);
    setDetectedMeeting(null);
    try {
        const emailBody = fullEmailData.textBody || fullEmailData.htmlBody || '';
        const result = await analyzeActionItems(emailBody, fullEmailData.subject);

        // Handle Tasks
        if (result.tasks && result.tasks.length > 0) {
            const newTasks: Task[] = result.tasks.map((t: any) => ({
                ...t,
                id: Math.random().toString(36).substr(2, 9),
                completed: false
            }));
            const updatedTasks = [...localTasks, ...newTasks];
            setLocalTasks(updatedTasks);
        }

        // Handle Meeting
        if (result.meeting) {
            setDetectedMeeting(result.meeting);
            showToast("Meeting detected!", "success");
        }

        if ((result.tasks?.length || 0) > 0 || result.meeting) {
            showToast(`Analysis complete: ${result.tasks?.length || 0} tasks, ${result.meeting ? '1 meeting' : '0 meetings'}.`, "success");
        } else {
             showToast("No new actions detected.", "info");
        }

    } catch (e) {
        console.error("Error in handleAnalyzeActions:", e);
        showToast("Analysis failed", "error");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const toggleTask = (taskId: string) => {
      const updatedTasks = localTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      setLocalTasks(updatedTasks);
  };

  const handleSaveTask = async (task: Task) => {
    if (!fullEmailData) return;

    try {
      await createTaskMutation.mutateAsync({
        task: task.description,
        taskDate: task.deadline || null,
        isDoneTask: task.completed,
        priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high',
        gmailId: fullEmailData.id
      });

      // Remove task from localTasks after successful save
      setLocalTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));

      showToast("Task saved successfully", "success");
    } catch (error) {
      console.error("Failed to save task", error);
      showToast("Failed to save task", "error");
    }
  };

  const handleDeleteTask = (taskId: string) => {
    requestConfirm({
      title: "Delete Task",
      message: "Are you sure you want to delete this task?",
      onConfirm: async () => {
        try {
          await deleteTaskMutation.mutateAsync(taskId);
          showToast("Task deleted successfully", "success");
        } catch (error) {
          console.error("Failed to delete task", error);
          showToast("Failed to delete task", "error");
        }
      },
      variant: "danger"
    });
  };

  const handleEditTask = (task: TaskData) => {
    setEditingTask(task);
    setEditTaskForm({
      task: task.task,
      taskDate: task.taskDate ? new Date(task.taskDate).toISOString().slice(0, 16) : '',
      priority: task.priority as 'low' | 'medium' | 'high'
    });
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      await updateTaskMutation.mutateAsync({
        id: editingTask.id,
        data: {
          task: editTaskForm.task,
          taskDate: editTaskForm.taskDate || null,
          priority: editTaskForm.priority
        }
      });
      setEditingTask(null);
      showToast("Task updated successfully", "success");
    } catch (error) {
      console.error("Failed to update task", error);
      showToast("Failed to update task", "error");
    }
  };

  const handleToggleTaskDone = async (task: TaskData) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        data: {
          isDoneTask: !task.isDoneTask
        }
      });
    } catch (error) {
      console.error("Failed to update task", error);
      showToast("Failed to update task", "error");
    }
  };

  const handleCreateTaskFromModal = async (taskData: {
    task: string;
    taskDate: string;
    priority: 'low' | 'medium' | 'high';
    gmailId?: string;
  }) => {
    if (!fullEmailData) return;

    try {
      await createTaskMutation.mutateAsync({
        task: taskData.task,
        taskDate: taskData.taskDate || null,
        isDoneTask: false,
        priority: taskData.priority,
        gmailId: taskData.gmailId || fullEmailData.id
      });
      showToast("Task created successfully", "success");
    } catch (error) {
      console.error("Failed to create task", error);
      showToast("Failed to create task", "error");
    }
  };

  const handleEditAttachment = async () => {
    if (!editingImage || !imagePrompt) return;
    try {
        showToast("Editing image...", "info");
        const newUrl = await editImage(editingImage, imagePrompt);
        if (newUrl) {
            showToast("Image updated successfully", "success");
            setEditingImage(null);
        }
    } catch (e) {
        showToast("Failed to edit image", "error");
    }
  };

  const addToCalendar = () => {
      if (!detectedMeeting) return;

      // Parse date and time to create ISO string with timezone
      // If date is in YYYY-MM-DD format and time in HH:MM format, combine them
      const dateStr = detectedMeeting.date; // Should be YYYY-MM-DD
      const timeStr = detectedMeeting.time || '12:00'; // Should be HH:MM

      // For API, we need timezone format: YYYY-MM-DDTHH:mm:ss+02:00
      const dateTimeString = `${dateStr}T${timeStr}:00+02:00`;

      setCalendarForm({
        title: detectedMeeting.title || '',
        description: detectedMeeting.agenda || '',
        status: 'pending',
        priority: 'medium',
        dueDate: dateTimeString
      });

      setShowCalendarModal(true);
  };

  const handleCalendarFormChange = (field: string, value: string) => {
      setCalendarForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitCalendar = async () => {
      setIsAddingToCalendar(true);
      setShowCalendarModal(false);

      try {
          const response = await createCalendarTaskMutation.mutateAsync({
              title: calendarForm.title,
              description: calendarForm.description,
              status: calendarForm.status,
              priority: calendarForm.priority,
              dueDate: calendarForm.dueDate,
              gmailId: email.id
          });

          setSavedCalendarTask(response.data);
          showToast("Task added successfully to database and Google Calendar", "success");
          setDetectedMeeting(null);
      } catch (error) {
          showToast("Failed to add task to calendar", "error");
          console.error("Calendar task error:", error);
      } finally {
          setIsAddingToCalendar(false);
      }
  };

  const handleSendReply = async () => {
      console.log("Sending HTML Content:", replyHtml);
      if (!replyHtml.trim()) {
          showToast("Please write a message first", "error");
          return;
      }

      try {
          await sendEmailReplyMutation.mutateAsync({
              to: email.senderEmail,
              subject: `Re: ${email.subject}`,
              body: wrapWithFullHTML(replyHtml),
              gmailId: email.id,
          });
          showToast("Reply sent successfully!", "success");
          setReplyHtml("");
      } catch (error) {
          console.error("Failed to send reply:", error);
          showToast("Failed to send reply", "error");
      }
  };

  const ToolCard = ({ icon: Icon, label, color, onClick }: any) => (
      <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 hover:scale-105 transition-all group"
      >
          <div className={`p-2 rounded-full bg-black/20 ${color} group-hover:scale-110 transition-transform`}>
              <Icon className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-300">{label}</span>
      </button>
  );

  // Show loading state while fetching email data
  if (isLoadingEmailData || !fullEmailData) {
    return (
      <div className="h-full flex flex-col relative overflow-hidden">
        <div className="p-5 border-b border-glass-border flex justify-between items-center bg-glass backdrop-blur-md sticky top-0 z-10 shrink-0">
            <button onClick={() => navigate(-1)} className="md:hidden flex items-center gap-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" /> {t('email_detail.back')}
            </button>
            <div className={`flex gap-3 ${t('app.dir') === 'rtl' ? 'ml-0 mr-auto' : 'ml-auto'}`}>
                <Button variant="secondary" onClick={handleAnalyzeActions} isLoading={isAnalyzing} icon={Sparkles} disabled>
                    {t('email_detail.smart_actions')}
                </Button>
                {email.folder !== 'sent' && <Button
                    variant="secondary"
                    onClick={() => setShowAi(!showAi)}
                    isLoading={isGenerating}
                    icon={Sparkles}
                    className={`transition-all ${showAi ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-100 hover:bg-fuchsia-500/20'}`}
                    disabled
                >
                    {showAi ? t('email_detail.close_assistant') : t('email_detail.ai_reply')}
                </Button>}
                {email.folder === 'drafts' ? (
                  <Button variant="icon" icon={ArchiveRestore} onClick={handleUnarchive} disabled />
                ) : (
                  email.folder !== 'sent' && <Button variant="icon" icon={Archive} onClick={handleArchive} disabled />
                )}
                {email.folder !== 'sent' && <Button variant="icon" icon={Trash2} onClick={handleDelete} disabled />}

                {/* More Actions Dropdown */}
                <div className="relative" ref={moreActionsRef}>
                    <Button
                        variant="icon"
                        icon={MoreVertical}
                        onClick={() => setShowMoreActions(!showMoreActions)}
                        disabled
                    />

                    {showMoreActions && (
                        <div className={`absolute ${t('app.dir') === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-56 bg-slate-900 border border-glass-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
                            <button
                                onClick={() => {
                                    setShowTaskModal(true);
                                    setShowMoreActions(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-purple-500/10 transition-colors border-b border-glass-border"
                            >
                                <ListTodo className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-medium">{t('email_detail.add_task')}</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowCalendarModal(true);
                                    setShowMoreActions(false);
                                    // Pre-fill with current date and time
                                    const now = new Date();
                                    const dateTimeString = `${now.toISOString().slice(0, 10)}T${now.toTimeString().slice(0, 5)}:00+02:00`;
                                    setCalendarForm({
                                        title: '',
                                        description: '',
                                        status: 'pending',
                                        priority: 'medium',
                                        dueDate: dateTimeString
                                    });
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-blue-500/10 transition-colors"
                            >
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium">{t('email_detail.add_to_calendar')}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-fuchsia-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400 text-lg">{t('email_detail.loading_email')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-glass-border flex justify-between items-center bg-glass backdrop-blur-md sticky top-0 z-10 shrink-0">
            <button onClick={() => navigate(-1)} className="md:hidden flex items-center gap-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" /> {t('email_detail.back')}
            </button>
            <div className={`flex gap-3 ${t('app.dir') === 'rtl' ? 'ml-0 mr-auto' : 'ml-auto'}`}>
                <Button variant="secondary" onClick={handleAnalyzeActions} isLoading={isAnalyzing} icon={Sparkles}>
                    {t('email_detail.smart_actions')}
                </Button>
                {email.folder !== 'sent' && <Button
                    variant="secondary"
                    onClick={() => setShowAi(!showAi)}
                    isLoading={isGenerating}
                    icon={Sparkles}
                    className={`transition-all ${showAi ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-100 hover:bg-fuchsia-500/20'}`}
                >
                    {showAi ? t('email_detail.close_assistant') : t('email_detail.ai_reply')}
                </Button>}
                {email.folder === 'drafts' ? (
                  <Button variant="icon" icon={ArchiveRestore} onClick={handleUnarchive} />
                ) : (
                  email.folder !== 'sent' && <Button variant="icon" icon={Archive} onClick={handleArchive} />
                )}
                {email.folder !== 'sent' && <Button variant="icon" icon={Trash2} onClick={handleDelete} />}

                {/* More Actions Dropdown */}
                <div className="relative" ref={moreActionsRef}>
                    <Button
                        variant="icon"
                        icon={MoreVertical}
                        onClick={() => setShowMoreActions(!showMoreActions)}
                    />

                    {showMoreActions && (
                        <div className={`absolute ${t('app.dir') === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-56 bg-slate-900 border border-glass-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
                            <button
                                onClick={() => {
                                    setShowTaskModal(true);
                                    setShowMoreActions(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-purple-500/10 transition-colors border-b border-glass-border"
                            >
                                <ListTodo className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-medium">{t('email_detail.add_task')}</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowCalendarModal(true);
                                    setShowMoreActions(false);
                                    // Pre-fill with current date and time
                                    const now = new Date();
                                    const dateTimeString = `${now.toISOString().slice(0, 10)}T${now.toTimeString().slice(0, 5)}:00+02:00`;
                                    setCalendarForm({
                                        title: '',
                                        description: '',
                                        status: 'pending',
                                        priority: 'medium',
                                        dueDate: dateTimeString
                                    });
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-blue-500/10 transition-colors"
                            >
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium">{t('email_detail.add_to_calendar')}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full custom-scrollbar relative z-0">
            <h1 className="text-3xl font-bold text-white mb-6 leading-tight tracking-tight">{fullEmailData.subject}</h1>
            
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-glass-border">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-lg">
                        {email.sender[0]}
                    </div>
                    <div>
                        <div className="font-bold text-white text-lg">{email.sender}</div>
                        <div className="text-sm text-slate-400">{email.senderEmail}</div>
                    </div>
                </div>
                <div className="text-sm font-medium text-slate-500 bg-surface px-3 py-1 rounded-full border border-glass-border">{formatWhatsAppDate(fullEmailData.date, t)}</div>
            </div>

            {/* AI Insights, Meetings & Tasks Section */}
            <div className="grid gap-6 mb-8">
                {email.folder !== 'sent' && (aiSummary || isAnalyzingSummary) && (
                    <div className="bg-gradient-to-r from-fuchsia-900/10 to-purple-900/10 p-6 rounded-2xl border border-fuchsia-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-24 h-24 text-fuchsia-500" />
                        </div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                {isAnalyzingSummary ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-fuchsia-400 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest">{t('email_detail.analyzing_ai')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 text-fuchsia-400" />
                                        <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest">{t('email_detail.ai_insight')}</span>
                                    </>
                                )}
                            </div>
                            {!isAnalyzingSummary && aiPriority !== null && (
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                    aiPriority > 70 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    aiPriority > 40 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                }`}>
                                    {t('email_detail.priority')}: {aiPriority}
                                </span>
                            )}
                        </div>
                        <p className="text-base text-slate-200 leading-relaxed font-light">
                            {isAnalyzingSummary ? t('email_detail.generating_summary') : aiSummary}
                        </p>
                    </div>
                )}
                
                {/* Meeting Detected Card */}
                {detectedMeeting && (
                    <div className="bg-gradient-to-r  from-blue-900/20 to-indigo-900/20 p-6 rounded-2xl border border-blue-500/30 relative overflow-hidden animate-in fade-in slide-in-from-top-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                        <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-400" />
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{t('email_detail.suggested_event')}</span>
                             </div>
                             <Button onClick={addToCalendar} disabled={isAddingToCalendar} className="bg-blue-600 hover:bg-blue-500 text-xs py-1.5 px-4 shadow-lg shadow-blue-500/30 h-8">
                                {isAddingToCalendar ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        {t('email_detail.adding')}
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-3 h-3" /> {t('email_detail.add_to_calendar')}
                                    </>
                                )}
                             </Button>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-3 backdrop-blur-sm">
                            <div className="font-bold text-white text-lg tracking-tight">{detectedMeeting.title}</div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /> {detectedMeeting.date}</div>
                                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500" /> {detectedMeeting.time} <span className="text-slate-500">({detectedMeeting.duration})</span></div>
                                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /> {detectedMeeting.participants?.join(", ")}</div>
                            </div>
                            {detectedMeeting.agenda && (
                                <div className="text-sm text-slate-400 mt-2 border-t border-white/5 pt-3 leading-relaxed">
                                    <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block mb-1">{t('email_detail.agenda')}</span>
                                    {detectedMeeting.agenda}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Saved Calendar Task Card */}
                {savedCalendarTask && (
                    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 p-6 rounded-2xl border border-blue-500/30 relative overflow-hidden animate-in fade-in slide-in-from-top-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                        <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{t('email_detail.added_to_calendar')}</span>
                             </div>
                             <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                savedCalendarTask.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                savedCalendarTask.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                             }`}>
                                {savedCalendarTask.priority}
                             </span>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-3 backdrop-blur-sm">
                            <div className="font-bold text-white text-lg tracking-tight">{savedCalendarTask.title}</div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /> {new Date(savedCalendarTask.dueDate).toLocaleDateString()}</div>
                                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500" /> {new Date(savedCalendarTask.dueDate).toLocaleTimeString()}</div>
                            </div>
                            {savedCalendarTask.description && (
                                <div className="text-sm text-slate-400 mt-2 border-t border-white/5 pt-3 leading-relaxed">
                                    <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block mb-1">{t('email_detail.description')}</span>
                                    {savedCalendarTask.description}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {localTasks && localTasks.length > 0 && (
                    <div className="bg-gradient-to-r from-emerald-900/10 to-teal-900/10 p-6 rounded-2xl border border-emerald-500/20 relative overflow-hidden animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{t('email_detail.action_items')}</span>
                            </div>
                            <span className="text-xs text-slate-500 bg-black/20 px-2 py-1 rounded-lg">{localTasks.filter(t => !t.completed).length} {t('email_detail.pending')}</span>
                        </div>
                        <div className="space-y-3">
                            {localTasks.map(task => (
                                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${task.completed ? 'bg-black/10 border-transparent opacity-50' : 'bg-surface/60 border-glass-border hover:bg-surface'}`}>
                                    <div 
                                        onClick={() => toggleTask(task.id)}
                                        className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer mt-0.5 transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500 hover:border-emerald-400'}`}
                                    >
                                        {task.completed && <CheckSquare className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task.description}</p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            {task.deadline && (
                                                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                    <Calendar className="w-3 h-3" /> {task.deadline}
                                                </span>
                                            )}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                                task.priority === 'High' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                                                task.priority === 'Medium' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                                'text-slate-400 border-slate-600 bg-slate-700/30'
                                            }`}>
                                                {task.priority==="High"?t("email_detail.high_priority"):task.priority==="Medium"?t("email_detail.medium_priority"):t("email_detail.low_priority")}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSaveTask(task)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                      {  t("Save")}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* My Tasks Section */}
                {allTasks.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-900/10 to-pink-900/10 p-6 rounded-2xl border border-purple-500/20 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">{t("tasks.title")}</span>
                            </div>
                            <span className="text-xs text-slate-500 bg-black/20 px-2 py-1 rounded-lg">
                                {pendingTaskes} {t("calendar_events.pending")}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {allTasks.map(task => (
                                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${task.isDoneTask ? 'bg-black/10 border-transparent opacity-50' : 'bg-surface/60 border-glass-border hover:bg-surface'}`}>
                                    <div
                                        onClick={() => handleToggleTaskDone(task)}
                                        className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 cursor-pointer transition-colors ${task.isDoneTask ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-500 hover:border-purple-400'}`}
                                    >
                                        {task.isDoneTask && <CheckSquare className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${task.isDoneTask ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task.task}</p>
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            {task.taskDate && (
                                                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                    <Calendar className="w-3 h-3" /> {new Date(task.taskDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                                task.priority === 'high' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                                                task.priority === 'medium' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                                'text-slate-400 border-slate-600 bg-slate-700/30'
                                            }`}>
                                                {task.priority==="high"?t("email_detail.high_priority"):task.priority==="medium"?t("email_detail.medium_priority"):t("email_detail.low_priority")}
                                            </span>
                                            
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditTask(task)}
                                            className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition-colors"
                                            title="Edit task"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 transition-colors"
                                            title="Delete task"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                                {/* Previous Button */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1 || isLoadingTasks}
                                    className="p-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Previous page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                                        // Show first page, last page, current page, and pages around current
                                        const showPage =
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            Math.abs(pageNum - currentPage) <= 1;

                                        const showEllipsis =
                                            (pageNum === 2 && currentPage > 3) ||
                                            (pageNum === totalPages - 1 && currentPage < totalPages - 2);

                                        if (!showPage && !showEllipsis) return null;

                                        if (showEllipsis) {
                                            return (
                                                <span key={pageNum} className="px-2 text-slate-500">
                                                    ...
                                                </span>
                                            );
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                disabled={isLoadingTasks}
                                                className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-all ${
                                                    currentPage === pageNum
                                                        ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30'
                                                        : 'bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-300'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || isLoadingTasks}
                                    className="p-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Next page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="prose prose-invert  max-w-none text-slate-300 mb-10 whitespace-pre-line leading-relaxed font-light text-lg">
                {console.log("fullEmailData", fullEmailData)}
                <div dangerouslySetInnerHTML={{ __html: fullEmailData.htmlBody || fullEmailData.textBody || '' }} />
            </div>

            {/* Attachments */}
            {fullEmailData.attachments?.length > 0 && (
                <div className="pt-2">
                    <h4 className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <Paperclip className="w-4 h-4" /> Attachments
                    </h4>
                    <div className="flex flex-wrap gap-4">
                        {fullEmailData.attachments.map((att, idx) => (
                            <div key={idx} className="group relative w-56 rounded-2xl overflow-hidden border border-glass-border bg-surface transition-all hover:border-slate-600 hover:shadow-xl">
                                <div className="h-32 overflow-hidden bg-black">
                                    <img src={att.data || ''} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" alt="attachment" />
                                </div>
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                    <button
                                        onClick={() => { setEditingImage(att.data || ''); setImagePrompt(''); }}
                                        className="p-3 bg-white rounded-full text-black hover:scale-110 transition-transform"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reply Area (Rich Editor) */}
            <div className="mt-12 rounded-2xl border border-glass-border p-1 bg-surface shadow-2xl">
                <div className="bg-space rounded-xl p-4">
                    {isGenerating && <div className="mb-2 text-fuchsia-400 text-xs font-bold animate-pulse">Gemini is writing...</div>}
                    
                    <RichEditor
                        value={replyHtml}
                        onChange={setReplyHtml}
                        onBackgroundColorChange={setReplyBgColor}
                        placeholder="Write a reply... (Supports Rich Text & Documents)"
                        className="min-h-[200px]"
                    />
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 p-2 px-3">
                    <div className="hidden sm:flex gap-1"></div>
                    <Button
                        onClick={handleSendReply}
                        loading={sendEmailReplyMutation.isPending}
                        className="w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        <span>{sendEmailReplyMutation.isPending ? 'Sending...' : 'Send Reply'}</span>
                    </Button>
                </div>
            </div>
        </div>

        {/* AI Sidebar */}
        <div className={`w-[400px] bg-[#0F1020]/95 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-500 absolute ${t('app.dir') === 'rtl' ? 'left-0' : 'right-0'} top-0 bottom-0 z-40 ${showAi ? 'translate-x-0' : t('app.dir') === 'rtl' ? '-translate-x-full' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-500" />
                    {t('email_detail.ai_reply_assistant')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{t('email_detail.context_aware_replies')}</p>
                </div>
                <button onClick={() => setShowAi(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {/* Generation */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Bot className="w-4 h-4 text-fuchsia-400" />
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">Draft Response</label>
                    </div>
                    
                    <div className="relative group">
                        <textarea 
                            className="w-full h-32 bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-fuchsia-500/50 resize-none transition-colors"
                            placeholder="How should we reply? e.g. 'Politely decline and suggest next Tuesday...'"
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                        />
                        <button 
                            onClick={handleGenerateReply}
                            disabled={!aiPrompt || isGenerating}
                            className="absolute bottom-3 right-3 p-2 bg-fuchsia-500 hover:bg-fuchsia-400 rounded-lg text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {[
                            "Agree & Confirm", 
                            "Polite Decline", 
                            "Ask for details",
                            "Thank you"
                        ].map(prompt => (
                            <button 
                                key={prompt}
                                onClick={() => setAiPrompt(prompt)}
                                className="text-[11px] px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:border-fuchsia-500/30 hover:bg-fuchsia-500/10 transition-all"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </section>

                <div className="h-px bg-white/5 w-full"></div>

                {/* Tools - Only active if there is content in replyHtml */}
                <section className={!replyHtml ? 'opacity-50 pointer-events-none grayscale' : 'transition-opacity'}>
                    <div className="flex items-center gap-2 mb-4">
                        <Wand2 className="w-4 h-4 text-cyan-400" />
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">Refine Draft</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <ToolCard 
                            icon={CheckCircle2} 
                            label="Fix Grammar" 
                            color="text-emerald-400" 
                            onClick={() => handleImproveReply("Fix grammar and spelling errors")} 
                        />
                        <ToolCard 
                            icon={Scissors} 
                            label="Shorten" 
                            color="text-orange-400" 
                            onClick={() => handleImproveReply("Make it more concise")} 
                        />
                        <ToolCard 
                            icon={Feather} 
                            label="Expand" 
                            color="text-blue-400" 
                            onClick={() => handleImproveReply("Expand with more details")} 
                        />
                        <ToolCard 
                            icon={Briefcase} 
                            label="Formalize" 
                            color="text-purple-400" 
                            onClick={() => handleImproveReply("Make it professional and formal")} 
                        />
                    </div>
                </section>

                <div className="h-px bg-white/5 w-full"></div>

                {/* Tone */}
                <section className={!replyHtml ? 'opacity-50 pointer-events-none grayscale' : 'transition-opacity'}>
                    <div className="flex items-center gap-2 mb-4">
                        <Smile className="w-4 h-4 text-yellow-400" />
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">Adjust Tone</label>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x">
                        {[
                            { label: 'Friendly', icon: Smile, color: 'text-yellow-400', prompt: 'Make it friendly and warm' },
                            { label: 'Urgent', icon: Zap, color: 'text-red-400', prompt: 'Make it urgent and direct' },
                            { label: 'Confident', icon: CheckCircle2, color: 'text-blue-400', prompt: 'Make it confident and assertive' },
                            { label: 'Casual', icon: Feather, color: 'text-green-400', prompt: 'Make it casual and relaxed' },
                        ].map((tone) => (
                            <button 
                                key={tone.label}
                                onClick={() => handleImproveReply(tone.prompt)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 whitespace-nowrap snap-start transition-colors"
                            >
                                <tone.icon className={`w-3.5 h-3.5 ${tone.color}`} />
                                <span className="text-xs text-slate-300">{tone.label}</span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>

        {/* Image Editor Modal */}
        {editingImage && (
             <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-8">
                <div className="bg-space border border-glass-border rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-glass-border flex justify-between items-center bg-surface/50">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-fuchsia-500" /> AI Editor</h3>
                        <Button variant="icon" onClick={() => setEditingImage(null)} icon={X} />
                    </div>
                    <div className="flex-1 flex bg-black/20 items-center justify-center p-8">
                         <img src={editingImage} className="max-w-full max-h-[600px] object-contain" />
                    </div>
                    <div className="p-6 bg-surface/50 border-t border-glass-border flex gap-4">
                        <input value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} className="flex-1 bg-black/30 border border-glass-border rounded-xl px-5 py-3 text-white outline-none" placeholder="Describe edits..." />
                        <Button onClick={handleEditAttachment}>Apply Edits</Button>
                    </div>
                </div>
             </div>
        )}

        {/* Calendar Task Modal */}
        {showCalendarModal && (
             <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-8">
                <div className="bg-space border border-glass-border rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-glass-border flex justify-between items-center bg-surface/50">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" /> Add to Calendar
                        </h3>
                        <Button variant="icon" onClick={() => setShowCalendarModal(false)} icon={X} />
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Title</label>
                            <input
                                type="text"
                                value={calendarForm.title}
                                onChange={e => handleCalendarFormChange('title', e.target.value)}
                                className="w-full bg-black/30 border border-glass-border rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-colors"
                                placeholder="Event title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                            <textarea
                                value={calendarForm.description}
                                onChange={e => handleCalendarFormChange('description', e.target.value)}
                                className="w-full bg-black/30 border border-glass-border rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-colors resize-none"
                                placeholder="Event description"
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Status</label>
                                <select
                                    value={calendarForm.status}
                                    onChange={e => handleCalendarFormChange('status', e.target.value)}
                                    className="w-full bg-black/30 border border-glass-border rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-colors"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Priority</label>
                                <select
                                    value={calendarForm.priority}
                                    onChange={e => handleCalendarFormChange('priority', e.target.value)}
                                    className="w-full bg-black/30 border border-glass-border rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-colors"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Due Date & Time</label>
                            <input
                                type="datetime-local"
                                value={calendarForm.dueDate.slice(0, 16)}
                                onChange={e => {
                                    // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO with timezone
                                    const localDateTime = e.target.value;
                                    const isoWithTimezone = `${localDateTime}:00+02:00`;
                                    handleCalendarFormChange('dueDate', isoWithTimezone);
                                }}
                                className="w-full bg-black/30 border border-glass-border rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="p-6 bg-surface/50 border-t border-glass-border flex gap-4 justify-end">
                        <Button variant="secondary" onClick={() => setShowCalendarModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmitCalendar} className="bg-blue-600 hover:bg-blue-500">
                            <Calendar className="w-4 h-4" /> Add to Calendar
                        </Button>
                    </div>
                </div>
             </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                <div
                    className="bg-gradient-to-br from-slate-900/95 via-purple-900/20 to-slate-900/95 backdrop-blur-xl border border-purple-500/20 rounded-3xl w-full max-w-2xl shadow-2xl shadow-purple-500/30 overflow-hidden"
                    style={{
                        animation: 'modalPopup 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                    }}
                >
                    {/* Header with gradient */}
                    <div className="relative p-6 border-b border-purple-500/10 bg-gradient-to-r from-purple-500/5 to-fuchsia-500/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-400/20">
                                    <Edit3 className="w-5 h-5 text-purple-300" />
                                </div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-200 via-fuchsia-200 to-purple-300 bg-clip-text text-transparent">
                                    Edit Task
                                </h2>
                            </div>
                            <button
                                onClick={() => setEditingTask(null)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 group"
                            >
                                <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-purple-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                Task Description
                            </label>
                            <textarea
                                value={editTaskForm.task}
                                onChange={e => setEditTaskForm({ ...editTaskForm, task: e.target.value })}
                                className="w-full bg-black/40 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-purple-400/50 focus:bg-black/50 focus:ring-2 focus:ring-purple-500/10 transition-all duration-200 resize-none"
                                placeholder="Enter task description..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-purple-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></span>
                                    Due Date
                                    <span className="text-xs text-slate-500 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editTaskForm.taskDate}
                                    onChange={e => setEditTaskForm({ ...editTaskForm, taskDate: e.target.value })}
                                    className="w-full bg-black/40 border border-purple-500/20 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-400/50 focus:bg-black/50 focus:ring-2 focus:ring-fuchsia-500/10 transition-all duration-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-purple-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                    Priority
                                </label>
                                <select
                                    value={editTaskForm.priority}
                                    onChange={e => setEditTaskForm({ ...editTaskForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                                    className="w-full bg-black/40 border border-purple-500/20 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-400/50 focus:bg-black/50 focus:ring-2 focus:ring-cyan-500/10 transition-all duration-200 cursor-pointer"
                                >
                                    <option value="low" className="bg-slate-900">🟢 Low Priority</option>
                                    <option value="medium" className="bg-slate-900">🟡 Medium Priority</option>
                                    <option value="high" className="bg-slate-900">🔴 High Priority</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Footer with buttons */}
                    <div className="p-6 bg-gradient-to-r from-purple-500/5 to-fuchsia-500/5 border-t border-purple-500/10 flex gap-3 justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => setEditingTask(null)}
                            className="hover:bg-white/10"
                        >
                            <X className="w-4 h-4" /> {t('email_detail.cancel')}
                        </Button>
                        <Button
                            onClick={handleUpdateTask}
                            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200"
                        >
                            <CheckCircle2 className="w-4 h-4" /> {t('email_detail.update_task')}
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* Loading Popup */}
        {(createTaskMutation.isPending || updateTaskMutation.isPending || deleteTaskMutation.isPending) && <Spinner fullScreen />}

        {/* Task Modal */}
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleCreateTaskFromModal}
          defaultGmailId={email.id}
          showGmailIdField={false}
        />
    </div>
  );
};