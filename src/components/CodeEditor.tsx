
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    
    return () => {
      window.removeEventListener('resize', adjustHeight);
    };
  }, [value]);

  const handleIndent = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current!.selectionStart;
      const end = textareaRef.current!.selectionEnd;

      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Move the cursor to the right position after adding the spaces
      setTimeout(() => {
        textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd = start + 2;
      }, 0);
    }
  };

  const lineNumbers = value.split('\n').length;
  const numbers = Array.from(Array(lineNumbers).keys()).map(i => i + 1);

  return (
    <div className={cn(
      "relative rounded-lg border overflow-hidden transition-all duration-200", 
      isFocused ? "ring-2 ring-ring" : "border-input",
      className
    )}>
      <div className="absolute left-0 top-0 flex flex-col items-end py-4 px-2 bg-muted/25 text-muted-foreground text-xs select-none opacity-80">
        {numbers.map(num => (
          <div key={num} className="leading-6">{num}</div>
        ))}
      </div>
      
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleIndent}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "code-editor bg-editor-bg text-editor-text dark:bg-editor-dark dark:text-editor-darkText",
          "w-full resize-none outline-none",
          "py-4 pr-4 pl-10",
          "rounded-lg border-0"
        )}
        placeholder="Write or paste your component code here..."
        spellCheck="false"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
};

export default CodeEditor;
