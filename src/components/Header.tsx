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
            <rect width="200" height="200" rx="40" fill="#00E5C7" />
            <path 
              d="M135.278 75.419C127.384 54.384 98.4344 67.49 100.009 92.002C101.585 67.49 72.6358 54.384 64.7417 75.419C56.8477 96.453 77.8824 125.403 100.009 142.35C122.136 125.403 143.171 96.453 135.278 75.419Z" 
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
