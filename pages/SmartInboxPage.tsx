import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { EmailListItem } from '../components/EmailListItem';
import { EmailDetail } from '../components/EmailDetail';
import { Sparkles, Inbox } from 'lucide-react';

export const SmartInboxPage: React.FC = () => {
  const { emails, analyzeEmails } = useAppContext();
  const { id } = useParams<{id: string}>();
  const selectedEmail = emails.find(e => e.id === id);

  useEffect(() => {
    analyzeEmails();
  }, []);

  const highPriority = emails.filter(e => (e.priorityScore || 0) > 70);
  const others = emails.filter(e => (e.priorityScore || 0) <= 70);

  return (
    <>
      <div className={`flex flex-col w-full md:w-[360px] border-r border-glass-border bg-black/20 z-0 transition-transform ${id ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-5 flex justify-between items-center border-b border-glass-border/50">
             <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-fuchsia-500" />
                Smart Inbox
             </h2>
         </div>
         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
             {highPriority.length > 0 && (
                 <div>
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-2">Important</h3>
                    {highPriority.map(email => <EmailListItem key={email.id} email={email} basePath="/smart-inbox" />)}
                 </div>
             )}
             {others.length > 0 && (
                 <div>
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-2">Others</h3>
                    {others.map(email => <EmailListItem key={email.id} email={email} basePath="/smart-inbox" />)}
                 </div>
             )}
         </div>
      </div>

      <div className={`flex-1 flex flex-col bg-transparent ${!id ? 'hidden md:flex' : 'flex'}`}>
         {selectedEmail ? <EmailDetail email={selectedEmail} /> : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <Inbox className="w-16 h-16 opacity-20 mb-4" />
                <p className="text-xl">Select an email</p>
            </div>
         )}
      </div>
    </>
  );
};