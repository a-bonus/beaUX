import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const location = useLocation();
  const isReactWebPage = location.pathname === '/react-web';
  
  return (
    <header className={cn(
      "w-full py-4 px-8 flex items-center justify-between border-b border-border/60",
      "backdrop-blur-sm bg-background/70 supports-[backdrop-filter]:bg-background/60",
      "transition-all duration-200 ease-in-out z-50",
      className
    )}>
      <div className="flex items-center gap-6">
        {/* beaUX Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
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
          </Link>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex items-center space-x-1">
          <Link 
            to="/" 
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              !isReactWebPage 
                ? "bg-primary/10 text-primary font-medium" 
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            React Native
          </Link>
          <Link 
            to="/react-web" 
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              isReactWebPage 
                ? "bg-primary/10 text-primary font-medium" 
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            React Web
          </Link>
        </nav>
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
