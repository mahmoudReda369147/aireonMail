import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { EmailListItem } from '../components/EmailListItem';
import { Button } from '../components/common/Button';
import { TextArea } from '../components/common/Input';
import { Bot, Zap, Clock, MessageSquare, CheckCircle, PauseCircle, PlayCircle, Sliders, ChevronRight, Activity, Wand2, RefreshCcw } from 'lucide-react';
import { useToast } from '../components/common/Toast';

export const ConversationAutomationPage: React.FC = () => {
  const { emails, threadAutomations, updateThreadAutomation } = useAppContext();
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Filter for threads (inbox emails for now)
  const threads = emails.filter(e => e.folder === 'inbox');
  const selectedThread = threads.find(e => e.id === id);
  const config = id ? threadAutomations[id] || {
    threadId: id,
    active: false,
    autoReply: { enabled: false, tone: 'Professional', matchMyStyle: false },
    actions: { summarize: false, extractTasks: false, autoLabel: false, translate: false },
    customPrompt: '',
    logs: []
  } : null;

  const handleToggleActive = () => {
    if(!id || !config) return;
    updateThreadAutomation(id, { active: !config.active });
    showToast(config.active ? "Automation Paused" : "Automation Activated", config.active ? "info" : "success");
  };

  const updateConfig = (key: string, value: any) => {
    if(!id) return;
    // Helper to deeply update nested objects slightly hacky for demo
    if(key.includes('.')) {
        const [parent, child] = key.split('.');
        // @ts-ignore
        updateThreadAutomation(id, { [parent]: { ...config[parent], [child]: value } });
    } else {
        updateThreadAutomation(id, { [key]: value });
    }
  };

  return (
    <>
      {/* Thread Selector Sidebar */}
      <div className={`flex flex-col w-full md:w-[360px] border-r border-glass-border bg-black/20 z-0 transition-transform ${id ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-5 flex justify-between items-center border-b border-glass-border/50">
             <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                 <Bot className="w-5 h-5 text-fuchsia-500" />
                 Thread Bots
             </h2>
             <span className="text-xs bg-fuchsia-500/10 text-fuchsia-400 px-2 py-1 rounded-full border border-fuchsia-500/20">Beta</span>
         </div>
         <div className="p-4">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Select a conversation</div>
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {threads.map(email => (
                    <div key={email.id} className="relative">
                        <EmailListItem email={email} basePath="/thread-automation" />
                        {threadAutomations[email.id]?.active && (
                            <div className="absolute top-7 right-7">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            </div>
                        )}
                    </div>
                 ))}
             </div>
         </div>
      </div>

      {/* Configuration Panel */}
      <div className={`flex-1 flex flex-col bg-transparent ${!id ? 'hidden md:flex' : 'flex'}`}>
         {selectedThread && config ? (
             <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-glass-border bg-glass backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                            <span>Automation</span>
                            <ChevronRight className="w-3 h-3" />
                            <span>{selectedThread.sender}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white truncate max-w-md">{selectedThread.subject}</h1>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-surface/50 p-2 rounded-2xl border border-glass-border">
                        <div className={`flex flex-col px-2 ${config.active ? 'text-green-400' : 'text-slate-500'}`}>
                            <span className="text-[10px] font-bold uppercase tracking-widest">{config.active ? 'Active' : 'Paused'}</span>
                            <span className="text-xs font-medium">Auto-pilot mode</span>
                        </div>
                        <button 
                            onClick={handleToggleActive}
                            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${config.active ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md flex items-center justify-center ${config.active ? 'translate-x-6' : 'translate-x-0'}`}>
                                {config.active ? <Zap className="w-3 h-3 text-green-600" /> : <PauseCircle className="w-3 h-3 text-slate-400" />}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">
                        
                        {/* Left Column: Rules */}
                        <div className="space-y-6">
                            
                            {/* Auto Reply Card */}
                            <div className="bg-glass border border-glass-border rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100"></div>
                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">Auto Reply</h3>
                                            <p className="text-xs text-slate-400">Handle incoming messages automatically</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={config.autoReply.enabled} onChange={(e) => updateConfig('autoReply.enabled', e.target.checked)} />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-500"></div>
                                    </label>
                                </div>

                                {config.autoReply.enabled && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Reply Tone</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Professional', 'Friendly', 'Concise', 'Detailed'].map(tone => (
                                                    <button 
                                                        key={tone}
                                                        onClick={() => updateConfig('autoReply.tone', tone)}
                                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${config.autoReply.tone === tone ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-lg shadow-fuchsia-500/20' : 'bg-surface border-glass-border text-slate-400 hover:text-white'}`}
                                                    >
                                                        {tone}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-glass-border">
                                            <span className="text-sm text-slate-300">Match my writing style</span>
                                            <input type="checkbox" checked={config.autoReply.matchMyStyle} onChange={e => updateConfig('autoReply.matchMyStyle', e.target.checked)} className="w-4 h-4 accent-fuchsia-500 rounded cursor-pointer" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions Card */}
                            <div className="bg-glass border border-glass-border rounded-3xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-lg">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Smart Actions</h3>
                                        <p className="text-xs text-slate-400">Process content on arrival</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    {[
                                        { key: 'summarize', label: 'Summarize Message', desc: 'Create a 1-sentence summary' },
                                        { key: 'extractTasks', label: 'Extract Tasks', desc: 'Find action items and deadlines' },
                                        { key: 'autoLabel', label: 'Auto-Label', desc: 'Tag based on content analysis' },
                                        { key: 'translate', label: 'Translate', desc: 'Translate to English automatically' }
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                                            <div>
                                                <div className="text-sm font-bold text-slate-200">{item.label}</div>
                                                <div className="text-xs text-slate-500">{item.desc}</div>
                                            </div>
                                            {/* @ts-ignore */}
                                            <input type="checkbox" checked={config.actions[item.key]} onChange={e => updateConfig(`actions.${item.key}`, e.target.checked)} className="w-5 h-5 accent-cyan-500 rounded cursor-pointer" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Prompt & Logs */}
                        <div className="space-y-6">
                            
                            {/* Custom Prompt */}
                            <div className="bg-glass border border-glass-border rounded-3xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                     <div className="flex items-center gap-2">
                                         <Wand2 className="w-5 h-5 text-purple-400" />
                                         <h3 className="font-bold text-white">Custom Instructions</h3>
                                     </div>
                                     <button className="text-xs text-purple-400 hover:text-purple-300 font-medium">Load Template</button>
                                </div>
                                <div className="relative">
                                    <TextArea 
                                        value={config.customPrompt}
                                        onChange={e => updateConfig('customPrompt', e.target.value)}
                                        placeholder="E.g. If the client asks for pricing, attach the Q4 PDF and cc the sales manager..."
                                        rows={6}
                                        className="bg-black/20 font-light text-sm leading-relaxed"
                                    />
                                    <div className="absolute bottom-4 right-4 flex gap-2">
                                        <Button variant="ghost" className="bg-glass-hover text-xs py-1 px-2 h-auto">Preview Output</Button>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div className="bg-glass border border-glass-border rounded-3xl p-6 flex-1 min-h-[300px]">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-slate-400" />
                                        <h3 className="font-bold text-white">Activity Log</h3>
                                    </div>
                                    <button className="text-slate-500 hover:text-white"><RefreshCcw className="w-4 h-4" /></button>
                                </div>

                                <div className="space-y-4">
                                    {config.logs.length === 0 ? (
                                        <div className="text-center text-slate-500 py-10">
                                            <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p>No activity recorded yet</p>
                                        </div>
                                    ) : (
                                        config.logs.map(log => (
                                            <div key={log.id} className="flex gap-4 items-start relative group">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-2 h-2 rounded-full mt-2 ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <div className="w-0.5 h-full bg-glass-border absolute top-4 group-last:hidden"></div>
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-sm font-bold text-slate-200">{log.action}</span>
                                                        <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">{log.details}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
             </div>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <div className="w-24 h-24 bg-glass border border-glass-border rounded-3xl flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/5"></div>
                    <Bot className="w-10 h-10 opacity-50" />
                </div>
                <p className="font-medium text-xl text-slate-300">Select a thread to automate</p>
                <p className="text-sm opacity-50 mt-2">Configure AI rules for specific conversations.</p>
            </div>
         )}
      </div>
    </>
  );
};