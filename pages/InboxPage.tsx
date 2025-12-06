import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { EmailListItem } from '../components/EmailListItem';
import { EmailDetail } from '../components/EmailDetail';
import { Sparkles, Inbox, Search } from 'lucide-react';

export const InboxPage: React.FC = () => {
  const { filteredEmails, t, isSearching } = useAppContext();
  const { id } = useParams<{id: string}>();
  
  // If searching, show all matches. If not, only show inbox.
  const displayEmails = isSearching 
    ? filteredEmails 
    : filteredEmails.filter(e => e.folder === 'inbox');

  const selectedEmail = displayEmails.find(e => e.id === id);

  return (
    <>
      {/* List Pane */}
      <div className={`flex flex-col w-full md:w-[360px] border-r rtl:border-r-0 rtl:border-l border-glass-border bg-black/20 z-0 transition-transform ${id ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-5 flex justify-between items-center border-b border-glass-border/50">
             <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                 {isSearching ? <Search className="w-5 h-5 text-fuchsia-500" /> : null}
                 {isSearching ? 'Search Results' : t('inbox.title')}
             </h2>
             {!isSearching && (
                <button className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t('inbox.cleanup')}
                </button>
             )}
         </div>
         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             {displayEmails.length === 0 ? (
                 <div className="text-center mt-10 text-slate-500">
                     <p>{isSearching ? 'No emails found matching filters.' : 'Inbox is empty.'}</p>
                 </div>
             ) : (
                 displayEmails.map(email => (
                    <EmailListItem key={email.id} email={email} basePath="/inbox" />
                 ))
             )}
         </div>
      </div>

      {/* Detail Pane */}
      <div className={`flex-1 flex flex-col bg-transparent ${!id ? 'hidden md:flex' : 'flex'}`}>
         {selectedEmail ? (
             <EmailDetail email={selectedEmail} />
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <div className="w-24 h-24 bg-glass border border-glass-border rounded-3xl flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/5"></div>
                    <Inbox className="w-10 h-10 opacity-50" />
                </div>
                <p className="font-medium text-xl text-slate-300">{t('inbox.empty_title')}</p>
                <p className="text-sm opacity-50 mt-2">{t('inbox.empty_subtitle')}</p>
            </div>
         )}
      </div>
    </>
  );
};