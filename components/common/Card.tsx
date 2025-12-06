import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-glass backdrop-blur-md border border-glass-border rounded-3xl shadow-xl ${className}`}
  >
    {children}
  </div>
);