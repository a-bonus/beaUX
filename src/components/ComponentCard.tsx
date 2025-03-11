import React from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { transformCode } from '@/utils/transformCode';

interface ComponentCardProps {
  name: string;
  description: string;
  code: string;
  onSelect: (code: string) => void;
  className?: string;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  name,
  description,
  code,
  onSelect,
  className,
}) => {
  // Transform the code to render a preview
  const { Component, error } = transformCode(code);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success('Component code copied to clipboard');
  };

  const handleSelect = () => {
    onSelect(code);
    toast.success(`${name} added to editor`);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border/30 bg-card",
        "transition-all duration-300 hover:border-border/80 hover:shadow-lg hover:-translate-y-1",
        "cursor-pointer",
        className
      )}
      onClick={handleSelect}
    >
      {/* Preview Container - larger and more prominent */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/40">
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {error ? (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">Error rendering component</div>
          ) : Component ? (
            <div className="preview-container transform-gpu scale-100 transition-transform hover:scale-105">
              {React.createElement(Component)}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No preview available</div>
          )}
        </div>
        
        {/* Overlay with buttons that appears on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
          <span className="text-white font-medium text-sm truncate max-w-[70%]">{name}</span>
          <div className="flex space-x-2">
            <button
              onClick={handleCopy}
              className="text-white bg-black/30 p-1.5 rounded-md hover:bg-black/50 transition-colors"
              aria-label="Copy component code"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(code); 
                toast.success(`${name} added to editor`);
              }}
              className="text-white bg-primary/80 p-1.5 rounded-md hover:bg-primary transition-colors"
              aria-label="Use this component"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 6 6 9-9" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Component details */}
      <div className="p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <h3 className="font-medium text-sm">{name}</h3>
        </div>
        <p className="text-muted-foreground text-xs line-clamp-2">{description}</p>
      </div>
    </div>
  );
};

export default ComponentCard;
