
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
        "group relative flex flex-col overflow-hidden rounded-lg border border-border/40 bg-card p-4",
        "transition-all duration-200 hover:border-border/80 hover:shadow-subtle",
        "cursor-pointer",
        className
      )}
      onClick={handleSelect}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-sm">{name}</h3>
        <button
          onClick={handleCopy}
          className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Copy component code"
        >
          <svg
            width="16"
            height="16"
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
      </div>
      <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{description}</p>
      <div className="mt-auto flex-1 rounded-md bg-secondary/50 p-3 flex items-center justify-center">
        {error ? (
          <div className="text-xs text-destructive">Error rendering component</div>
        ) : Component ? (
          <div className="preview-container scale-[0.8] transform-gpu">
            {React.createElement(Component)}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No preview available</div>
        )}
      </div>
    </div>
  );
};

export default ComponentCard;
