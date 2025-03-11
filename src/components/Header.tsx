
import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={cn(
      "w-full py-4 px-8 flex items-center justify-between border-b border-border/60",
      "backdrop-blur-sm bg-background/70 supports-[backdrop-filter]:bg-background/60",
      "transition-all duration-200 ease-in-out z-50",
      className
    )}>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-primary-foreground"
          >
            <path d="M7 8h10" />
            <path d="M7 12h4" />
            <path d="M7 16h10" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Snackable UI</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          <span className="px-2 py-1 rounded-full bg-secondary text-xs font-medium">
            Beta
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
