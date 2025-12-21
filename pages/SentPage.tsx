import React from 'react';
import { useParams } from 'react-router-dom';
import { useGmailSentEmails } from '../apis/hooks';
import { mapGmailSentEmailToEmail } from '../apis/services';
import { EmailListItem } from '../components/EmailListItem';
import { EmailDetail } from '../components/EmailDetail';
import { Send, Loader2 } from 'lucide-react';

export const SentPage: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useGmailSentEmails();
  
  // Flatten all pages of sent emails and map to app Email format
  const sentEmails = data?.pages.flatMap(page => 
    page.data.map(mapGmailSentEmailToEmail)
  ) || [];
  
  // Find selected email across all pages
  const selectedEmail = sentEmails.find(e => e.id === id);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        <div className="text-center">
          <Send className="w-16 h-16 opacity-20 mb-4 mx-auto" />
          <p className="text-xl mb-2">Failed to load sent messages</p>
          <p className="text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`flex flex-col w-full md:w-[360px] border-r border-glass-border bg-black/20 z-0 transition-transform ${id ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-5 flex justify-between items-center border-b border-glass-border/50">
             <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                 <Send className="w-5 h-5 text-fuchsia-500" />
                 Sent
             </h2>
         </div>
         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             {isLoading ? (
                 <div className="text-center text-slate-500 mt-10">
                     <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                     <p>Loading sent messages...</p>
                 </div>
             ) : sentEmails.length === 0 ? (
                 <div className="text-center text-slate-500 mt-10">No sent messages</div>
             ) : (
                 <>
                     {sentEmails.map(email => (
                        <EmailListItem key={email.id} email={email} basePath="/sent" />
                     ))}
                     {hasNextPage && (
                         <div className="text-center py-4">
                             <button
                                 onClick={() => fetchNextPage()}
                                 disabled={isFetchingNextPage}
                                 className="px-4 py-2 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg hover:bg-fuchsia-500/20 transition-colors disabled:opacity-50"
                             >
                                 {isFetchingNextPage ? (
                                     <Loader2 className="w-4 h-4 animate-spin" />
                                 ) : (
                                     'Load more'
                                 )}
                             </button>
                         </div>
                     )}
                 </>
             )}
         </div>
      </div>

      <div className={`flex-1 flex flex-col bg-transparent ${!id ? 'hidden md:flex' : 'flex'}`}>
         {selectedEmail ? (
             <EmailDetail email={selectedEmail} />
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <Send className="w-16 h-16 opacity-20 mb-4" />
                <p className="text-xl">Select a message</p>
            </div>
         )}
      </div>
    </>
  );
};