import React, { useState, useEffect } from 'react';
import { Plus, X, Edit3, CheckCircle2, Filter } from 'lucide-react';
import { Button } from './common/Button';
import { Dropdown } from './common/Dropdown';
import { TaskData } from '../apis/services';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    task: string;
    taskDate: string;
    priority: 'low' | 'medium' | 'high';
    gmailId?: string;
  }) => void;
  editingTask?: TaskData | null;
  defaultGmailId?: string;
  showGmailIdField?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTask,
  defaultGmailId = '',
  showGmailIdField = true,
}) => {
  const [taskForm, setTaskForm] = useState({
    task: '',
    taskDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    gmailId: defaultGmailId,
  });

  const modalPriorityOptions = [
    { label: '🔴 High Priority', value: 'high' },
    { label: '🟡 Medium Priority', value: 'medium' },
    { label: '🟢 Low Priority', value: 'low' },
  ];

  // Load editing task data when provided
  useEffect(() => {
    if (editingTask) {
      setTaskForm({
        task: editingTask.task,
        taskDate: editingTask.taskDate
          ? new Date(editingTask.taskDate).toISOString().slice(0, 16)
          : '',
        priority: editingTask.priority as 'low' | 'medium' | 'high',
        gmailId: editingTask.gmailId || defaultGmailId,
      });
    } else {
      setTaskForm({
        task: '',
        taskDate: '',
        priority: 'medium',
        gmailId: defaultGmailId,
      });
    }
  }, [editingTask, defaultGmailId]);

  const handleClose = () => {
    setTaskForm({
      task: '',
      taskDate: '',
      priority: 'medium',
      gmailId: defaultGmailId,
    });
    onClose();
  };

  const handleSubmit = () => {
    if (!taskForm.task.trim()) return;
    onSubmit(taskForm);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div
        className="bg-gradient-to-br from-slate-900/95 via-purple-900/20 to-slate-900/95 backdrop-blur-xl border border-purple-500/20 rounded-3xl w-full max-w-2xl shadow-2xl shadow-purple-500/30 overflow-hidden"
        style={{
          animation: 'modalPopup 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-purple-500/10 bg-gradient-to-r from-purple-500/5 to-fuchsia-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-400/20">
                {editingTask ? (
                  <Edit3 className="w-5 h-5 text-purple-300" />
                ) : (
                  <Plus className="w-5 h-5 text-purple-300" />
                )}
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-200 via-fuchsia-200 to-purple-300 bg-clip-text text-transparent">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
            </div>
            <button
              onClick={handleClose}
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
              value={taskForm.task}
              onChange={(e) => setTaskForm({ ...taskForm, task: e.target.value })}
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
                value={taskForm.taskDate}
                onChange={(e) => setTaskForm({ ...taskForm, taskDate: e.target.value })}
                className="w-full bg-black/40 border border-purple-500/20 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-400/50 focus:bg-black/50 focus:ring-2 focus:ring-fuchsia-500/10 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Priority
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
                placeholder="Select Priority"
                icon={Filter}
              />
            </div>
          </div>

          {showGmailIdField && !editingTask && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                Gmail ID
                <span className="text-xs text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={taskForm.gmailId}
                onChange={(e) => setTaskForm({ ...taskForm, gmailId: e.target.value })}
                className="w-full bg-black/40 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-green-400/50 focus:bg-black/50 focus:ring-2 focus:ring-green-500/10 transition-all duration-200"
                placeholder="Enter Gmail ID (optional)..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gradient-to-r from-purple-500/5 to-fuchsia-500/5 border-t border-purple-500/10 flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="hover:bg-white/10"
          >
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200"
            disabled={!taskForm.task.trim()}
          >
            <CheckCircle2 className="w-4 h-4" />{' '}
            {editingTask ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </div>
    </div>
  );
};
