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
        {/* beaUX Logo */}
        <div className="flex items-center">
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 200 200" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            {/* Simplified phone body with more elegant proportions */}
            <rect 
              x="40" 
              y="20" 
              width="120" 
              height="160" 
              rx="24" 
              fill="#00E5C7" 
              stroke="white"
              strokeWidth="4"
            />
            
            {/* Simplified notch/camera */}
            <circle 
              cx="100" 
              cy="35" 
              r="5" 
              fill="white" 
            />
            
            {/* Simplified heart */}
            <path 
              d="M100 140 C100 140 75 120 75 100 C75 85 85 80 95 80 C99 80 100 82 100 82 C100 82 101 80 105 80 C115 80 125 85 125 100 C125 120 100 140 100 140 Z" 
              fill="white"
            />
          </svg>
          <h1 className="text-xl font-semibold tracking-tight">beaUX</h1>
        </div>
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
