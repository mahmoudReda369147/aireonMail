import React, { useState } from 'react';
import { Calendar, Search, Filter, ChevronLeft, ChevronRight, Loader2, Clock, AlertCircle, CheckCircle2, Edit3, Trash2, Plus } from 'lucide-react';
import { useCalendarTasks, useUpdateCalendarTask, useDeleteCalendarTask, useCreateCalendarTask } from '../apis/hooks';
import { CalendarTaskData, FetchCalendarTasksParams } from '../apis/services';
import { Dropdown, DropdownOption } from '../components/common/Dropdown';
import { X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { CountdownTimer } from '../components/CountdownTimer';

export const CalendarTasksPage: React.FC = () => {
  const { showToast, requestConfirm, t } = useAppContext();
  const createCalendarTaskMutation = useCreateCalendarTask();
  const updateCalendarTaskMutation = useUpdateCalendarTask();
  const deleteCalendarTaskMutation = useDeleteCalendarTask();

  // Filter states
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | ''>('');
  const [status, setStatus] = useState<'pending' | 'completed' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CalendarTaskData | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'completed',
  });

  // Build query params
  const queryParams: FetchCalendarTasksParams = {
    page: currentPage,
    limit: tasksPerPage,
    ...(search && { search }),
    ...(fromDate && { from: fromDate }),
    ...(toDate && { to: toDate }),
    ...(priority && { priority }),
    ...(status && { status }),
  };

  // Fetch calendar tasks
  const { data: tasksResponse, isLoading } = useCalendarTasks(queryParams);
  const tasks = tasksResponse?.data || [];
  const totalPages = tasksResponse?.meta.totalPages || 1;
  const pendingTasks = tasksResponse?.meta.pendingTasks || 0;
  const completedTasks = tasksResponse?.meta.completedTasks || 0;
  const totalTasks = tasksResponse?.meta.total || 0;

  // Dropdown options
  const priorityOptions: DropdownOption[] = [
    { label: t ? t('calendar_events.all_priorities') : 'All Priorities', value: '' },
    { label: '🟢 ' + (t ? t('tasks.priority_low') : 'Low'), value: 'low' },
    { label: '🟡 ' + (t ? t('tasks.priority_medium') : 'Medium'), value: 'medium' },
    { label: '🔴 ' + (t ? t('tasks.priority_high') : 'High'), value: 'high' },
  ];

  const statusOptions: DropdownOption[] = [
    { label: t ? t('calendar_events.all_status') : 'All Status', value: '' },
    { label: t ? t('calendar_events.pending') : 'Pending', value: 'pending' },
    { label: t ? t('calendar_events.completed') : 'Completed', value: 'completed' },
  ];

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, fromDate, toDate, priority, status]);

  // Dropdown options for modal
  const modalPriorityOptions: DropdownOption[] = [
    { label: '🟢 ' + (t ? t('tasks.priority_low') : 'Low') + ' Priority', value: 'low' },
    { label: '🟡 ' + (t ? t('tasks.priority_medium') : 'Medium') + ' Priority', value: 'medium' },
    { label: '🔴 ' + (t ? t('tasks.priority_high') : 'High') + ' Priority', value: 'high' },
  ];

  const modalStatusOptions: DropdownOption[] = [
    { label: t ? t('calendar_events.pending') : 'Pending', value: 'pending' },
    { label: t ? t('calendar_events.completed') : 'Completed', value: 'completed' },
  ];

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setPriority('');
    setStatus('');
    setCurrentPage(1);
  };

  // Handle open create modal
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      status: 'pending',
    });
    setIsModalOpen(true);
  };

  // Handle edit task
  const handleEditTask = (task: CalendarTaskData) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      dueDate: new Date(task.dueDate).toISOString().slice(0, 16), // Extract date and time for datetime-local
      priority: task.priority as 'low' | 'medium' | 'high',
      status: task.status as 'pending' | 'completed',
    });
    setIsModalOpen(true);
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    const confirmed = await requestConfirm({
      title: t('calendar_events.delete_title'),
      message: t('calendar_events.delete_message'),
      onConfirm: async () => {
        try {
          await deleteCalendarTaskMutation.mutateAsync(taskId);
          showToast(t('calendar_events.event_deleted_success'), 'success');
        } catch (error) {
          console.error('Failed to delete calendar event', error);
          showToast(t('calendar_events.failed_delete_event'), 'error');
        }
      },
    });
  };

  // Handle save task (create or update)
  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) {
      showToast(t('calendar_events.enter_event_title'), 'error');
      return;
    }

    if (!taskForm.dueDate) {
      showToast(t('calendar_events.select_due_date'), 'error');
      return;
    }

    try {
      if (editingTask) {
        // Update existing task
        await updateCalendarTaskMutation.mutateAsync({
          id: editingTask.id,
          data: {
            title: taskForm.title,
            description: taskForm.description,
            dueDate: taskForm.dueDate,
            priority: taskForm.priority,
            status: taskForm.status,
          },
        });
      } else {
        // Create new task
        await createCalendarTaskMutation.mutateAsync({
          title: taskForm.title,
          description: taskForm.description,
          dueDate: taskForm.dueDate,
          priority: taskForm.priority,
          status: taskForm.status,
          gmailId: '', // Empty gmailId for manually created calendar events
        });
      }

      // Close modal first
      setIsModalOpen(false);
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        status: 'pending',
      });

      // Show success toast after modal closes and data refreshes
      setTimeout(() => {
        showToast(
          editingTask ? t('calendar_events.event_updated_success') : t('calendar_events.event_created_success'),
          'success'
        );
      }, 100);
    } catch (error) {
      console.error('Failed to save calendar event', error);
      showToast(t('calendar_events.failed_save_event'), 'error');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-midnight text-slate-200 w-full">
      {/* Header */}
      <div className="p-6 border-b border-glass-border bg-gradient-to-r from-blue-900/10 to-cyan-900/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/20">
              <Calendar className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                {t('calendar_events.title')}
              </h1>
              <p className="text-sm text-slate-400">
                {t('calendar_events.total_pending_completed').replace('{total}', totalTasks.toString()).replace('{pending}', pendingTasks.toString()).replace('{completed}', completedTasks.toString())}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('calendar_events.new_event')}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={t('calendar_events.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-blue-500/20 rounded-xl text-white placeholder-slate-500 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          {/* From Date */}
          <div className="relative">
            <input
              type="date"
              placeholder={t('calendar_events.from_date')}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-blue-500/20 rounded-xl text-white outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/10 transition-all"
            />
          </div>

          {/* To Date */}
          <div className="relative">
            <input
              type="date"
              placeholder={t('calendar_events.to_date')}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-blue-500/20 rounded-xl text-white outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/10 transition-all"
            />
          </div>

          {/* Priority */}
          <Dropdown
            value={priority}
            options={priorityOptions}
            onChange={(value) => setPriority(value as any)}
            placeholder={t('calendar_events.all_priorities')}
            icon={Filter}
          />

          {/* Status */}
          <Dropdown
            value={status}
            options={statusOptions}
            onChange={(value) => setStatus(value as any)}
            placeholder={t('calendar_events.all_status')}
            icon={Clock}
          />
        </div>

        {/* Reset Filters Button */}
        {(search || fromDate || toDate || priority || status) && (
          <button
            onClick={handleResetFilters}
            className="mt-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white transition-all flex items-center gap-2"
          >
            <X className="w-4 h-4" /> {t('calendar_events.clear_filters')}
          </button>
        )}
      </div>

      {/* Calendar Tasks List */}
      <div className="flex-1 overflow-y-auto p-6 pb-[150px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Calendar className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">{t('calendar_events.no_events_found')}</p>
            <p className="text-sm">{t('calendar_events.try_adjusting_filters')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-6 rounded-2xl border relative overflow-hidden animate-in fade-in slide-in-from-top-4 transition-all flex flex-col ${
                'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Calendar className="w-5 h-5 text-blue-400" />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-widest ${
                      task.status === 'completed' ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {task.status === 'completed' ? t('calendar_events.completed_event') : t('calendar_events.calendar_event')}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : task.priority === 'medium'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    {task.priority === 'high' ? t('calendar_events.high_priority') : 
                     task.priority === 'medium' ? t('calendar_events.medium_priority') : 
                     t('calendar_events.low_priority')}
                  </span>
                </div>
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 backdrop-blur-sm flex-1 flex flex-col relative">
                  {task.bot && (
                    <span
                      className={`absolute top-4 ${t('app.dir') === 'rtl' ? '-left-5' : '-right-5'} inline-block text-[9px] px-2 py-0.5 font-bold  tracking-wider pointer-events-none`}
                      style={{
                        transform: `rotate(${t('app.dir') === 'rtl' ? '-50deg' : '40deg'})`,
                        color: '#9333ea',
                        border: '1.5px solid #9333ea',
                        borderRadius: '4px',
                        background: 'radial-gradient(circle at 30% 40%, rgba(147, 51, 234, 0.08), rgba(147, 51, 234, 0.05))',
                        boxShadow: 'inset 0 0 8px rgba(147, 51, 234, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1)',
                        filter: 'contrast(1.1) saturate(0.9)',
                        letterSpacing: '0.08em',
                        fontFamily: 'monospace',
                        backdropFilter: 'blur(0.5px)',
                      }}
                    >
                      <span style={{
                        position: 'relative',
                        zIndex: 1,
                        textShadow: '0 0 1px rgba(147, 51, 234, 0.3)',
                      }}>
                        by: {task.bot.botName}[bot]
                      </span>
                      {/* Stamp texture overlay */}
                      <span
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 1px,
                            rgba(147, 51, 234, 0.03) 1px,
                            rgba(147, 51, 234, 0.03) 2px
                          )`,
                          mixBlendMode: 'multiply',
                        }}
                      />
                    </span>
                  )}
                  <div className="flex-1 space-y-3">
                    <div className="font-bold text-white text-lg tracking-tight">
                      {task.title}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />{' '}
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />{' '}
                        {new Date(task.dueDate).toLocaleTimeString()}
                      </div>
                      {task.googleEventId && (
                        <div className="flex items-center gap-2 text-blue-400">
                          <CheckCircle2 className="w-4 h-4" />
                          {t('calendar_events.synced_with_google')}
                        </div>
                      )}
                    </div>
                    {task.description && (
                      <div className="text-sm text-slate-400 mt-2 border-t border-white/5 pt-3 leading-relaxed">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
                          {t('calendar_events.description')}
                        </span>
                        {task.description}
                      </div>
                    )}
                  </div>

                  {/* Countdown Timer - Only show for pending events */}
                  {task.status !== 'completed' && (
                    <div className="mt-3">
                      <CountdownTimer dueDate={task.dueDate} />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/20 rounded-xl text-blue-300 text-sm font-medium transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                      {t('calendar_events.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-400/20 rounded-xl text-red-300 text-sm font-medium transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('calendar_events.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title={t('calendar_events.previous_page')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
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
                    disabled={isLoading}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title={t('calendar_events.next_page')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-blue-500/30 rounded-3xl p-8 max-w-2xl w-full shadow-2xl shadow-blue-500/20 animate-[modalPopup_0.3s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                {editingTask ? t('calendar_events.edit_event') : t('calendar_events.create_event')}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTask(null);
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  {t('calendar_events.event_title')}
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder={t('calendar_events.event_title_placeholder')}
                  className="w-full px-4 py-3 bg-black/40 border border-blue-500/20 rounded-xl text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/10 transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  {t('calendar_events.event_description')}
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder={t('calendar_events.event_description_placeholder')}
                  rows={3}
                  className="w-full px-4 py-3 bg-black/40 border border-blue-500/20 rounded-xl text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/10 transition-all resize-none"
                />
              </div>

              {/* Date and Time Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Due Date & Time */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                    {t('calendar_events.due_date_time')}
                  </label>
                  <input
                    type="datetime-local"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-black/40 border border-blue-500/20 rounded-xl text-white outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/10 transition-all"
                    step="1"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    {t('calendar_events.priority')}
                  </label>
                  <Dropdown
                    value={taskForm.priority}
                    options={modalPriorityOptions}
                    onChange={(value) =>
                      setTaskForm({
                        ...taskForm,
                        priority: value as 'low' | 'medium' | 'high',
                      })
                    }
                    placeholder={t('calendar_events.select_priority')}
                    icon={Filter}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  {t('calendar_events.status')}
                </label>
                <Dropdown
                  value={taskForm.status}
                  options={modalStatusOptions}
                  onChange={(value) =>
                    setTaskForm({
                      ...taskForm,
                      status: value as 'pending' | 'completed',
                    })
                  }
                  placeholder={t('calendar_events.select_status')}
                  icon={CheckCircle2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-medium transition-all"
                >
                  {t('calendar_events.cancel')}
                </button>
                <button
                  onClick={handleSaveTask}
                  disabled={updateCalendarTaskMutation.isPending || createCalendarTaskMutation.isPending}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {(updateCalendarTaskMutation.isPending || createCalendarTaskMutation.isPending) && (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                  {(updateCalendarTaskMutation.isPending || createCalendarTaskMutation.isPending) ? t('calendar_events.saving') : (editingTask ? t('calendar_events.save_changes') : t('calendar_events.create_event_button'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
