
import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, Search, Mic, Bell, Globe, SlidersHorizontal, Paperclip, Calendar, X, CheckCircle, Info, AlertTriangle, Trash2, CheckCheck } from 'lucide-react';
import { Input } from './common/Input';
import { LiveAssistant } from './LiveAssistant';
import { useAppContext } from '../contexts/AppContext';

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const { emails, language, setLanguage, t, searchQuery, setSearchQuery, searchFilters, setSearchFilters, notifications, markAllNotificationsRead, deleteNotification } = useAppContext();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const activeFiltersCount = [searchFilters.from, searchFilters.to, searchFilters.dateStart, searchFilters.hasAttachments].filter(Boolean).length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const clearFilters = () => {
      setSearchFilters({
          from: '',
          to: '',
          dateStart: '',
          dateEnd: '',
          hasAttachments: false
      });
      setSearchQuery('');
      setShowFilters(false);
  };

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            setShowNotifications(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch(type) {
        case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
        case 'alert': return <AlertTriangle className="w-5 h-5 text-red-400" />;
        default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="flex h-screen bg-midnight text-slate-200 font-sans bg-aurora bg-no-repeat bg-fixed overflow-hidden p-4 gap-4">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-0">
        <header className="h-16 flex items-center justify-between px-2 shrink-0 z-20 mb-2">
          <div className="md:hidden mr-4 rtl:ml-4 rtl:mr-0">
            <button onClick={() => setSidebarOpen(true)} className="p-2 bg-glass rounded-xl border border-glass-border text-white"><Menu className="w-6 h-6" /></button>
          </div>
          
          {/* Search Area */}
          <div className="relative flex-1 max-w-xl hidden md:block group z-50">
             <div className="relative">
                <Input 
                    icon={Search} 
                    placeholder={t('search.placeholder')} 
                    className="py-2.5 pr-10" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${showFilters || activeFiltersCount > 0 ? 'text-fuchsia-400 bg-fuchsia-500/10' : 'text-slate-400 hover:text-white'}`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                </button>
             </div>

             {/* Filter Dropdown */}
             {showFilters && (
                 <div className="absolute top-full left-0 right-0 mt-3 bg-[#1A1B2E] border border-glass-border rounded-3xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 backdrop-blur-xl">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="text-sm font-bold text-white flex items-center gap-2">
                             <SlidersHorizontal className="w-4 h-4 text-fuchsia-500" /> Advanced Filters
                         </h3>
                         {(activeFiltersCount > 0 || searchQuery) && (
                             <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                 <X className="w-3 h-3" /> Clear All
                             </button>
                         )}
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                         <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pl-1">From</label>
                             <input 
                                className="w-full bg-black/30 border border-glass-border rounded-xl px-3 py-2 text-sm text-white focus:border-fuchsia-500 outline-none" 
                                placeholder="Sender name or email"
                                value={searchFilters.from}
                                onChange={e => setSearchFilters(prev => ({ ...prev, from: e.target.value }))}
                             />
                         </div>
                         <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pl-1">To</label>
                             <input 
                                className="w-full bg-black/30 border border-glass-border rounded-xl px-3 py-2 text-sm text-white focus:border-fuchsia-500 outline-none" 
                                placeholder="Recipient"
                                value={searchFilters.to}
                                onChange={e => setSearchFilters(prev => ({ ...prev, to: e.target.value }))}
                             />
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-4">
                         <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pl-1">Date Range</label>
                             <div className="flex items-center gap-2 bg-black/30 border border-glass-border rounded-xl px-3 py-2">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <input 
                                    type="date"
                                    className="bg-transparent border-none outline-none text-sm text-white w-full text-slate-300 [&::-webkit-calendar-picker-indicator]:invert"
                                    value={searchFilters.dateStart}
                                    onChange={e => setSearchFilters(prev => ({ ...prev, dateStart: e.target.value }))}
                                />
                             </div>
                         </div>
                         <div className="space-y-1 flex flex-col justify-end">
                             <div 
                                onClick={() => setSearchFilters(prev => ({ ...prev, hasAttachments: !prev.hasAttachments }))}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-all ${searchFilters.hasAttachments ? 'bg-fuchsia-500/20 border-fuchsia-500 text-white' : 'bg-black/30 border-glass-border text-slate-400 hover:text-white'}`}
                             >
                                 <Paperclip className="w-4 h-4" />
                                 <span className="text-sm font-medium">Has Attachments</span>
                             </div>
                         </div>
                     </div>
                 </div>
             )}
          </div>

          <div className="flex items-center gap-4 ml-auto rtl:mr-auto rtl:ml-0">
            
            {/* Language Switcher */}
            <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-glass border border-glass-border text-slate-300 hover:text-white hover:border-glass-hover transition-all text-xs font-bold"
            >
                <Globe className="w-4 h-4" />
                <span>{language === 'en' ? 'EN' : 'AR'}</span>
            </button>

            {/* Mic / Live Assistant */}
            <button 
                onClick={() => setIsLiveActive(true)}
                className="group relative p-3 rounded-full bg-glass border border-glass-border text-slate-300 hover:text-white hover:border-fuchsia-500/50 hover:bg-fuchsia-500/10 transition-all"
            >
                <div className="absolute inset-0 rounded-full bg-fuchsia-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Mic className="w-5 h-5 relative z-10" />
            </button>
            
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-3 rounded-full transition-all ${showNotifications ? 'bg-white/10 text-white' : 'bg-glass border border-glass-border text-slate-300 hover:text-white'}`}
                >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                        <span className="absolute top-2 right-2.5 rtl:right-auto rtl:left-2.5 w-2 h-2 bg-fuchsia-500 rounded-full shadow-[0_0_10px_#d946ef] animate-pulse"></span>
                    )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                    <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-[#1A1B2E] border border-glass-border rounded-3xl shadow-2xl animate-in fade-in slide-in-from-top-2 backdrop-blur-xl overflow-hidden z-[60]">
                        <div className="p-4 border-b border-glass-border flex justify-between items-center bg-black/20">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                Notifications
                                {unreadNotifications > 0 && <span className="text-xs bg-fuchsia-500/20 text-fuchsia-400 px-2 py-0.5 rounded-full">{unreadNotifications}</span>}
                            </h3>
                            {notifications.length > 0 && (
                                <button onClick={markAllNotificationsRead} className="text-xs text-slate-400 hover:text-white flex items-center gap-1" title="Mark all as read">
                                    <CheckCheck className="w-4 h-4" /> Mark all read
                                </button>
                            )}
                        </div>
                        
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No new notifications</p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.map(notification => (
                                        <div 
                                            key={notification.id} 
                                            className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group relative ${notification.read ? 'opacity-70' : 'bg-white/[0.02]'}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 shrink-0 ${notification.read ? 'opacity-50' : ''}`}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <h4 className={`text-sm ${notification.read ? 'font-medium text-slate-300' : 'font-bold text-white'}`}>{notification.title}</h4>
                                                        <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">{notification.timestamp}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed">{notification.message}</p>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full backdrop-blur-sm"
                                                title="Dismiss"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative rounded-3xl border border-glass-border bg-glass backdrop-blur-xl shadow-2xl">
           {children}
        </div>
      </main>

      {isLiveActive && <LiveAssistant onClose={() => setIsLiveActive(false)} emails={emails} />}
    </div>
  );
};
