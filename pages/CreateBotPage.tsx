import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { RichEditor } from '../components/common/RichEditor';
import { Bot, Zap, MessageSquare, Wand2, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { useCreateBot } from '../apis/hooks';

export const CreateBotPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createBotMutation = useCreateBot();

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Create bot form state
  const [newBotData, setNewBotData] = useState({
    botName: '',
    emails: '',
    isactive: true,
    isAutoReply: true,
    replayTony: 'Professional',
    isautoSummarize: false,
    isautoExtractTaskes: false,
    isautoExtractMettengs: false,
    userPrompet: '',
  });

  // Handle create bot
  const handleCreateBot = async () => {
    if (!newBotData.botName || !newBotData.emails) {
      showToast('Please fill in bot name and emails', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await createBotMutation.mutateAsync(newBotData);
      showToast('Bot created successfully', 'success');

      // Navigate to the newly created bot
      navigate(`/thread-automation/bot/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create bot:', error);
      showToast('Failed to create bot', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="p-6 border-b border-glass-border bg-glass backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/thread-automation')}
              className="w-8 h-8 rounded-lg bg-surface/50 border border-glass-border text-slate-400 hover:text-white hover:bg-surface transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-fuchsia-500" />
              <h1 className="text-2xl font-bold text-white">Create New Bot</h1>
            </div>
          </div>
          <p className="text-sm text-slate-400 ml-11">Configure your automation assistant</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">

          {/* Left Column */}
          <div className="space-y-6">

            {/* Basic Info Card */}
            <div className="bg-glass border border-glass-border rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Bot Information</h3>
                  <p className="text-xs text-slate-400">Basic configuration</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Bot Name *
                  </label>
                  <input
                    type="text"
                    value={newBotData.botName}
                    onChange={(e) => setNewBotData({ ...newBotData, botName: e.target.value })}
                    placeholder="e.g., Customer Support Bot"
                    className="w-full px-4 py-3 bg-black/20 border border-glass-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newBotData.emails}
                    onChange={(e) => setNewBotData({ ...newBotData, emails: e.target.value })}
                    placeholder="e.g., support@company.com"
                    className="w-full px-4 py-3 bg-black/20 border border-glass-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
                  />
                </div>
              </div>
            </div>

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
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={newBotData.isAutoReply}
                    onChange={(e) => setNewBotData({ ...newBotData, isAutoReply: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-500"></div>
                </label>
              </div>

              {newBotData.isAutoReply && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Reply Tone</label>
                    <div className="flex flex-wrap gap-2">
                      {['Professional', 'Friendly', 'Concise', 'Detailed'].map(tone => (
                        <button
                          key={tone}
                          onClick={() => setNewBotData({ ...newBotData, replayTony: tone })}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${newBotData.replayTony === tone ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-lg shadow-fuchsia-500/20' : 'bg-surface border-glass-border text-slate-400 hover:text-white'}`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
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
                <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                  <div>
                    <div className="text-sm font-bold text-slate-200">Summarize Message</div>
                    <div className="text-xs text-slate-500">Create a 1-sentence summary</div>
                  </div>
                  <input type="checkbox" checked={newBotData.isautoSummarize} onChange={e => setNewBotData({ ...newBotData, isautoSummarize: e.target.checked })} className="w-5 h-5 accent-cyan-500 rounded cursor-pointer" />
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                  <div>
                    <div className="text-sm font-bold text-slate-200">Extract Tasks</div>
                    <div className="text-xs text-slate-500">Find action items and deadlines</div>
                  </div>
                  <input type="checkbox" checked={newBotData.isautoExtractTaskes} onChange={e => setNewBotData({ ...newBotData, isautoExtractTaskes: e.target.checked })} className="w-5 h-5 accent-cyan-500 rounded cursor-pointer" />
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                  <div>
                    <div className="text-sm font-bold text-slate-200">Extract Meetings</div>
                    <div className="text-xs text-slate-500">Detect meeting requests and times</div>
                  </div>
                  <input type="checkbox" checked={newBotData.isautoExtractMettengs} onChange={e => setNewBotData({ ...newBotData, isautoExtractMettengs: e.target.checked })} className="w-5 h-5 accent-cyan-500 rounded cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Custom Prompt */}
            <div className="bg-glass border border-glass-border rounded-3xl p-6 min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white">Custom Instructions</h3>
                </div>
              </div>
              <div className="relative">
                <RichEditor
                  value={newBotData.userPrompet}
                  onChange={html => setNewBotData({ ...newBotData, userPrompet: html })}
                  placeholder="E.g. If the client asks for pricing, attach the Q4 PDF and cc the sales manager..."
                  className="bg-black/20"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Save Button */}
        <div className="p-6 mt-[150px] border-t border-glass-border bg-glass backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/thread-automation')}
              className="px-6"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBot}
              disabled={isSaving || !newBotData.botName || !newBotData.emails}
              className="px-8 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white shadow-lg shadow-fuchsia-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Bot'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
