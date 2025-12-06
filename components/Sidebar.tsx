import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Inbox, Send, FileText, Users, PlayCircle, CornerUpLeft, Sparkles, RefreshCw, Hexagon, X, Settings, Bot, PenSquare, LayoutGrid, CreditCard, LayoutTemplate } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { appLogo, isGeneratingLogo, handleGenerateLogo, t, currentAccount } = useAppContext();
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label, count }: any) => {
    const isActive = location.pathname.startsWith(to);
    
    return (
    <Link 
      to={to}
      onClick={() => setIsOpen(false)}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${
        isActive 
        ? 'bg-brand-gradient text-white shadow-lg shadow-fuchsia-900/20' 
        : 'text-slate-400 hover:text-white hover:bg-glass-hover'
      }`}
    >
        <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="font-medium tracking-wide text-sm">{label}</span>
        </div>
        {count && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isActive ? 'bg-white/20 text-white' : 'bg-surface border border-glass-border text-slate-400'
            }`}>
            {count}
            </span>
        )}
    </Link>
    );
  };

  return (
    <aside className={`fixed inset-y-4 left-4 rtl:left-auto rtl:right-4 w-72 bg-glass backdrop-blur-xl border border-glass-border rounded-3xl flex flex-col transform transition-transform duration-300 z-30 md:relative md:inset-0 md:rtl:right-0 md:transform-none md:rtl:transform-none md:h-full shadow-2xl shadow-black/40 ${isOpen ? 'translate-x-0' : '-translate-x-[120%] rtl:translate-x-[120%] md:translate-x-0 md:rtl:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={handleGenerateLogo} title="Regenerate Identity">
            {appLogo ? (
                <div className="w-12 h-12 flex items-center justify-center">
                     <img src={appLogo} className="w-full h-full object-contain mix-blend-screen drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]" alt="Aireon Logo" />
                </div>
            ) : (
                <div className={`w-12 h-12 bg-transparent flex items-center justify-center ${isGeneratingLogo ? 'animate-pulse' : ''}`}>
                   {isGeneratingLogo ? <RefreshCw className="w-6 h-6 text-fuchsia-500 animate-spin" /> : <Hexagon className="w-8 h-8 text-fuchsia-500" />}
                </div>
            )}
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('app.name')}</h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <Link 
            to="/compose"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 w-full bg-brand-gradient text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-fuchsia-500/20 mb-6 hover:opacity-90 transition-opacity"
          >
            <PenSquare className="w-5 h-5" />
            <span>{t('menu.compose')}</span>
          </Link>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">{t('menu.menu')}</div>
          <NavItem to="/inbox" icon={Inbox} label={t('menu.inbox')} count={2} />
          <NavItem to="/smart-inbox" icon={Sparkles} label={t('menu.smart_inbox')} />
          <NavItem to="/sent" icon={Send} label={t('menu.sent')} />
          <NavItem to="/drafts" icon={FileText} label={t('menu.drafts')} />
          <NavItem to="/templates" icon={LayoutTemplate} label={t('menu.templates')} />
           
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 mb-2 mt-6">{t('menu.apps')}</div>
          <NavItem to="/thread-automation" icon={Bot} label={t('menu.thread_bots')} />
          <NavItem to="/studio" icon={PlayCircle} label={t('menu.studio')} />
          <NavItem to="/contacts" icon={Users} label={t('menu.contacts')} />
          <NavItem to="/automation" icon={CornerUpLeft} label={t('menu.workflows')} />
          
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 mb-2 mt-6">{t('menu.settings')}</div>
          <NavItem to="/accounts" icon={LayoutGrid} label={t('menu.accounts')} />
          <NavItem to="/plans" icon={CreditCard} label={t('menu.plans')} />
        </nav>

        <div className="p-6 border-t border-glass-border">
          <Link to="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-glass border border-glass-border hover:bg-glass-hover transition-colors group relative overflow-hidden">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${currentAccount.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {currentAccount.avatar}
              </div>
              <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{currentAccount.name}</div>
                  <div className="text-xs text-slate-400 truncate">{currentAccount.email}</div>
              </div>
              <Settings className="w-4 h-4 text-slate-400 cursor-pointer hover:text-white transition-colors" />
          </Link>
        </div>
      </aside>
  );
};