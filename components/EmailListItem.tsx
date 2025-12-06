import React, { useState, useEffect } from 'react';
import { Email } from '../types';
import { Sparkles, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { getSmartInboxAnalysis } from '../services/geminiService';

interface Props {
  email: Email;
  basePath: string;
}

export const EmailListItem: React.FC<Props> = ({ email, basePath }) => {
  const navigate = useNavigate();
  const { id } = useParams<{id: string}>();
  const { updateEmail } = useAppContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const selected = id === email.id;

  useEffect(() => {
    // Automatically generate summary if missing
    if (!email.summary && !isAnalyzing) {
      const analyze = async () => {
        // Add random stagger delay (0-5s) to avoid thundering herd on inbox load causing 429s
        const staggerMs = Math.random() * 5000;
        await new Promise(resolve => setTimeout(resolve, staggerMs));

        setIsAnalyzing(true);
        try {
          // Determine if we should treat this as a smart analysis or just summary
          // getSmartInboxAnalysis returns { priorityScore, summary, tags }
          const analysis = await getSmartInboxAnalysis(email.body, email.subject);
          
          updateEmail(email.id, {
             summary: analysis.summary,
             // We preserve existing priority/tags if they exist, otherwise use AI suggestions
             priorityScore: email.priorityScore ?? analysis.priorityScore,
             tags: (email.tags && email.tags.length > 0) ? email.tags : analysis.tags
          });
        } catch (e) {
          console.error("Summary generation failed", e);
        } finally {
          setIsAnalyzing(false);
        }
      };
      analyze();
    }
  }, [email.id, email.summary]);

  return (
    <div 
        onClick={() => navigate(`${basePath}/${email.id}`)}
        className={`group relative p-5 mb-3 rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-sm ${
        selected 
        ? 'bg-glass-gradient border-fuchsia-500/30 shadow-[0_0_30px_rgba(236,72,153,0.15)]' 
        : 'bg-glass border-transparent hover:bg-glass-hover hover:border-glass-border'
        }`}
    >
        <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selected ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white' : 'bg-surface border border-glass-border text-slate-400'}`}>
            {email.sender[0]}
            </div>
            <h4 className={`text-sm ${!email.read ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
            {email.sender}
            </h4>
            {email.isSmart && (
            <Sparkles className="w-3 h-3 text-cyan-400 fill-cyan-400/20 animate-pulse" />
            )}
        </div>
        <span className="text-[10px] font-medium text-slate-500">{email.timestamp}</span>
        </div>
        
        <div className="pl-11">
            <div className="flex justify-between items-center mb-1">
                <h5 className="text-sm font-semibold text-slate-200 truncate pr-4">{email.subject}</h5>
                {email.priorityScore && email.priorityScore > 70 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    High Priority
                    </span>
                )}
            </div>

            {/* AI Summary Snippet */}
            {(email.summary || isAnalyzing) && (
                <div className={`mb-2 p-2 rounded-xl border flex gap-2 items-start transition-all ${selected ? 'bg-fuchsia-500/10 border-fuchsia-500/20' : 'bg-white/5 border-white/5'}`}>
                    {isAnalyzing ? (
                        <Loader2 className="w-3 h-3 text-fuchsia-400 animate-spin mt-0.5 shrink-0" />
                    ) : (
                        <Sparkles className="w-3 h-3 text-fuchsia-400 mt-0.5 shrink-0" />
                    )}
                    <p className={`text-[11px] leading-relaxed ${selected ? 'text-fuchsia-100' : 'text-slate-300'}`}>
                        {isAnalyzing ? "Generating smart summary..." : email.summary}
                    </p>
                </div>
            )}

            {!email.summary && !isAnalyzing && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed opacity-70">{email.preview}</p>
            )}

            {email.tags && (
            <div className="flex gap-2 mt-3">
                {email.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-surface border border-glass-border text-slate-400 group-hover:border-slate-700 transition-colors">
                    {tag}
                </span>
                ))}
            </div>
            )}
        </div>
  </div>
  );
};