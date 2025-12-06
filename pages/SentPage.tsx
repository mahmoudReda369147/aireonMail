import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { EmailListItem } from '../components/EmailListItem';
import { EmailDetail } from '../components/EmailDetail';
import { Send } from 'lucide-react';

export const SentPage: React.FC = () => {
  const { emails } = useAppContext();
  const { id } = useParams<{id: string}>();
  const sentEmails = emails.filter(e => e.folder === 'sent');
  const selectedEmail = emails.find(e => e.id === id);

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
             {sentEmails.length === 0 ? (
                 <div className="text-center text-slate-500 mt-10">No sent messages</div>
             ) : (
                 sentEmails.map(email => (
                    <EmailListItem key={email.id} email={email} basePath="/sent" />
                 ))
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