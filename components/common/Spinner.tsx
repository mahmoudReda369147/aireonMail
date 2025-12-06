import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fullScreen?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const spinnerContent = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-fuchsia-500`} />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-midnight/50 backdrop-blur-sm">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};