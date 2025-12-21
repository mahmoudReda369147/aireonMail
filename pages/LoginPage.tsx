import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Sparkles, Hexagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login, isLoggingIn } = useAppContext();
  const navigate = useNavigate();

   const handleLogin = () => {
    window.location.href = 'http://localhost:3000/api/auth/login';
  };

  return (
    <div className="h-screen w-full bg-midnight text-slate-200 font-sans bg-aurora bg-no-repeat bg-cover flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-md bg-glass backdrop-blur-2xl border border-glass-border rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 p-12 flex flex-col items-center text-center">
        
        {/* Logo Section */}
        <div className="mb-8 relative group">
           <div className="absolute inset-0 bg-fuchsia-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
           <Hexagon className="w-16 h-16 text-fuchsia-500 relative z-10" />
           <Sparkles className="w-6 h-6 text-cyan-400 absolute -top-2 -right-2 animate-bounce" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Aireon</h1>
        <p className="text-slate-400 mb-10 text-lg">Next-generation intelligent email.</p>

        {/* Google Button */}
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-medium py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-4 group shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          <span className="text-lg">Continue with Google</span>
        </button>

        <p className="mt-8 text-xs text-slate-500">
            By clicking continue, you agree to our <span className="text-slate-400 underline cursor-pointer">Terms</span> and <span className="text-slate-400 underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>

      <div className="absolute bottom-6 text-slate-600 text-xs font-mono">
        POWERED BY GEMINI 2.5
      </div>
    </div>
  );
};