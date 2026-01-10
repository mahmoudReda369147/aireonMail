import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { EmailListItem } from '../components/EmailListItem';
import { Button } from '../components/common/Button';
import { TextArea } from '../components/common/Input';
import { Dropdown } from '../components/common/Dropdown';
import { RichEditor } from '../components/common/RichEditor';
import { Bot, Zap, Clock, MessageSquare, CheckCircle, PauseCircle, PlayCircle, Sliders, ChevronRight, Activity, Wand2, RefreshCcw, Loader2, Plus, X } from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { useBots, useUpdateBot, useUserTemplates, useBotLogs } from '../apis/hooks';
import { BotData, BotLogData } from '../apis/services';
import { useEditorBackgroundColor } from '../hooks/useEditorBackgroundColor';

export const ConversationAutomationPage: React.FC = () => {
  const { emails, threadAutomations, updateThreadAutomation, showToast, t } = useAppContext();
  const { id, botId } = useParams<{id: string; botId?: string}>();
  const navigate = useNavigate();
  const {
    bgColor: templateBgColor,
    setBgColor: setTemplateBgColor,
    wrapWithFullHTML: wrapTemplateBgColor,
    extractBgColorFromHTML: extractTemplateBgColor,
    unwrapHTML: unwrapTemplateHTML
  } = useEditorBackgroundColor();
  const { setBgColor: setPromptBgColor, wrapWithFullHTML: wrapPromptBgColor } = useEditorBackgroundColor();

  // Bots data
  const {
    data: botsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingBots,
  } = useBots();

  // Update bot mutation
  const updateBotMutation = useUpdateBot();

  // User templates data
  const { data: templatesData, isLoading: isLoadingTemplates } = useUserTemplates();

  // Flatten all pages into a single array with memoization
  const allBots = useMemo(() => 
    botsData?.pages.flatMap((page) => page.data) || [], 
    [botsData?.pages]
  );

  // Selected bot state
  const [selectedBot, setSelectedBot] = useState<BotData | null>(null);

  // Editable bot settings state
  const [editableBotSettings, setEditableBotSettings] = useState<{
    isactive: boolean;
    isAutoReply: boolean;
    replayTony: string;
    isautoSummarize: boolean;
    isautoExtractTaskes: boolean;
    isautoExtractMettengs: boolean;
    userPrompet: string;
    templete: string;
    emails: string[];
  } | null>(null);

  // Email input state for editing
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Set selected bot from URL parameter
  useEffect(() => {
    if (botId && allBots.length > 0) {
      const bot = allBots.find(b => b.id === botId);
      if (bot) {
        setSelectedBot(bot);

        // Extract background color from template if it exists
        const extractedColor = extractTemplateBgColor(bot.templete || '');
        if (extractedColor) {
          setTemplateBgColor(extractedColor);
        }

        // Unwrap the HTML to get clean content for editing
        const unwrappedTemplate = unwrapTemplateHTML(bot.templete || '');

        // Initialize editable settings
        setEditableBotSettings({
          isactive: bot.isactive,
          isAutoReply: bot.isAutoReply,
          replayTony: bot.replayTony,
          isautoSummarize: bot.isautoSummarize,
          isautoExtractTaskes: bot.isautoExtractTaskes,
          isautoExtractMettengs: bot.isautoExtractMettengs,
          userPrompet: bot.userPrompet || '',
          templete: unwrappedTemplate,
          emails: bot.emails || [],
        });
        setEmailList(bot.emails || []);
      }
    }
  }, [botId, allBots, extractTemplateBgColor, setTemplateBgColor, unwrapTemplateHTML]);

  // Ref for scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const logsScrollContainerRef = useRef<HTMLDivElement>(null);

  // Bot logs data
  const {
    data: logsData,
    fetchNextPage: fetchNextLogsPage,
    hasNextPage: hasNextLogsPage,
    isFetchingNextPage: isFetchingNextLogsPage,
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useBotLogs(selectedBot?.id);

  // Flatten all logs pages into a single array with memoization
  const allLogs = useMemo(() =>
    logsData?.pages.flatMap((page) => page.data.logs) || [],
    [logsData?.pages]
  );

  // Tab state
  const [activeTab, setActiveTab] = useState<'bots' | 'conversations'>('bots');

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
    showToast(config.active ? t('conversation_automation.automation_paused') : t('conversation_automation.automation_activated'), config.active ? "info" : "success");
  };

  // Handle scroll for infinite loading
  const handleScroll = () => {
    if (!scrollContainerRef.current || !hasNextPage || isFetchingNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    // Load more when scrolled to 80% of the container
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      fetchNextPage();
    }
  };

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage]);

  // Handle scroll for logs infinite loading
  const handleLogsScroll = () => {
    if (!logsScrollContainerRef.current || !hasNextLogsPage || isFetchingNextLogsPage) return;

    const { scrollTop, scrollHeight, clientHeight } = logsScrollContainerRef.current;

    // Load more when scrolled to 80% of the container
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      fetchNextLogsPage();
    }
  };

  // Attach scroll listener for logs
  useEffect(() => {
    const logsContainer = logsScrollContainerRef.current;
    if (!logsContainer) return;

    logsContainer.addEventListener('scroll', handleLogsScroll);
    return () => logsContainer.removeEventListener('scroll', handleLogsScroll);
  }, [hasNextLogsPage, isFetchingNextLogsPage]);

  // Select bot and update config
  const handleSelectBot = (bot: BotData) => {
    setSelectedBot(bot);

    // Update URL with bot ID
    if (id) {
      navigate(`/thread-automation/${id}/${bot.id}`);

      // Update the thread automation config based on bot settings
      updateThreadAutomation(id, {
        active: bot.isactive,
        autoReply: {
          enabled: bot.isAutoReply,
          tone: bot.replayTony,
          matchMyStyle: false
        },
        actions: {
          summarize: bot.isautoSummarize,
          extractTasks: bot.isautoExtractTaskes,
          autoLabel: false,
          translate: false
        },
        customPrompt: bot.userPrompet || ''
      });
      showToast(t('conversation_automation.auto_reply_applied').replace('{botName}', bot.botName), "success");
    } else {
      // No thread selected, just show bot settings
      navigate(`/thread-automation/bot/${bot.id}`);
    }
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

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Handle add email
  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();

    if (!trimmedEmail) {
      showToast(t('conversation_automation.please_enter_email'), 'error');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      showToast(t('conversation_automation.please_enter_valid_email'), 'error');
      return;
    }

    if (emailList.includes(trimmedEmail)) {
      showToast(t('conversation_automation.email_already_added'), 'error');
      return;
    }

    const newEmailList = [...emailList, trimmedEmail];
    setEmailList(newEmailList);
    setEmailInput('');

    // Update editable settings
    if (editableBotSettings) {
      setEditableBotSettings({
        ...editableBotSettings,
        emails: newEmailList,
      });
    }
  };

  // Handle remove email
  const handleRemoveEmail = (emailToRemove: string) => {
    const newEmailList = emailList.filter(email => email !== emailToRemove);
    setEmailList(newEmailList);

    // Update editable settings
    if (editableBotSettings) {
      setEditableBotSettings({
        ...editableBotSettings,
        emails: newEmailList,
      });
    }
  };

  // Update editable bot settings
  const updateBotSetting = <K extends keyof NonNullable<typeof editableBotSettings>>(
    key: K,
    value: NonNullable<typeof editableBotSettings>[K]
  ) => {
    if (!editableBotSettings) return;
    setEditableBotSettings({
      ...editableBotSettings,
      [key]: value,
    });
  };

  // Save bot settings
  const handleSaveBotSettings = async () => {
    if (!selectedBot || !editableBotSettings) return;

    setIsSaving(true);
    try {
      const response = await updateBotMutation.mutateAsync({
        id: selectedBot.id,
        data: {
          ...editableBotSettings,
          templete: wrapTemplateBgColor(editableBotSettings.templete),
        },
      });

      // Update the selected bot with new data
      setSelectedBot(response.data);
      setEditableBotSettings({
        isactive: response.data.isactive,
        isAutoReply: response.data.isAutoReply,
        replayTony: response.data.replayTony,
        isautoSummarize: response.data.isautoSummarize,
        isautoExtractTaskes: response.data.isautoExtractTaskes,
        isautoExtractMettengs: response.data.isautoExtractMettengs,
        userPrompet: response.data.userPrompet || '',
        templete: response.data.templete || '',
        emails: response.data.emails || [],
      });
      setEmailList(response.data.emails || []);

      showToast(t('conversation_automation.bot_settings_saved'), 'success');
    } catch (error) {
      console.error('Failed to save bot settings:', error);
      showToast(t('conversation_automation.failed_save_bot_settings'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = templatesData?.data?.find(t => t.id === templateId);
    if (template && editableBotSettings) {
      setEditableBotSettings({
        ...editableBotSettings,
        templete: template.body || '',
      });
      showToast(t('conversation_automation.template_loaded').replace('{templateName}', template.name), 'success');
    }
  };

  // Handle template selection for thread config
  const handleConfigTemplateSelect = (templateId: string) => {
    const template = templatesData?.data?.find(t => t.id === templateId);
    if (template && config) {
      updateConfig('customPrompt', template.body || '');
      showToast(t('conversation_automation.template_loaded').replace('{templateName}', template.name), 'success');
    }
  };

  return (
    <>
      {/* Bots Sidebar */}
      <div className={`flex flex-col w-full md:w-[360px] border-r border-glass-border bg-black/20 z-0 transition-transform ${id ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-5 flex justify-between items-center border-b border-glass-border/50">
             <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                 <Bot className="w-5 h-5 text-fuchsia-500" />
                 {t('conversation_automation.thread_bots')}
             </h2>
             <span className="text-xs bg-fuchsia-500/10 text-fuchsia-400 px-2 py-1 rounded-full border border-fuchsia-500/20">
               {t('conversation_automation.bots_count').replace('{count}', allBots.length.toString())}
             </span>
         </div>

         <div className="flex-1 overflow-hidden flex flex-col">
           {/* Create Bot Button */}
           <div className="p-4 pb-0">
             <div className="flex gap-2 mb-4">
               <button
                 onClick={() => navigate('/thread-automation/create-bot')}
                 className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white shadow-lg shadow-fuchsia-500/20"
               >
                 {t('conversation_automation.create_new_bot')}
               </button>
               {/* <button
                 onClick={() => setActiveTab('conversations')}
                 className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                   activeTab === 'conversations'
                     ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20'
                     : 'bg-surface border border-glass-border text-slate-400 hover:text-white'
                 }`}
               >
                 Conversations
               </button> */}
             </div>
           </div>

           {/* Content based on active tab */}
           {activeTab === 'bots' ? (
             /* Bots List with Infinite Scroll */
             <div
               ref={scrollContainerRef}
               className="flex-1 overflow-y-auto custom-scrollbar px-4"
             >
               {isLoadingBots ? (
               <div className="flex flex-col items-center justify-center py-10 gap-3">
                 <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
                 <span className="text-sm text-slate-400">{t('conversation_automation.loading_bots')}</span>
               </div>
             ) : allBots.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
                 <Bot className="w-12 h-12 opacity-20" />
                 <span className="text-sm">{t('conversation_automation.no_bots_available')}</span>
               </div>
             ) : (
               <>
                 {allBots.map((bot) => (
                   <div
                     key={bot.id}
                     onClick={() => handleSelectBot(bot)}
                     className={`mb-3 p-4 rounded-2xl border transition-all cursor-pointer group ${
                       selectedBot?.id === bot.id
                         ? 'bg-fuchsia-500/10 border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/10'
                         : 'bg-surface/50 border-glass-border hover:bg-surface hover:border-fuchsia-500/20'
                     }`}
                   >
                     <div className="flex items-start justify-between mb-2">
                       <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                           {bot.botName.substring(0, 2).toUpperCase()}
                         </div>
                         <div>
                           <div className="font-bold text-white text-sm">{bot.botName}</div>
                           <div className="text-xs text-slate-400 truncate max-w-[180px]">
                             {bot.emails}
                           </div>
                         </div>
                       </div>
                       {bot.isactive && (
                         <span className="relative flex h-2 w-2 mt-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                         </span>
                       )}
                     </div>

                     <div className="flex items-center gap-2 mt-3 flex-wrap">
                       {bot.isAutoReply && (
                         <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                           Auto Reply
                         </span>
                       )}
                       {bot.isautoSummarize && (
                         <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                           Summarize
                         </span>
                       )}
                       {bot.isautoExtractTaskes && (
                         <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                           Tasks
                         </span>
                       )}
                       {bot.isautoExtractMettengs && (
                         <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                           Meetings
                         </span>
                       )}
                     </div>

                     <div className="text-[10px] text-slate-500 mt-2 font-medium">
                       Tone: {bot.replayTony}
                     </div>
                   </div>
                 ))}

                 {/* Loading more indicator */}
                 {isFetchingNextPage && (
                   <div className="flex items-center justify-center py-4">
                     <Loader2 className="w-5 h-5 text-fuchsia-500 animate-spin" />
                     <span className="ml-2 text-sm text-slate-400">{t('conversation_automation.loading_more')}</span>
                   </div>
                 )}

                 {/* End of list indicator */}
                 {!hasNextPage && allBots.length > 0 && (
                   <div className="text-center py-4 text-xs text-slate-500">
                     {t('conversation_automation.all_bots_loaded')}
                   </div>
                 )}
               </>
             )}
             </div>
           ) : (
             /* Conversations List */
             <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
               {threads.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
                   <MessageSquare className="w-12 h-12 opacity-20" />
                   <span className="text-sm">{t('conversation_automation.no_conversations')}</span>
                 </div>
               ) : (
                 threads.map(email => (
                   <div key={email.id} className="relative mb-3">
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
                 ))
               )}
             </div>
           )}
         </div>
      </div>

      {/* Configuration Panel */}
      <div className={`flex-1 flex flex-col bg-transparent ${!id && !selectedBot ? 'hidden md:flex' : 'flex'}`}>
         {selectedBot && !selectedThread && editableBotSettings ? (
            /* Bot Settings View - Same as Automation Page */
            <div className="flex flex-col h-full">
               {/* Header */}
               <div className="p-6 border-b border-glass-border bg-glass backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                     <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <span>{t('conversation_automation.bot_settings')}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>{selectedBot.emails}</span>
                     </div>
                     <h1 className="text-2xl font-bold text-white truncate max-w-md">{selectedBot.botName}</h1>
                  </div>

                  <div className="flex items-center gap-4 bg-surface/50 p-2 rounded-2xl border border-glass-border">
                     <div className={`flex flex-col px-2 ${editableBotSettings.isactive ? 'text-green-400' : 'text-slate-500'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{editableBotSettings.isactive ? t('conversation_automation.active') : t('conversation_automation.paused')}</span>
                        <span className="text-xs font-medium">{t('conversation_automation.auto_pilot_mode')}</span>
                     </div>
                     <button
                        onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           console.log('Button clicked, current state:', editableBotSettings.isactive);
                           updateBotSetting('isactive', !editableBotSettings.isactive);
                        }}
                        className={`relative w-14 h-8 rounded-full transition-colors duration-300 cursor-pointer ${editableBotSettings.isactive ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-slate-700'}`}
                     >
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md flex items-center justify-center ${editableBotSettings.isactive ? 'translate-x-6' : 'translate-x-0'}`}>
                           {editableBotSettings.isactive ? <Zap className="w-3 h-3 text-green-600" /> : <PauseCircle className="w-3 h-3 text-slate-400" />}
                        </div>
                     </button>
                  </div>
               </div>

               {/* Main Content Grid */}
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">

                     {/* Left Column: Rules */}
                     <div className="space-y-6">

                        {/* Basic Info Card */}
                        <div className="bg-glass border border-glass-border rounded-3xl p-6">
                           <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                 <Bot className="w-5 h-5" />
                              </div>
                              <div>
                                 <h3 className="font-bold text-white text-lg">{t('conversation_automation.bot_information')}</h3>
                                 <p className="text-xs text-slate-400">{t('conversation_automation.basic_configuration')}</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                                    {t('conversation_automation.bot_name')}
                                 </label>
                                 <input
                                    type="text"
                                    value={selectedBot.botName}
                                    disabled
                                    className="w-full px-4 py-3 bg-black/20 border border-glass-border rounded-xl text-slate-400 cursor-not-allowed"
                                 />
                              </div>

                              <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                                    {t('conversation_automation.email_addresses')}
                                 </label>
                                 <div className="flex gap-2">
                                    <input
                                       type="email"
                                       value={emailInput}
                                       onChange={(e) => setEmailInput(e.target.value)}
                                       onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                             e.preventDefault();
                                             handleAddEmail();
                                          }
                                       }}
                                       placeholder={t('conversation_automation.email_placeholder')}
                                       className="flex-1 px-4 py-3 bg-black/20 border border-glass-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
                                    />
                                    <button
                                       type="button"
                                       onClick={handleAddEmail}
                                       className="px-4 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 rounded-xl text-white font-medium transition-all shadow-lg shadow-fuchsia-500/20 flex items-center gap-2"
                                    >
                                       <Plus className="w-4 h-4" />
                                       {t('conversation_automation.add')}
                                    </button>
                                 </div>

                                 {/* Email List */}
                                 {emailList.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                       {emailList.map((email, index) => (
                                          <div
                                             key={index}
                                             className="flex items-center justify-between px-4 py-2 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl group hover:bg-fuchsia-500/20 transition-all"
                                          >
                                             <span className="text-sm text-white font-medium">{email}</span>
                                             <button
                                                type="button"
                                                onClick={() => handleRemoveEmail(email)}
                                                className="p-1 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                                title={t('conversation_automation.remove_email')}
                                             >
                                                <X className="w-4 h-4" />
                                             </button>
                                          </div>
                                       ))}
                                    </div>
                                 )}
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
                                    <h3 className="font-bold text-white text-lg">{t('conversation_automation.auto_reply')}</h3>
                                    <p className="text-xs text-slate-400">{t('conversation_automation.handle_incoming_messages')}</p>
                                 </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" className="sr-only peer" checked={editableBotSettings.isAutoReply} onChange={(e) => updateBotSetting('isAutoReply', e.target.checked)} />
                                 <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-500"></div>
                              </label>
                           </div>

                           {/* User Prompt Textarea */}
                           <div className="space-y-2 mt-4">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                                 {t('conversation_automation.custom_instructions')}
                              </label>
                              <textarea
                                 value={editableBotSettings.userPrompet}
                                 onChange={(e) => updateBotSetting('userPrompet', e.target.value)}
                                 placeholder="E.g. If the client asks for pricing, attach the Q4 PDF and cc the sales manager..."
                                 rows={4}
                                 className="w-full px-4 py-3 bg-black/20 border border-glass-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-colors resize-none"
                              />
                           </div>

                           {editableBotSettings.isAutoReply && (
                              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 mt-4">
                                 <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Reply Tone</label>
                                    <div className="flex flex-wrap gap-2">
                                       {['Professional', 'Friendly', 'Concise', 'Detailed'].map(tone => (
                                          <button
                                             key={tone}
                                             onClick={() => updateBotSetting('replayTony', tone)}
                                             className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${editableBotSettings.replayTony === tone ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-lg shadow-fuchsia-500/20' : 'bg-surface border-glass-border text-slate-400 hover:text-white'}`}
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
                                 <h3 className="font-bold text-white text-lg">{t('conversation_automation.smart_actions')}</h3>
                                 <p className="text-xs text-slate-400">{t('conversation_automation.process_content_arrival')}</p>
                              </div>
                           </div>

                           <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                                 <div>
                                    <div className="text-sm font-bold text-slate-200">{t('conversation_automation.summarize_message')}</div>
                                    <div className="text-xs text-slate-500">{t('conversation_automation.create_summary')}</div>
                                 </div>
                                 <input type="checkbox" checked={editableBotSettings.isautoSummarize} onChange={e => updateBotSetting('isautoSummarize', e.target.checked)} className="w-5 h-5 accent-cyan-500 rounded cursor-pointer" />
                              </div>
                              <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                                 <div>
                                    <div className="text-sm font-bold text-slate-200">{t('conversation_automation.extract_tasks')}</div>
                                    <div className="text-xs text-slate-500">{t('conversation_automation.find_action_items')}</div>
                                 </div>
                                 <input type="checkbox" checked={editableBotSettings.isautoExtractTaskes} onChange={e => updateBotSetting('isautoExtractTaskes', e.target.checked)} className="w-5 h-5 accent-cyan-500 rounded cursor-pointer" />
                              </div>
                              <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                                 <div>
                                    <div className="text-sm font-bold text-slate-200">{t('conversation_automation.extract_meetings')}</div>
                                    <div className="text-xs text-slate-500">{t('conversation_automation.detect_meeting_requests')}</div>
                                 </div>
                                 <input type="checkbox" checked={editableBotSettings.isautoExtractMettengs} onChange={e => updateBotSetting('isautoExtractMettengs', e.target.checked)} className="w-5 h-5 accent-cyan-500 rounded cursor-pointer" />
                              </div>

                           </div>
                        </div>
                     </div>

                     {/* Right Column: Template & Logs */}
                     <div className="space-y-6">

                        {/* Email Template */}
                        <div className="bg-glass border border-glass-border rounded-3xl p-6 min-h-[400px]">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                 <Wand2 className="w-5 h-5 text-purple-400" />
                                 <h3 className="font-bold text-white">{t('conversation_automation.email_template')}</h3>
                              </div>
                              <Dropdown
                                 value=""
                                 onChange={handleTemplateSelect}
                                 options={templatesData?.data?.map(template => ({
                                    label: template.name,
                                    value: template.id
                                 })) || []}
                                 placeholder={isLoadingTemplates ? 'Loading...' : 'Load Template'}
                                 className="w-48"
                              />
                           </div>
                           <div className="relative">
                              <RichEditor
                                 value={editableBotSettings.templete}
                                 onChange={html => updateBotSetting('templete', html)}
                                 onBackgroundColorChange={setTemplateBgColor}
                                 initialBackgroundColor={templateBgColor}
                                 placeholder={t('conversation_automation.template_placeholder')}
                                 className="bg-black/20"
                              />
                           </div>
                        </div>

                        {/* Activity Log */}
                        <div className="bg-glass border border-glass-border rounded-3xl p-6 flex-1 min-h-[300px] flex flex-col">
                           <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2">
                                 <Activity className="w-5 h-5 text-slate-400" />
                                 <h3 className="font-bold text-white">Activity Log</h3>
                              </div>
                              <button
                                 onClick={() => refetchLogs()}
                                 className="text-slate-500 hover:text-white transition-colors"
                                 disabled={isLoadingLogs}
                              >
                                 <RefreshCcw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                              </button>
                           </div>

                           <div
                              ref={logsScrollContainerRef}
                              className="space-y-4 flex-1 overflow-y-auto pr-2"
                              style={{ maxHeight: '500px' }}
                           >
                              {isLoadingLogs && allLogs.length === 0 ? (
                                 <div className="text-center text-slate-500 py-10">
                                    <Loader2 className="w-10 h-10 mx-auto mb-3 opacity-20 animate-spin" />
                                    <p>Loading activity logs...</p>
                                 </div>
                              ) : allLogs.length === 0 ? (
                                 <div className="text-center text-slate-500 py-10">
                                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p>No activity recorded yet</p>
                                 </div>
                              ) : (
                                 <>
                                    {allLogs.map((log: BotLogData) => {
                                       const logDate = new Date(log.createdAt);
                                       const now = new Date();
                                       const diffInMs = now.getTime() - logDate.getTime();
                                       const diffInMins = Math.floor(diffInMs / 60000);
                                       const diffInHours = Math.floor(diffInMs / 3600000);
                                       const diffInDays = Math.floor(diffInMs / 86400000);

                                       let timeAgo = '';
                                       if (diffInMins < 1) timeAgo = 'Just now';
                                       else if (diffInMins < 60) timeAgo = `${diffInMins}m ago`;
                                       else if (diffInHours < 24) timeAgo = `${diffInHours}h ago`;
                                       else if (diffInDays < 7) timeAgo = `${diffInDays}d ago`;
                                       else timeAgo = logDate.toLocaleDateString();

                                       const getLogIcon = (title: string) => {
                                          if (title.includes('Auto-Reply')) return 'bg-blue-500';
                                          if (title.includes('Auto-Summarization')) return 'bg-purple-500';
                                          if (title.includes('Task Auto-Extraction')) return 'bg-yellow-500';
                                          if (title.includes('Meeting Auto-Extraction')) return 'bg-green-500';
                                          return 'bg-cyan-500';
                                       };

                                       return (
                                          <div key={log.id} className="flex gap-4 items-start relative group">
                                             <div className="flex flex-col items-center">
                                                <div className={`w-2 h-2 rounded-full mt-2 ${getLogIcon(log.title)}`}></div>
                                                <div className="w-0.5 h-full bg-glass-border absolute top-4 group-last:hidden"></div>
                                             </div>
                                             <div className="flex-1 pb-4">
                                                <div className="flex justify-between items-start">
                                                   <span className="text-sm font-bold text-slate-200">{log.title}</span>
                                                   <span className="text-[10px] text-slate-500 font-mono">{timeAgo}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{log.description}</p>
                                                {log.task && (
                                                   <div className="mt-2 flex items-center gap-2">
                                                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                         log.task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                         log.task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                         'bg-green-500/20 text-green-400'
                                                      }`}>
                                                         {log.task.priority}
                                                      </span>
                                                      <span className="text-[10px] text-slate-500">{log.task.task}</span>
                                                   </div>
                                                )}
                                                {log.calendarTask && (
                                                   <div className="mt-2 flex items-center gap-2">
                                                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                         log.calendarTask.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                         log.calendarTask.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                         'bg-green-500/20 text-green-400'
                                                      }`}>
                                                         {log.calendarTask.priority}
                                                      </span>
                                                      <span className="text-[10px] text-slate-500">{log.calendarTask.title}</span>
                                                   </div>
                                                )}
                                             </div>
                                          </div>
                                       );
                                    })}
                                    {isFetchingNextLogsPage && (
                                       <div className="text-center py-4">
                                          <Loader2 className="w-6 h-6 mx-auto text-slate-500 animate-spin" />
                                       </div>
                                    )}
                                 </>
                              )}
                           </div>
                        </div>

                     </div>
                  </div>

                  {/* Save Button */}
                  <div className="p-6 mt-[150px] border-t border-glass-border bg-glass backdrop-blur-md">
                     <div className="max-w-7xl mx-auto flex justify-end gap-3">
                        <Button
                           variant="ghost"
                           onClick={() => {
                              // Reset to original values
                              setEditableBotSettings({
                                 isactive: selectedBot.isactive,
                                 isAutoReply: selectedBot.isAutoReply,
                                 replayTony: selectedBot.replayTony,
                                 isautoSummarize: selectedBot.isautoSummarize,
                                 isautoExtractTaskes: selectedBot.isautoExtractTaskes,
                                 isautoExtractMettengs: selectedBot.isautoExtractMettengs,
                                 userPrompet: selectedBot.userPrompet || '',
                                 templete: selectedBot.templete || '',
                                 emails: selectedBot.emails || [],
                              });
                              setEmailList(selectedBot.emails || []);
                              showToast(t('conversation_automation.changes_discarded'), 'info');
                           }}
                           className="px-6"
                        >
                           {t('conversation_automation.cancel')}
                        </Button>
                        <Button
                           onClick={handleSaveBotSettings}
                           disabled={isSaving}
                           className="px-8 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white shadow-lg shadow-fuchsia-500/20"
                        >
                           {isSaving ? (
                              <>
                                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                 {t('conversation_automation.saving')}
                              </>
                           ) : (
                              `${t('conversation_automation.save_changes')}`
                           )}
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         ) : selectedThread && config ? (
             <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-glass-border bg-glass backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                            <span>{t('conversation_automation.automation')}</span>
                            <ChevronRight className="w-3 h-3" />
                            <span>{selectedThread.sender}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white truncate max-w-md">{selectedThread.subject}</h1>
                        {selectedBot && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-500">{t('conversation_automation.active_bot')}</span>
                            <div className="flex items-center gap-1 px-2 py-1 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg">
                              <Bot className="w-3 h-3 text-fuchsia-400" />
                              <span className="text-xs font-medium text-fuchsia-300">{selectedBot.botName}</span>
                            </div>
                          </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 bg-surface/50 p-2 rounded-2xl border border-glass-border">
                        <div className={`flex flex-col px-2 ${config.active ? 'text-green-400' : 'text-slate-500'}`}>
                            <span className="text-[10px] font-bold uppercase tracking-widest">{config.active ? t('conversation_automation.active') : t('conversation_automation.paused')}</span>
                            <span className="text-xs font-medium">{t('conversation_automation.auto_pilot_mode')}</span>
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
                                            <h3 className="font-bold text-white text-lg">{t('conversation_automation.auto_reply')}</h3>
                                            <p className="text-xs text-slate-400">{t('conversation_automation.handle_incoming_messages')}</p>
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
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">{t('conversation_automation.reply_tone')}</label>
                                            <div className="flex flex-wrap gap-2">
                                                {[t('create_bot.professional'), t('create_bot.friendly'), t('create_bot.concise'), t('create_bot.detailed')].map(tone => (
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
                                        {/* <div className="flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-glass-border">
                                            <span className="text-sm text-slate-300">Match my writing style</span>
                                            <input type="checkbox" checked={config.autoReply.matchMyStyle} onChange={e => updateConfig('autoReply.matchMyStyle', e.target.checked)} className="w-4 h-4 accent-fuchsia-500 rounded cursor-pointer" />
                                        </div> */}
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
                                        <h3 className="font-bold text-white text-lg">{t('conversation_automation.smart_actions')}</h3>
                                        <p className="text-xs text-slate-400">{t('conversation_automation.process_content_arrival')}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    {[
                                        { key: 'summarize', label: t('conversation_automation.summarize_message'), desc: t('conversation_automation.create_summary') },
                                        { key: 'extractTasks', label: t('conversation_automation.extract_tasks'), desc: t('conversation_automation.find_action_items') },
                                        { key: 'autoLabel', label: t('conversation_automation.auto_label'), desc: t('conversation_automation.tag_based_content_analysis') },
                                        { key: 'translate', label: t('conversation_automation.translate'), desc: t('conversation_automation.translate_to_english') }
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
                                         <h3 className="font-bold text-white">{t('conversation_automation.custom_instructions')}</h3>
                                     </div>
                                     <Dropdown
                                        value=""
                                        onChange={handleConfigTemplateSelect}
                                        options={templatesData?.data?.map(template => ({
                                           label: template.name,
                                           value: template.id
                                        })) || []}
                                        placeholder={isLoadingTemplates ? t('conversation_automation.loading') : t('conversation_automation.load_template')}
                                        className="w-48"
                                     />
                                </div>
                                <div className="relative">
                                    <RichEditor
                                        value={config.customPrompt}
                                        onChange={html => updateConfig('customPrompt', html)}
                                        onBackgroundColorChange={setPromptBgColor}
                                        placeholder={t('conversation_automation.custom_instructions_placeholder')}
                                        className="bg-black/20"
                                    />
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div className="bg-glass border border-glass-border rounded-3xl p-6 flex-1 min-h-[300px] flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-slate-400" />
                                        <h3 className="font-bold text-white">{t('conversation_automation.activity_log')}</h3>
                                    </div>
                                    <button
                                        onClick={() => refetchLogs()}
                                        className="text-slate-500 hover:text-white transition-colors"
                                        disabled={isLoadingLogs}
                                    >
                                        <RefreshCcw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                <div
                                    ref={logsScrollContainerRef}
                                    className="space-y-4 flex-1 overflow-y-auto pr-2"
                                    style={{ maxHeight: '500px' }}
                                >
                                    {isLoadingLogs && allLogs.length === 0 ? (
                                        <div className="text-center text-slate-500 py-10">
                                            <Loader2 className="w-10 h-10 mx-auto mb-3 opacity-20 animate-spin" />
                                            <p>{t('conversation_automation.loading_activity_logs')}</p>
                                        </div>
                                    ) : allLogs.length === 0 ? (
                                        <div className="text-center text-slate-500 py-10">
                                            <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p>{t('conversation_automation.no_activity_recorded')}</p>
                                        </div>
                                    ) : (
                                        <>
                                            {allLogs.map((log: BotLogData) => {
                                                const logDate = new Date(log.createdAt);
                                                const now = new Date();
                                                const diffInMs = now.getTime() - logDate.getTime();
                                                const diffInMins = Math.floor(diffInMs / 60000);
                                                const diffInHours = Math.floor(diffInMs / 3600000);
                                                const diffInDays = Math.floor(diffInMs / 86400000);

                                                let timeAgo = '';
                                                if (diffInMins < 1) timeAgo = t('conversation_automation.just_now');
                                                else if (diffInMins < 60) timeAgo = `${diffInMins}m ago`;
                                                else if (diffInHours < 24) timeAgo = `${diffInHours}h ago`;
                                                else if (diffInDays < 7) timeAgo = `${diffInDays}d ago`;
                                                else timeAgo = logDate.toLocaleDateString();

                                                const getLogIcon = (title: string) => {
                                                    if (title.includes('Auto-Reply')) return 'bg-blue-500';
                                                    if (title.includes('Auto-Summarization')) return 'bg-purple-500';
                                                    if (title.includes('Task Auto-Extraction')) return 'bg-yellow-500';
                                                    if (title.includes('Meeting Auto-Extraction')) return 'bg-green-500';
                                                    return 'bg-cyan-500';
                                                };

                                                return (
                                                    <div key={log.id} className="flex gap-4 items-start relative group">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-2 h-2 rounded-full mt-2 ${getLogIcon(log.title)}`}></div>
                                                            <div className="w-0.5 h-full bg-glass-border absolute top-4 group-last:hidden"></div>
                                                        </div>
                                                        <div className="flex-1 pb-4">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-sm font-bold text-slate-200">{log.title}</span>
                                                                <span className="text-[10px] text-slate-500 font-mono">{timeAgo}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{log.description}</p>
                                                            {log.task && (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                                        log.task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                                        log.task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                        'bg-green-500/20 text-green-400'
                                                                    }`}>
                                                                        {log.task.priority}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500">{log.task.task}</span>
                                                                </div>
                                                            )}
                                                            {log.calendarTask && (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                                        log.calendarTask.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                                        log.calendarTask.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                        'bg-green-500/20 text-green-400'
                                                                    }`}>
                                                                        {log.calendarTask.priority}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500">{log.calendarTask.title}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {isFetchingNextLogsPage && (
                                                <div className="text-center py-4">
                                                    <Loader2 className="w-6 h-6 mx-auto text-slate-500 animate-spin" />
                                                </div>
                                            )}
                                        </>
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
                <p className="font-medium text-xl text-slate-300">{t('conversation_automation.select_thread_to_automate')}</p>
                <p className="text-sm opacity-50 mt-2">{t('conversation_automation.configure_ai_rules')}</p>
            </div>
         )}
      </div>
    </>
  );
}