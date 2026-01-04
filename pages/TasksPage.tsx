import React, { useState } from 'react';
import { CheckSquare, Search, Calendar, Filter, Plus, Edit3, Trash2, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAllTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../apis/hooks';
import { TaskData, FetchAllTasksParams } from '../apis/services';
import { useToast } from '../components/common/Toast';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { Dropdown, DropdownOption } from '../components/common/Dropdown';
import { TaskModal } from '../components/TaskModal';

export const TasksPage: React.FC = () => {
  const { showToast, requestConfirm } = useAppContext();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // Filter states
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | ''>('');
  const [isDoneTask, setIsDoneTask] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  // Build query params
  const queryParams: FetchAllTasksParams = {
    page: currentPage,
    limit: tasksPerPage,
    ...(search && { search }),
    ...(fromDate && { from: fromDate }),
    ...(toDate && { to: toDate }),
    ...(priority && { priority }),
    ...(isDoneTask !== undefined && { isDoneTask }),
  };

  // Fetch tasks
  const { data: tasksResponse, isLoading } = useAllTasks(queryParams);
  const tasks = tasksResponse?.data || [];
  const totalPages = tasksResponse?.meta.totalPages || 1;
  const pendingTasks = tasksResponse?.meta.pendingTasks || 0;
  const doneTasks = tasksResponse?.meta.doneTasks || 0;
  const totalTasks = tasksResponse?.meta.total || 0;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);

  // Dropdown options
  const priorityOptions: DropdownOption[] = [
    { label: 'All Priorities', value: '' },
    { label: '🟢 Low', value: 'low' },
    { label: '🟡 Medium', value: 'medium' },
    { label: '🔴 High', value: 'high' },
  ];

  const statusOptions: DropdownOption[] = [
    { label: 'All Tasks', value: '' },
    { label: 'Pending Tasks', value: 'pending' },
    { label: 'Done Tasks', value: 'done' },
  ];

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, fromDate, toDate, priority, isDoneTask]);

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setPriority('');
    setIsDoneTask(undefined);
    setCurrentPage(1);
  };

  // Handle create task
  const handleCreateTask = async (taskData: {
    task: string;
    taskDate: string;
    priority: 'low' | 'medium' | 'high';
    gmailId?: string;
  }) => {
    try {
      await createTaskMutation.mutateAsync({
        task: taskData.task,
        taskDate: taskData.taskDate || null,
        isDoneTask: false,
        priority: taskData.priority,
        gmailId: taskData.gmailId || '',
      });
      showToast('Task created successfully', 'success');
    } catch (error) {
      console.error('Failed to create task', error);
      showToast('Failed to create task', 'error');
    }
  };

  // Handle edit task
  const handleEditTask = (task: TaskData) => {
    setEditingTask(task);
  };

  // Handle update task
  const handleUpdateTask = async (taskData: {
    task: string;
    taskDate: string;
    priority: 'low' | 'medium' | 'high';
    gmailId?: string;
  }) => {
    if (!editingTask) return;

    try {
      await updateTaskMutation.mutateAsync({
        id: editingTask.id,
        data: {
          task: taskData.task,
          taskDate: taskData.taskDate || null,
          priority: taskData.priority,
        },
      });
      setEditingTask(null);
      showToast('Task updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update task', error);
      showToast('Failed to update task', 'error');
    }
  };

  // Handle delete task
  const handleDeleteTask = (taskId: string) => {
    requestConfirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      onConfirm: async () => {
        try {
          await deleteTaskMutation.mutateAsync(taskId);
          showToast('Task deleted successfully', 'success');
        } catch (error) {
          console.error('Failed to delete task', error);
          showToast('Failed to delete task', 'error');
        }
      },
      variant: 'danger',
    });
  };

  // Handle toggle task done
  const handleToggleTaskDone = async (task: TaskData) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        data: {
          isDoneTask: !task.isDoneTask,
        },
      });
    } catch (error) {
      console.error('Failed to update task', error);
      showToast('Failed to update task', 'error');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-midnight text-slate-200 ">
      {/* Header */}
      <div className="p-6 border-b border-glass-border bg-gradient-to-r from-purple-900/10 to-fuchsia-900/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-400/20">
              <CheckSquare className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-200 via-fuchsia-200 to-purple-300 bg-clip-text text-transparent">
                My Tasks
              </h1>
              <p className="text-sm text-slate-400">
                {totalTasks} total • {pendingTasks} pending • {doneTasks} done
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-purple-500/20 rounded-xl text-white placeholder-slate-500 outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/10 transition-all"
            />
          </div>

          {/* From Date */}
          <div className="relative">
            <input
              type="date"
              placeholder="From date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-purple-500/20 rounded-xl text-white outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/10 transition-all"
            />
          </div>

          {/* To Date */}
          <div className="relative">
            <input
              type="date"
              placeholder="To date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-purple-500/20 rounded-xl text-white outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/10 transition-all"
            />
          </div>

          {/* Priority */}
          <Dropdown
            value={priority}
            options={priorityOptions}
            onChange={(value) => setPriority(value as any)}
            placeholder="All Priorities"
            icon={Filter}
          />

          {/* Status */}
          <Dropdown
            value={isDoneTask === undefined ? '' : isDoneTask ? 'done' : 'pending'}
            options={statusOptions}
            onChange={(value) =>
              setIsDoneTask(value === '' ? undefined : value === 'done')
            }
            placeholder="All Tasks"
            icon={CheckSquare}
          />
        </div>

        {/* Reset Filters Button */}
        {(search || fromDate || toDate || priority || isDoneTask !== undefined) && (
          <button
            onClick={handleResetFilters}
            className="mt-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white transition-all flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Clear Filters
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-6 pb-[150px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <CheckSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">No tasks found</p>
            <p className="text-sm">Try adjusting your filters or create a new task</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-5xl mx-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                  task.isDoneTask
                    ? 'bg-black/10 border-transparent opacity-50'
                    : 'bg-surface/60 border-glass-border hover:bg-surface'
                }`}
              >
                <div
                  onClick={() => handleToggleTaskDone(task)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 cursor-pointer transition-colors ${
                    task.isDoneTask
                      ? 'bg-purple-500 border-purple-500 text-white'
                      : 'border-slate-500 hover:border-purple-400'
                  }`}
                >
                  {task.isDoneTask && <CheckSquare className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      task.isDoneTask ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}
                  >
                    {task.task}
                  </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap justify-between items-center" >
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {task.taskDate && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3" />{' '}
                        {new Date(task.taskDate).toLocaleDateString()}
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        task.priority === 'high'
                          ? 'text-red-400 border-red-500/30 bg-red-500/10'
                          : task.priority === 'medium'
                          ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                          : 'text-slate-400 border-slate-600 bg-slate-700/30'
                      }`}
                    >
                      {task.priority}
                    </span>
                    
                    <span className="text-[10px] text-slate-500">
                      Created: {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                  {task.bot && (
                      <span
                        className="relative inline-block text-[9px] px-2 py-1 font-bold uppercase tracking-wider"
                        style={{
                          transform: 'rotate(-8deg)',
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
                         by: {task.bot.botName.toUpperCase()}[bot]
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
                  </div>
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous page"
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
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="p-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showAddModal || !!editingTask}
        onClose={() => {
          setShowAddModal(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        editingTask={editingTask}
        showGmailIdField={true}
      />

      {/* Loading Popup */}
      {(createTaskMutation.isPending ||
        updateTaskMutation.isPending ||
        deleteTaskMutation.isPending) && <Spinner fullScreen />}
    </div>
  );
};
