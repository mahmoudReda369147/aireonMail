import React, { useState, useEffect } from 'react';
import { Email, Task } from '../types';
import { ArrowLeft, Sparkles, Trash2, MoreVertical, Paperclip, Send, Image as ImageIcon, Edit3, CheckSquare, Calendar, Clock, Users, Plus, X, Bot, ChevronRight, Wand2, CheckCircle2, Scissors, Feather, Briefcase, Smile, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './common/Button';
import { RichEditor } from './common/RichEditor'; // Import the new editor
import { generateReply, editImage, analyzeActionItems, improveDraft } from '../services/geminiService';
import { useToast } from './common/Toast';
import { useAppContext } from '../contexts/AppContext';

interface Props {
    email: Email;
}

export const EmailDetail: React.FC<Props> = ({ email }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { updateEmail, deleteEmail, requestConfirm } = useAppContext();
  const [replyHtml, setReplyHtml] = useState(''); // Changed to replyHtml
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [detectedMeeting, setDetectedMeeting] = useState<any>(null);

  // AI Assistant State
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Reset state when email changes
  useEffect(() => {
    setReplyHtml('');
    setDetectedMeeting(null);
    setShowAi(false);
    setAiPrompt('');
  }, [email.id]);

  const handleDelete = () => {
    requestConfirm({
        title: "Delete Email",
        message: "Are you sure you want to move this conversation to Trash?",
        onConfirm: () => {
            deleteEmail(email.id);
            showToast("Email deleted", "info");
            navigate(-1);
        },
        variant: "danger"
    });
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
    setIsAnalyzing(true);
    setDetectedMeeting(null);
    try {
        const result = await analyzeActionItems(email.body, email.subject);
        
        // Handle Tasks
        if (result.tasks && result.tasks.length > 0) {
            const newTasks: Task[] = result.tasks.map((t: any) => ({ 
                ...t, 
                id: Math.random().toString(36).substr(2, 9), 
                completed: false 
            }));
            const updatedTasks = [...(email.tasks || []), ...newTasks];
            updateEmail(email.id, { tasks: updatedTasks });
        }

        // Handle Meeting
        if (result.meeting) {
            setDetectedMeeting(result.meeting);
            showToast("Meeting detected!", "success");
        }

        if (result.tasks.length > 0 || result.meeting) {
            showToast(`Analysis complete: ${result.tasks.length} tasks, ${result.meeting ? '1 meeting' : '0 meetings'}.`, "success");
        } else {
             showToast("No new actions detected.", "info");
        }

    } catch (e) {
        showToast("Analysis failed", "error");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const toggleTask = (taskId: string) => {
      const updatedTasks = email.tasks?.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      updateEmail(email.id, { tasks: updatedTasks });
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
      showToast("Event added to your calendar", "success");
      setDetectedMeeting(null); // Clear after adding
  };

  const handleSendReply = () => {
      console.log("Sending HTML Content:", replyHtml);
      if (!replyHtml.trim()) {
          showToast("Please write a message first", "error");
          return;
      }
      showToast("Reply sent successfully!", "success");
      setReplyHtml("");
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

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-glass-border flex justify-between items-center bg-glass backdrop-blur-md sticky top-0 z-10 shrink-0">
            <button onClick={() => navigate(-1)} className="md:hidden flex items-center gap-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <div className="flex gap-3 ml-auto">
                <Button variant="secondary" onClick={handleAnalyzeActions} isLoading={isAnalyzing} icon={Sparkles}>
                    Smart Actions
                </Button>
                <Button 
                    variant="secondary" 
                    onClick={() => setShowAi(!showAi)} 
                    isLoading={isGenerating} 
                    icon={Sparkles}
                    className={`transition-all ${showAi ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-100 hover:bg-fuchsia-500/20'}`}
                >
                    {showAi ? 'Close Assistant' : 'AI Reply'}
                </Button>
                <Button variant="icon" icon={Trash2} onClick={handleDelete} />
                <Button variant="icon" icon={MoreVertical} />
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full custom-scrollbar relative z-0">
            <h1 className="text-3xl font-bold text-white mb-6 leading-tight tracking-tight">{email.subject}</h1>
            
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
                <div className="text-sm font-medium text-slate-500 bg-surface px-3 py-1 rounded-full border border-glass-border">{email.timestamp}</div>
            </div>

            {/* AI Insights, Meetings & Tasks Section */}
            <div className="grid gap-6 mb-8">
                {email.isSmart && (
                    <div className="bg-gradient-to-r from-fuchsia-900/10 to-purple-900/10 p-6 rounded-2xl border border-fuchsia-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-24 h-24 text-fuchsia-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-fuchsia-400" />
                            <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest">AI Insight</span>
                        </div>
                        <p className="text-base text-slate-200 leading-relaxed font-light">{email.summary}</p>
                    </div>
                )}
                
                {/* Meeting Detected Card */}
                {detectedMeeting && (
                    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 p-6 rounded-2xl border border-blue-500/30 relative overflow-hidden animate-in fade-in slide-in-from-top-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                        <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-400" />
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Suggested Event</span>
                             </div>
                             <Button onClick={addToCalendar} className="bg-blue-600 hover:bg-blue-500 text-xs py-1.5 px-4 shadow-lg shadow-blue-500/30 h-8">
                                <Plus className="w-3 h-3" /> Add to Calendar
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
                                    <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block mb-1">Agenda</span>
                                    {detectedMeeting.agenda}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {email.tasks && email.tasks.length > 0 && (
                    <div className="bg-gradient-to-r from-emerald-900/10 to-teal-900/10 p-6 rounded-2xl border border-emerald-500/20 relative overflow-hidden animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Action Items</span>
                            </div>
                            <span className="text-xs text-slate-500 bg-black/20 px-2 py-1 rounded-lg">{email.tasks.filter(t => !t.completed).length} pending</span>
                        </div>
                        <div className="space-y-3">
                            {email.tasks.map(task => (
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
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="prose prose-invert max-w-none text-slate-300 mb-10 whitespace-pre-line leading-relaxed font-light text-lg">
                {email.body}
            </div>

            {/* Attachments */}
            {email.attachments?.length && (
                <div className="pt-2">
                    <h4 className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <Paperclip className="w-4 h-4" /> Attachments
                    </h4>
                    <div className="flex flex-wrap gap-4">
                        {email.attachments.map((att, idx) => (
                            <div key={idx} className="group relative w-56 rounded-2xl overflow-hidden border border-glass-border bg-surface transition-all hover:border-slate-600 hover:shadow-xl">
                                <div className="h-32 overflow-hidden bg-black">
                                    <img src={att.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" alt="attachment" />
                                </div>
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                    <button 
                                        onClick={() => { setEditingImage(att.url); setImagePrompt(''); }}
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
                        placeholder="Write a reply... (Supports Rich Text & Documents)" 
                        className="min-h-[200px]"
                    />
                </div>
                <div className="flex justify-between items-center p-2 px-3">
                    <div className="flex gap-1"></div>
                    <Button onClick={handleSendReply}>
                        <Send className="w-4 h-4" /> Send Reply
                    </Button>
                </div>
            </div>
        </div>

        {/* AI Sidebar */}
        <div className={`w-[400px] bg-[#0F1020]/95 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-500 absolute right-0 top-0 bottom-0 z-40 ${showAi ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-500" />
                    AI Reply Assistant
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Context-aware replies powered by Gemini 3 Pro</p>
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
    </div>
  );
};