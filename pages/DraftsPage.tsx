import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmailListItem } from '../components/EmailListItem';
import { EmailDetail } from '../components/EmailDetail';
import { FileText } from 'lucide-react';
import { useArchivedEmails } from '../apis/hooks';
import { mapArchivedEmailToEmail } from '../apis/services';

export const DraftsPage: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const { data, isLoading, error } = useArchivedEmails();

  const draftEmails = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map(mapArchivedEmailToEmail);
  }, [data]);

  const selectedEmail = draftEmails.find(e => e.id === id);

  return (
    <>
      <div className={`flex flex-col w-full md:w-[360px] border-r border-glass-border bg-black/20 z-0 transition-transform ${id ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-5 flex justify-between items-center border-b border-glass-border/50">
             <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                 <FileText className="w-5 h-5 text-cyan-500" />
                 Drafts
             </h2>
         </div>
         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             {isLoading ? (
                 <div className="text-center text-slate-500 mt-10">Loading drafts...</div>
             ) : error ? (
                 <div className="text-center text-red-500 mt-10">Failed to load drafts</div>
             ) : draftEmails.length === 0 ? (
                 <div className="text-center text-slate-500 mt-10">No drafts</div>
             ) : (
                 draftEmails.map(email => (
                    <EmailListItem key={email.id} email={email} basePath="/drafts" />
                 ))
             )}
         </div>
      </div>

      <div className={`flex-1 flex flex-col bg-transparent ${!id ? 'hidden md:flex' : 'flex'}`}>
         {selectedEmail ? (
             <EmailDetail email={selectedEmail} />
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <FileText className="w-16 h-16 opacity-20 mb-4" />
                <p className="text-xl">Select a draft to edit</p>
            </div>
         )}
      </div>
    </>
  );
};