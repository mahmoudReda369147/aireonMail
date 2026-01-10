import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Clock, X, Sparkles, Wand2, Bot, Loader2, CheckCircle2, Scissors, Feather, Briefcase, Zap, Smile, ChevronRight, LayoutTemplate, ChevronDown } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { RichEditor } from '../components/common/RichEditor';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../components/common/Toast';
import { generateEmailDraft, improveDraft } from '../services/geminiService';
import { EmailTemplate } from '../types';
import { useGmailSend } from '../apis/hooks';
import { useEditorBackgroundColor } from '../hooks/useEditorBackgroundColor';

export const ComposePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, currentAccount, templates } = useAppContext();
  const { showToast } = useToast();
  const gmailSend = useGmailSend();
  
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const { setBgColor: setBodyBgColor, wrapWithFullHTML } = useEditorBackgroundColor();
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Templates State
  const [showTemplates, setShowTemplates] = useState(false);

  // AI Assistant State
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Check for template data passed via navigation state
  useEffect(() => {
    if (location.state?.template) {
        setSubject(location.state.template.subject);
        setBody(location.state.template.body);
        showToast(`Template "${location.state.template.name}" applied`, 'info');
    }
  }, [location]);

  const handleSend = async () => {
    if (!to || !subject) {
        showToast("Please fill in recipient and subject", "error");
        return;
    }
    if (!isValidEmail(to)) {
        showToast("Please enter a valid email address", "error");
        return;
    }

    try {
        await gmailSend.mutateAsync({
            to: to.trim(),
            subject: subject.trim(),
            body: wrapWithFullHTML(body),
            cc: undefined, // Optional - can be added later
            bcc: undefined // Optional - can be added later
        });

        showToast("Message sent successfully!", "success");
        navigate('/inbox');
    } catch (error) {
        console.error('Failed to send email:', error);
        showToast(error instanceof Error ? error.message : "Failed to send message", "error");
    }
  };

  const handleSchedule = () => {
    if (!scheduleDate) return;
    if (!to || !subject) {
        showToast("Please fill in recipient and subject", "error");
        return;
    }
    if (!isValidEmail(to)) {
        showToast("Please enter a valid email address", "error");
        return;
    }
    showToast(`Message scheduled for ${new Date(scheduleDate).toLocaleString()}`, "success");
    setIsScheduling(false);
    navigate('/inbox');
  };

  const handleApplyTemplate = (template: EmailTemplate) => {
      setSubject(template.subject);
      setBody(template.body);
      setShowTemplates(false);
      showToast(`Template "${template.name}" applied`, 'success');
  };

  // AI Functions
  const handleGenerateDraft = async () => {
      if (!aiPrompt) return;
      setIsAiLoading(true);
      try {
          const draft = await generateEmailDraft(aiPrompt, currentAccount.name);
          // Simple new line replacement for HTML
          if (draft) setBody(draft.replace(/\n/g, '<br>'));
      } catch (e) {
          showToast("Failed to generate draft", "error");
      } finally {
          setIsAiLoading(false);
      }
  };

  const handleImproveText = async (instruction: string) => {
      if (!body) return;
      setIsAiLoading(true);
      try {
          // Pass plain text for improvement for now, or raw HTML if model supports
          const improved = await improveDraft(body, instruction);
          if (improved) setBody(improved.replace(/\n/g, '<br>'));
      } catch (e) {
          showToast("Failed to improve text", "error");
      } finally {
          setIsAiLoading(false);
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

  return (
    <div className="flex h-full  relative w-full lg:flex-row">
        {/* Main Compose Area */}
        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-y-auto custom-scrollbar lg:border-r lg:border-glass-border">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> {t('common.back')}
                </button>
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white hidden md:block">{t('compose.title')}</h1>
                    
                    {/* Templates Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowTemplates(!showTemplates)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-300 group ${
                                showTemplates 
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                                : 'bg-glass border-glass-border text-slate-300 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            <span className="hidden sm:inline">Templates</span>
                            <ChevronDown className={`w-3 h-3 ml-1 transition-transform duration-300 ${showTemplates ? 'rotate-180' : 'text-slate-500 group-hover:text-white'}`} />
                        </button>
                        
                        {showTemplates && (
                            <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowTemplates(false)}></div>
                            <div className="absolute top-full right-0 mt-2 w-72 bg-[#1A1B2E] border border-glass-border rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 z-50">
                                <div className="p-3 border-b border-glass-border bg-black/20 flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Template</h4>
                                    <button onClick={() => navigate('/templates')} className="text-[10px] text-fuchsia-400 hover:text-fuchsia-300 font-bold">Manage</button>
                                </div>
                                <div className=" overflow-y-auto custom-scrollbar">
                                    {templates.length === 0 ? (
                                        <div className="p-6 text-center text-slate-500 text-xs">
                                            <LayoutTemplate className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            No templates found
                                        </div>
                                    ) : (
                                        templates.map(tmpl => (
                                            <button 
                                                key={tmpl.id}
                                                onClick={() => handleApplyTemplate(tmpl)}
                                                className="w-full text-left p-4 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors group"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors truncate pr-2">{tmpl.name}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-slate-500 uppercase shrink-0">{tmpl.category}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 truncate">{tmpl.subject}</div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                            </>
                        )}
                    </div>

                    {/* AI Toggle Button - Hidden on large screens, always visible on small screens */}
                    <button 
                        onClick={() => setShowAi(!showAi)}
                        className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-300 ${
                            showAi 
                            ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.4)]' 
                            : 'bg-glass border-glass-border text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Sparkles className={`w-4 h-4 ${showAi ? 'animate-spin-slow' : ''}`} />
                        {showAi ? 'Close Companion' : 'AI Companion'}
                    </button>
                </div>
            </div>

            <div className="bg-glass border border-glass-border rounded-[2rem] flex-1 flex flex-col backdrop-blur-xl shadow-2xl relative ">
                
                <div className="p-8 pb-0 space-y-5">
                    <div className="relative group">
                         <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest pointer-events-none group-focus-within:text-fuchsia-500 transition-colors">To</span>
                         <input 
                            value={to} 
                            onChange={e => setTo(e.target.value)} 
                            className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                            placeholder="recipient@example.com" 
                        />
                    </div>
                    <div className="relative group">
                         <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest pointer-events-none group-focus-within:text-fuchsia-500 transition-colors">Subject</span>
                         <input 
                            value={subject} 
                            onChange={e => setSubject(e.target.value)} 
                            className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-20 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-medium"
                            placeholder="What is this about?" 
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col  relative p-8 pt-6">
                    <RichEditor
                        value={body}
                        onChange={setBody}
                        onBackgroundColorChange={setBodyBgColor}
                        className="flex-1 min-h-[300px] border-none bg-transparent shadow-none !ring-0 !p-0"
                        placeholder="Start writing your masterpiece..."
                    />
                    
                    {isAiLoading && (
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-10 flex items-center justify-center">
                             <div className="flex items-center gap-3 bg-[#1A1B2E] border border-fuchsia-500/30 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
                                <Loader2 className="w-5 h-5 text-fuchsia-500 animate-spin" />
                                <span className="font-bold text-white tracking-wide">Gemini is thinking...</span>
                             </div>
                        </div>
                    )}
                </div>

                {/* Footer Toolbar */}
                <div className="p-3 sm:p-4 bg-[#0F1020]/50 border-t border-white/5 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                     <div className="hidden sm:flex items-center gap-2">
                        {/* Formatting tools hint could go here */}
                     </div>

                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <button
                                onClick={() => setIsScheduling(!isScheduling)}
                                className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${
                                    isScheduling
                                    ? 'bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-400'
                                    : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="Schedule Send"
                            >
                                <Clock className="w-5 h-5" />
                                <span className="sm:hidden font-medium text-sm">Schedule Send</span>
                            </button>
                            
                            {isScheduling && (
                                <div className="absolute bottom-full right-0 mb-4 w-72 bg-[#1A1B2E] border border-glass-border rounded-2xl p-5 shadow-2xl z-30 animate-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-white text-sm">Schedule Send</h4>
                                        <button onClick={() => setIsScheduling(false)}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
                                    </div>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full bg-black/30 border border-glass-border rounded-xl p-3 text-white text-sm mb-4 outline-none focus:border-fuchsia-500 color-scheme-dark"
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                    />
                                    <Button onClick={handleSchedule} className="w-full">
                                        Confirm Schedule
                                    </Button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSend}
                            className="group relative px-4 sm:px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)] transition-all active:scale-95 hover:scale-105 flex items-center justify-center gap-2 overflow-hidden w-full sm:w-auto"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 blur-md"></div>
                            <Send className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <span className="relative z-10">{t('compose.send')}</span>
                        </button>
                     </div>
                </div>

            </div>
        </div>

        {/* AI Sidebar */}
        <div className={`w-[400px] bg-[#0F1020]/95 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-500 lg:relative lg:translate-x-0 absolute right-0 top-0 bottom-0 z-40 ${showAi ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div>
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-500" />
                    Gemini Companion
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Powered by Gemini 1.5 Pro</p>
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
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">Draft New Content</label>
                    </div>
                    
                    <div className="relative group">
                        <textarea 
                            className="w-full h-32 bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-fuchsia-500/50 resize-none transition-colors"
                            placeholder="What should I write about? e.g. 'Ask for a refund nicely...'"
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                        />
                        <button 
                            onClick={handleGenerateDraft}
                            disabled={!aiPrompt || isAiLoading}
                            className="absolute bottom-3 right-3 p-2 bg-fuchsia-500 hover:bg-fuchsia-400 rounded-lg text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {[
                            "Write a follow up", 
                            "Request a meeting", 
                            "Say Thank You", 
                            "Polite Decline"
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

                {/* Tools */}
                <section className={!body ? 'opacity-50 pointer-events-none grayscale' : 'transition-opacity'}>
                    <div className="flex items-center gap-2 mb-4">
                        <Wand2 className="w-4 h-4 text-cyan-400" />
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">Quick Polish</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <ToolCard 
                            icon={CheckCircle2} 
                            label="Fix Grammar" 
                            color="text-emerald-400" 
                            onClick={() => handleImproveText("Fix grammar and spelling errors")} 
                        />
                        <ToolCard 
                            icon={Scissors} 
                            label="Shorten" 
                            color="text-orange-400" 
                            onClick={() => handleImproveText("Make it more concise")} 
                        />
                        <ToolCard 
                            icon={Feather} 
                            label="Expand" 
                            color="text-blue-400" 
                            onClick={() => handleImproveText("Expand with more details")} 
                        />
                        <ToolCard 
                            icon={Briefcase} 
                            label="Formalize" 
                            color="text-purple-400" 
                            onClick={() => handleImproveText("Make it professional and formal")} 
                        />
                    </div>
                </section>

                <div className="h-px bg-white/5 w-full"></div>

                {/* Tone */}
                <section className={!body ? 'opacity-50 pointer-events-none grayscale' : 'transition-opacity'}>
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
                                onClick={() => handleImproveText(tone.prompt)}
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
    </div>
  );
}