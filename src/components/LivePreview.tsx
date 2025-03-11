import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { transformCode } from '@/utils/transformCode';

interface LivePreviewProps {
  code: string;
  className?: string;
}

const LivePreview: React.FC<LivePreviewProps> = ({
  code,
  className,
}) => {
  const [renderKey, setRenderKey] = useState(0);
  const { Component, error } = transformCode(code);

  // Re-render when code changes with a slight delay to avoid excessive renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderKey(prev => prev + 1);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <div className={cn(
      "flex flex-col h-full rounded-lg border border-input overflow-hidden",
      className
    )}>
      <div className="flex items-center justify-between bg-muted/60 py-2 px-4 border-b border-border/60">
        <h3 className="text-sm font-medium">Live Preview</h3>
        <div className="flex items-center space-x-1">
          <div className="h-2 w-2 rounded-full bg-red-500 opacity-70" />
          <div className="h-2 w-2 rounded-full bg-yellow-500 opacity-70" />
          <div className="h-2 w-2 rounded-full bg-green-500 opacity-70" />
        </div>
      </div>
      
      <div className="flex-1 bg-background flex items-center justify-center p-8 overflow-auto">
        <div className="relative w-full max-h-full overflow-auto">
          {error ? (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 max-w-md">
              <h4 className="font-medium text-sm text-destructive mb-1">Rendering Error</h4>
              <pre className="text-xs text-destructive/90 whitespace-pre-wrap font-mono">{error}</pre>
            </div>
          ) : !Component ? (
            <div className="text-center animate-pulse-subtle">
              <div className="w-16 h-16 mx-auto mb-4 opacity-20">
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-full h-full"
                >
                  <path d="M7 8h10" />
                  <path d="M7 12h4" />
                  <path d="M7 16h10" />
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                </svg>
              </div>
              <p className="text-muted-foreground text-sm">
                Start writing code to see your component
              </p>
            </div>
          ) : (
            <div 
              key={renderKey} 
              className="preview-container animate-fade-in w-full"
            >
              {React.createElement(Component)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivePreview;
