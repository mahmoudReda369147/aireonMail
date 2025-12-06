import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Input, TextArea } from '../components/common/Input';
import { Dropdown } from '../components/common/Dropdown';
import { useAppContext } from '../contexts/AppContext';
import { User, Sparkles, Monitor, Shield, LogOut, Mic, Volume2, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { appLogo, logout, liveAssistantConfig, setLiveAssistantConfig } = useAppContext();
  const navigate = useNavigate();
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@aireon.ai");
  const [signature, setSignature] = useState("Best,\nJohn Doe\nSent from Aireon");

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  const handleVoiceChange = (voice: any) => {
    setLiveAssistantConfig(prev => ({ ...prev, voice }));
  };

  const languageOptions = [
      { label: 'English', value: 'English' },
      { label: 'Spanish', value: 'Spanish' },
      { label: 'French', value: 'French' },
      { label: 'German', value: 'German' },
      { label: 'Portuguese', value: 'Portuguese' },
      { label: 'Hindi', value: 'Hindi' },
      { label: 'Japanese', value: 'Japanese' },
      { label: 'Arabic', value: 'Arabic' },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">Settings</h1>

        <div className="space-y-8">
            {/* Profile Section */}
            <section className="bg-glass border border-glass-border rounded-3xl p-8 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6">
                    <User className="w-6 h-6 text-fuchsia-500" />
                    <h2 className="text-xl font-bold text-white">Profile</h2>
                </div>
                
                <div className="flex items-start gap-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg shrink-0">
                        JD
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                                <Input value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                                <Input value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                        </div>
                        <Button variant="secondary">Update Profile</Button>
                    </div>
                </div>
            </section>

            {/* AI Preferences */}
            <section className="bg-glass border border-glass-border rounded-3xl p-8 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-6 h-6 text-cyan-500" />
                    <h2 className="text-xl font-bold text-white">AI Preferences</h2>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Smart Signature</label>
                        <TextArea value={signature} onChange={e => setSignature(e.target.value)} rows={3} />
                        <p className="text-xs text-slate-500 mt-2">Gemini will use this as context when generating replies.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="p-4 rounded-xl border border-glass-border bg-surface/50">
                             <h4 className="font-bold text-white mb-2">Auto-Analysis</h4>
                             <p className="text-sm text-slate-400 mb-4">Automatically analyze incoming emails for priority and tags using Gemini Flash Lite.</p>
                             <div className="flex items-center gap-2">
                                <div className="w-10 h-6 bg-fuchsia-500 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                </div>
                                <span className="text-sm font-bold text-white">Enabled</span>
                             </div>
                         </div>
                         <div className="p-4 rounded-xl border border-glass-border bg-surface/50">
                             <h4 className="font-bold text-white mb-2">Voice Assistant</h4>
                             <p className="text-sm text-slate-400 mb-4">Enable "Hey Gemini" wake word detection (Experimental).</p>
                             <div className="flex items-center gap-2">
                                <div className="w-10 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full"></div>
                                </div>
                                <span className="text-sm font-bold text-slate-400">Disabled</span>
                             </div>
                         </div>
                    </div>
                </div>
            </section>

            {/* Live Assistant Config */}
            <section className="bg-glass border border-glass-border rounded-3xl p-8 backdrop-blur-md relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/20 blur-3xl rounded-full pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <Mic className="w-6 h-6 text-fuchsia-500" />
                    <h2 className="text-xl font-bold text-white">Live Assistant</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Persona Name</label>
                         <Input 
                            value={liveAssistantConfig.name} 
                            onChange={e => setLiveAssistantConfig(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Jarvis"
                         />
                         <p className="text-xs text-slate-500 mt-2">What should the AI call itself?</p>
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Interaction Language</label>
                         <Dropdown 
                            label="Available Languages"
                            value={liveAssistantConfig.language}
                            onChange={(val) => setLiveAssistantConfig(prev => ({ ...prev, language: val }))}
                            options={languageOptions}
                            icon={Globe}
                            placeholder="Select Language"
                         />
                         <p className="text-xs text-slate-500 mt-2">The AI will speak and listen in this language.</p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Voice</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'].map((voice) => (
                                <button
                                    key={voice}
                                    onClick={() => handleVoiceChange(voice)}
                                    className={`relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 group ${
                                        liveAssistantConfig.voice === voice 
                                        ? 'bg-fuchsia-500/10 border-fuchsia-500 shadow-lg shadow-fuchsia-500/20' 
                                        : 'bg-surface/50 border-glass-border hover:bg-surface hover:border-slate-500'
                                    }`}
                                >
                                    <div className={`p-2 rounded-full ${liveAssistantConfig.voice === voice ? 'bg-fuchsia-500 text-white' : 'bg-black/20 text-slate-400 group-hover:text-white'}`}>
                                        <Volume2 className="w-5 h-5" />
                                    </div>
                                    <span className={`text-sm font-bold ${liveAssistantConfig.voice === voice ? 'text-white' : 'text-slate-300'}`}>{voice}</span>
                                    {liveAssistantConfig.voice === voice && (
                                        <div className="absolute inset-0 border-2 border-fuchsia-500 rounded-2xl pointer-events-none"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

             {/* Application */}
             <section className="bg-glass border border-glass-border rounded-3xl p-8 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6">
                    <Monitor className="w-6 h-6 text-purple-500" />
                    <h2 className="text-xl font-bold text-white">Application</h2>
                </div>

                <div className="flex flex-col gap-4">
                     <div className="flex items-center justify-between p-4 rounded-xl border border-glass-border bg-surface/30">
                         <div className="flex items-center gap-4">
                             {appLogo && <img src={appLogo} className="w-10 h-10 object-contain" alt="Brand" />}
                             <div>
                                 <div className="font-bold text-white">Custom Branding</div>
                                 <div className="text-xs text-slate-400">Generated by Gemini Nano</div>
                             </div>
                         </div>
                         <Button variant="secondary" onClick={() => window.location.reload()}>Regenerate</Button>
                     </div>
                     
                     <div className="flex items-center justify-between p-4 rounded-xl border border-glass-border bg-surface/30">
                         <div className="flex items-center gap-4">
                             <Shield className="w-6 h-6 text-green-400" />
                             <div>
                                 <div className="font-bold text-white">Security & Privacy</div>
                                 <div className="text-xs text-slate-400">End-to-end encryption enabled</div>
                             </div>
                         </div>
                         <Button variant="ghost">View Keys</Button>
                     </div>
                </div>
            </section>

            <div className="pt-4 flex justify-end">
                <Button onClick={handleLogout} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                </Button>
            </div>
        </div>
    </div>
  );
};