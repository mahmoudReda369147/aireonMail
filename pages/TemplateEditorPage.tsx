import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, X, Bot, ChevronRight, Wand2, CheckCircle2, Scissors, Feather, Briefcase, Smile, Zap, LayoutTemplate, Loader2, Tag, FileText } from 'lucide-react';
import { Button } from '../components/common/Button';
import { RichEditor } from '../components/common/RichEditor';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../components/common/Toast';
import { generateEmailDraft, improveDraft } from '../services/geminiService';
import { EmailTemplate } from '../types';
import { useCreateTemplate, useUpdateTemplate } from '../apis/hooks';
import { useEditorBackgroundColor } from '../hooks/useEditorBackgroundColor';

export const TemplateEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentAccount, t } = useAppContext();
  const { showToast } = useToast();
  const createTemplateMutation = useCreateTemplate();
  const updateTemplateMutation = useUpdateTemplate();

  const editingTemplate = location.state?.template as EmailTemplate | undefined;

  const {
    bgColor: templateBgColor,
    setBgColor: setTemplateBgColor,
    wrapWithFullHTML,
    extractBgColorFromHTML,
    unwrapHTML
  } = useEditorBackgroundColor();

  // Form State
  const [name, setName] = useState(editingTemplate?.name || '');
  const [category, setCategory] = useState(editingTemplate?.category || '');
  const [subject, setSubject] = useState(editingTemplate?.subject || '');
  const [body, setBody] = useState('');

  // AI Assistant State
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load and unwrap existing template body when editing
  useEffect(() => {
    if (editingTemplate?.body) {
      // Extract background color from existing template
      const extractedColor = extractBgColorFromHTML(editingTemplate.body);
      if (extractedColor) {
        setTemplateBgColor(extractedColor);
      }

      // Unwrap HTML to get clean content for editing
      const unwrappedBody = unwrapHTML(editingTemplate.body);
      setBody(unwrappedBody);
    }
  }, [editingTemplate, extractBgColorFromHTML, setTemplateBgColor, unwrapHTML]);

  const handleSave = async () => {
    if(!name || !subject || !body) {
        showToast(t('template_editor.fill_required_fields'), "error");
        return;
    }

    // Wrap the body with full HTML including background color
    const wrappedBody = wrapWithFullHTML(body);

    if (editingTemplate) {
        try {
            await updateTemplateMutation.mutateAsync({
                id: editingTemplate.id,
                data: {
                    name,
                    subject,
                    body: wrappedBody,
                    categure: category || 'General',
                    isFavorets: false // Default to false since we don't have this field in the UI
                }
            });
            showToast(t('template_editor.template_updated'), "success");
        } catch (error) {
            console.error('Failed to update template:', error);
            showToast(error instanceof Error ? error.message : t('template_editor.failed_update'), "error");
            return;
        }
    } else {
        try {
            await createTemplateMutation.mutateAsync({
                name,
                subject,
                body: wrappedBody,
                categure: category || 'General'
            });
            showToast(t('template_editor.template_created'), "success");
        } catch (error) {
            console.error('Failed to create template:', error);
            showToast(error instanceof Error ? error.message : t('template_editor.failed_create'), "error");
            return;
        }
    }
    navigate('/templates');
  };

  // AI Functions (Reused from ComposePage for consistency)
  const handleGenerateDraft = async () => {
      if (!aiPrompt) return;
      setIsAiLoading(true);
      try {
          const draft = await generateEmailDraft(aiPrompt, currentAccount.name);
          if (draft) setBody(draft.replace(/\n/g, '<br>'));
      } catch (e) {
          showToast(t('template_editor.failed_generate'), "error");
      } finally {
          setIsAiLoading(false);
      }
  };

  const handleImproveText = async (instruction: string) => {
      if (!body) return;
      setIsAiLoading(true);
      try {
          const improved = await improveDraft(body, instruction);
          if (improved) setBody(improved.replace(/\n/g, '<br>'));
      } catch (e) {
          showToast(t('template_editor.failed_improve'), "error");
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
    <div className="flex h-full relative overflow-hidden lg:flex-row">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-y-auto custom-scrollbar lg:border-r lg:border-glass-border">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <button onClick={() => navigate('/templates')} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> {t('template_editor.back')}
                </button>
                <div className="flex items-center gap-4 h-full">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2 hidden md:flex">
                        <LayoutTemplate className="w-5 h-5 text-fuchsia-500" />
                        {editingTemplate ? t('template_editor.edit_template') : t('template_editor.new_template')}
                    </h1>
                    
                    <button 
                        onClick={() => setShowAi(!showAi)}
                        className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-300 ${
                            showAi 
                            ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.4)]' 
                            : 'bg-glass border-glass-border text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Sparkles className={`w-4 h-4 ${showAi ? 'animate-spin-slow' : ''}`} />
                        {showAi ? t('template_editor.close_companion') : t('template_editor.ai_companion')}
                    </button>
                </div>
            </div>

            <div className="bg-glass border border-glass-border rounded-[2rem] flex-1 flex flex-col backdrop-blur-xl shadow-2xl relative  ">
                
                {/* Form Fields Section */}
                <div className="p-8 pb-0 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="relative group">
                             <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest pointer-events-none group-focus-within:text-fuchsia-500 transition-colors flex items-center gap-2">
                                <FileText className="w-3 h-3" /> {t('template_editor.name')}
                             </span>
                             <input 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-20 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                placeholder={t('template_editor.name_placeholder')} 
                            />
                        </div>
                        <div className="relative group">
                             <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest pointer-events-none group-focus-within:text-fuchsia-500 transition-colors flex items-center gap-2">
                                <Tag className="w-3 h-3" /> {t('template_editor.category')}
                             </span>
                             <input 
                                value={category} 
                                onChange={e => setCategory(e.target.value)} 
                                className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-28 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                placeholder={t('template_editor.category_placeholder')} 
                            />
                        </div>
                    </div>

                    <div className="relative group">
                         <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest pointer-events-none group-focus-within:text-fuchsia-500 transition-colors">{t('template_editor.subject')}</span>
                         <input 
                            value={subject} 
                            onChange={e => setSubject(e.target.value)} 
                            className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-24 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-medium"
                            placeholder={t('template_editor.subject_placeholder')} 
                        />
                    </div>
                </div>

                {/* Editor Section */}
                <div className="flex-1 flex flex-col  relative p-8 pt-6 h-full">
                    <RichEditor
                        value={body}
                        onChange={setBody}
                        onBackgroundColorChange={setTemplateBgColor}
                        initialBackgroundColor={templateBgColor}
                        className="flex-1 border-none bg-transparent shadow-none !ring-0 !p-0"
                        placeholder={t('template_editor.editor_placeholder')}
                    />
                    
                    {isAiLoading && (
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-b-[2rem]">
                             <div className="flex items-center gap-3 bg-[#1A1B2E] border border-fuchsia-500/30 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
                                <Loader2 className="w-5 h-5 text-fuchsia-500 animate-spin" />
                                <span className="font-bold text-white tracking-wide">{t('template_editor.gemini_writing')}</span>
                             </div>
                        </div>
                    )}
                </div>

                {/* Footer Toolbar */}
                <div className="p-4 bg-[#0F1020]/50 border-t border-white/5 backdrop-blur-md flex items-center justify-between">
                     <div className="flex items-center gap-2 text-xs text-slate-500">
                        {/* Optional status text or helper */}
                        <span className="hidden sm:inline">{t('template_editor.pro_tip')}</span>
                     </div>

                     <button 
                        onClick={handleSave} 
                        className="group relative px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)] transition-all active:scale-95 flex items-center gap-2 "
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 blur-md"></div>
                        <span className="relative z-10">{t('template_editor.save_template')}</span>
                        <Save className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform" />
                    </button>
                </div>

            </div>
        </div>

        {/* AI Sidebar */}
        <div className={`w-[400px] bg-[#0F1020]/95 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-500 lg:relative lg:translate-x-0 absolute right-0 top-0 bottom-0 z-40 ${showAi ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div>
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-500" />
                    {t('template_editor.gemini_companion')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{t('template_editor.powered_by')}</p>
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
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('template_editor.draft_content')}</label>
                    </div>
                    
                    <div className="relative group">
                        <textarea 
                            className="w-full h-32 bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-fuchsia-500/50 resize-none transition-colors"
                            placeholder={t('template_editor.draft_placeholder')}
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
                </section>

                <div className="h-px bg-white/5 w-full"></div>

                {/* Tools */}
                <section className={!body ? 'opacity-50 pointer-events-none grayscale' : 'transition-opacity'}>
                    <div className="flex items-center gap-2 mb-4">
                        <Wand2 className="w-4 h-4 text-cyan-400" />
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('template_editor.refine')}</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <ToolCard 
                            icon={CheckCircle2} 
                            label={t('template_editor.fix_grammar')} 
                            color="text-emerald-400" 
                            onClick={() => handleImproveText("Fix grammar and spelling errors")} 
                        />
                        <ToolCard 
                            icon={Scissors} 
                            label={t('template_editor.shorten')} 
                            color="text-orange-400" 
                            onClick={() => handleImproveText("Make it more concise")} 
                        />
                        <ToolCard 
                            icon={Feather} 
                            label={t('template_editor.expand')} 
                            color="text-blue-400" 
                            onClick={() => handleImproveText("Expand with more details")} 
                        />
                        <ToolCard 
                            icon={Briefcase} 
                            label={t('template_editor.formalize')} 
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
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('template_editor.adjust_tone')}</label>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x">
                        {[
                            { label: t('template_editor.friendly'), icon: Smile, color: 'text-yellow-400', prompt: 'Make it friendly and warm' },
                            { label: t('template_editor.urgent'), icon: Zap, color: 'text-red-400', prompt: 'Make it urgent and direct' },
                            { label: t('template_editor.confident'), icon: CheckCircle2, color: 'text-blue-400', prompt: 'Make it confident and assertive' },
                            { label: t('template_editor.casual'), icon: Feather, color: 'text-green-400', prompt: 'Make it casual and relaxed' },
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
};