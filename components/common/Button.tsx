import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  isLoading?: boolean;
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  className = '', 
  children, 
  isLoading, 
  icon: Icon,
  ...props 
}) => {
  const baseStyle = "rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-gradient text-white shadow-lg shadow-purple-500/20 hover:opacity-90 px-6 py-2.5 text-sm",
    secondary: "bg-surface border border-glass-border text-slate-300 hover:bg-glass-hover hover:text-white px-4 py-2 text-sm",
    ghost: "text-slate-400 hover:text-white hover:bg-glass-hover px-3 py-1.5 text-sm",
    icon: "p-2 text-slate-400 hover:text-white hover:bg-glass-hover aspect-square"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (Icon && <Icon className="w-4 h-4" />)}
      {children}
    </button>
  );
};