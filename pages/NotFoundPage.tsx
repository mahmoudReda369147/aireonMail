import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full w-full relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center max-w-lg">
        <div className="relative mb-8 group">
           <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
           <Ghost className="w-32 h-32 text-slate-500 relative z-10 drop-shadow-2xl animate-float" />
        </div>
        
        <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 mb-2 tracking-tighter">404</h1>
        
        <h2 className="text-2xl font-bold text-white mb-4">Lost in the Void</h2>
        
        <p className="text-slate-400 mb-8 leading-relaxed text-lg">
          The page you are looking for has vanished into the digital ether. 
          The AI agents couldn't find it in your workspace.
        </p>

        <div className="flex gap-4">
            <Button onClick={() => navigate(-1)} variant="secondary" icon={ArrowLeft}>
                Go Back
            </Button>
            <Button onClick={() => navigate('/')} icon={Home}>
                Return Home
            </Button>
        </div>
      </div>
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
    </div>
  );
};