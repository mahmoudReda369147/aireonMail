import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ElementType;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({ icon: Icon, containerClassName = '', className = '', ...props }) => (
  <div className={`relative group ${containerClassName}`}>
    {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-fuchsia-400 transition-colors" />}
    <input 
      className={`w-full bg-glass backdrop-blur-md border border-glass-border rounded-2xl ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 text-sm text-white focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 outline-none transition-all placeholder:text-slate-600 shadow-xl shadow-black/5 ${className}`}
      {...props}
    />
  </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
    <div className="relative group">
        <textarea
            className={`w-full bg-glass backdrop-blur-md border border-glass-border rounded-2xl p-4 text-sm text-white focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 outline-none transition-all placeholder:text-slate-600 shadow-xl shadow-black/5 resize-none ${className}`}
            {...props}
        />
    </div>
);