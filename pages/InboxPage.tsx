import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { EmailListItem } from '../components/EmailListItem';
import { EmailDetail } from '../components/EmailDetail';
import { Sparkles, Inbox, Search, Loader2 } from 'lucide-react';
import { useGmailEmails, useDeleteAllEmails } from '../apis/hooks';
import { GmailEmail } from '../apis/services';
import { mapGmailEmailToEmail } from '../apis/services';
import { useToast } from '../components/common/Toast';

export const InboxPage: React.FC = () => {
  const { t } = useAppContext();
  const { id } = useParams<{id: string}>();
  const { showToast } = useToast();
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

  // Use Gmail emails hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useGmailEmails();

  const deleteAllEmailsMutation = useDeleteAllEmails();

  // Flatten all pages to get all emails and map to app format
  const emails = data?.pages.flatMap(page => page.data.map(mapGmailEmailToEmail)) || [];
  
  const selectedEmail = emails.find(e => e.id === id);

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 100) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  // Handle cleanup confirmation
  const handleCleanupConfirm = () => {
    deleteAllEmailsMutation.mutate(undefined, {
      onSuccess: () => {
        showToast('All emails deleted successfully', 'success');
        setShowCleanupConfirm(false);
      },
      onError: (error) => {
        showToast(error instanceof Error ? error.message : 'Failed to delete emails', 'error');
        setShowCleanupConfirm(false);
      },
    });
  };

  return (
    <>
      {/* List Pane */}
      <div className={`flex flex-col w-full md:w-[360px] border-r rtl:border-r-0 rtl:border-l border-glass-border bg-black/20 z-0 transition-transform ${id ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-5 flex justify-between items-center border-b border-glass-border/50">
             <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                 <Inbox className="w-5 h-5 text-cyan-500" />
                 {t('inbox.title')}
             </h2>
             <div className="relative">
                 {showCleanupConfirm ? (
                     <div className="flex items-center gap-2 animate-in fade-in duration-150">
                         <span className="text-xs text-slate-300">Delete all?</span>
                         <button
                             onClick={handleCleanupConfirm}
                             disabled={deleteAllEmailsMutation.isPending}
                             className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                         >
                             {deleteAllEmailsMutation.isPending ? (
                                 <Loader2 className="w-3 h-3 animate-spin" />
                             ) : (
                                 'Yes'
                             )}
                         </button>
                         <button
                             onClick={() => setShowCleanupConfirm(false)}
                             disabled={deleteAllEmailsMutation.isPending}
                             className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-medium rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                         >
                             No
                         </button>
                     </div>
                 ) : (
                     <button
                         onClick={() => setShowCleanupConfirm(true)}
                         className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                     >
                         <Sparkles className="w-3 h-3" /> {t('inbox.cleanup')}
                     </button>
                 )}
             </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" onScroll={handleScroll}>
             {isLoading ? (
                 <div className="text-center mt-10 text-slate-500">
                     <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                     <p>Loading emails...</p>
                 </div>
             ) : error ? (
                 <div className="text-center mt-10 text-red-500">
                     <p>Error loading emails: {(error as Error).message}</p>
                 </div>
             ) : emails.length === 0 ? (
                 <div className="text-center mt-10 text-slate-500">
                     <p>Inbox is empty.</p>
                 </div>
             ) : (
                 <>
                     {emails.map(email => (
                        <EmailListItem key={email.id} email={email} basePath="/inbox" />
                     ))}
                     {isFetchingNextPage && (
                        <div className="text-center mt-4 text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            <p className="text-xs mt-1">Loading more...</p>
                        </div>
                     )}
                 </>
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