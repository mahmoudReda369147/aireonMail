import React, { useState } from 'react';
import { generateVideo, generateImage } from '../services/geminiService';
import { Video, Image as ImageIcon, Loader2, Play, Sparkles } from 'lucide-react';

export const VeoStudio: React.FC = () => {
  const [mode, setMode] = useState<'generate' | 'animate'>('generate');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setResultUrl(null);
    try {
      if (mode === 'generate') {
         // Generate video from text
         const url = await generateVideo(prompt, aspectRatio);
         setResultUrl(url);
      } else {
         // Just a demo for Image Gen for now as "Animate" usually requires an input image
         // We will use the Image Gen PRO model here
         const url = await generateImage(prompt, "1K");
         setResultUrl(url);
      }
    } catch (e) {
      alert("Generation failed. See console.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 mb-4 tracking-tight">Creative Studio</h1>
        <p className="text-slate-400 text-lg">Powered by Veo 3.1 & Gemini 3 Pro Image</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          
          {/* Mode Switcher */}
          <div className="bg-glass border border-glass-border rounded-2xl p-1.5 flex">
            <button 
              onClick={() => setMode('generate')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${mode === 'generate' ? 'bg-surface border border-glass-border text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Video Mode
            </button>
            <button 
               onClick={() => setMode('animate')}
               className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${mode === 'animate' ? 'bg-surface border border-glass-border text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Image Mode
            </button>
          </div>

          <div className="space-y-6 bg-glass border border-glass-border p-6 rounded-3xl backdrop-blur-sm">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Creative Prompt</label>
               <textarea 
                className="w-full p-4 rounded-xl border border-glass-border bg-black/20 text-white placeholder:text-slate-600 focus:border-fuchsia-500 outline-none h-40 resize-none transition-colors text-base leading-relaxed"
                placeholder={mode === 'generate' ? "Describe the video you want to generate..." : "Describe the image you want to create..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
               />
             </div>

             {mode === 'generate' && (
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setAspectRatio('16:9')}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${aspectRatio === '16:9' ? 'border-fuchsia-500 bg-fuchsia-500/10 text-white' : 'border-glass-border text-slate-500 hover:border-slate-500'}`}
                    >
                      Landscape (16:9)
                    </button>
                    <button 
                      onClick={() => setAspectRatio('9:16')}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${aspectRatio === '9:16' ? 'border-fuchsia-500 bg-fuchsia-500/10 text-white' : 'border-glass-border text-slate-500 hover:border-slate-500'}`}
                    >
                      Portrait (9:16)
                    </button>
                  </div>
               </div>
             )}

             <button 
               onClick={handleGenerate}
               disabled={loading || !prompt}
               className="w-full py-4 bg-brand-gradient hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-purple-500/30 transition-all text-lg"
             >
               {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <Sparkles className="w-5 h-5"/>}
               {loading ? 'Generating...' : 'Generate Magic'}
             </button>
          </div>
        </div>

        <div className="lg:col-span-8 bg-black/40 rounded-3xl border border-glass-border flex items-center justify-center min-h-[500px] overflow-hidden relative shadow-inner">
           {loading && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-fuchsia-500 blur-xl opacity-20 animate-pulse"></div>
                    <Loader2 className="w-16 h-16 text-fuchsia-500 animate-spin relative z-10" />
                </div>
                <p className="text-white font-bold mt-6 text-lg tracking-wide">Synthesizing Pixels...</p>
                {mode === 'generate' && <p className="text-sm text-slate-400 mt-2">Veo is dreaming up your video.</p>}
             </div>
           )}

           {!resultUrl && !loading && (
             <div className="text-center text-slate-600">
                <div className="w-24 h-24 bg-surface border border-glass-border rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg">
                  <Play className="w-10 h-10 opacity-30 ml-1" />
                </div>
                <p className="text-lg font-medium">Your creation will manifest here</p>
             </div>
           )}

           {resultUrl && (
             mode === 'generate' ? (
                <video src={resultUrl} controls className="w-full h-full object-contain" autoPlay loop />
             ) : (
                <img src={resultUrl} alt="Generated" className="w-full h-full object-contain" />
             )
           )}
        </div>
      </div>
    </div>
  );
};