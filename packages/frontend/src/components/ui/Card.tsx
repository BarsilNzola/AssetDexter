import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div className={`
      bg-background-card rounded-xl shadow-lg border-2 border-primary/20 p-6
      ${hover ? 'transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/40' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};