import React, { useState } from 'react';
import { generateComponent } from '@/utils/openRouterApi';
import { cn } from '@/lib/utils';

interface AIComponentGeneratorProps {
  onGenerate: (code: string) => void;
  className?: string;
}

const AIComponentGenerator: React.FC<AIComponentGeneratorProps> = ({
  onGenerate,
  className,
}) => {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a component description');
      return;
    }

    if (!apiKey.trim()) {
      setError('Please enter your OpenRouter API key');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedCode = await generateComponent(prompt, apiKey);
      onGenerate(generatedCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate component');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn(
      "rounded-lg border border-input p-4 bg-background",
      className
    )}>
      <h3 className="text-sm font-medium mb-3">AI Component Generator</h3>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="apiKey" className="text-xs text-muted-foreground block">
            OpenRouter API Key
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenRouter API key"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-xs text-muted-foreground block">
            Component Description
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the component you want to generate..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
          />
        </div>

        {error && (
          <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {error}
          </div>
        )}
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={cn(
            "w-full rounded-md px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors",
            "disabled:opacity-50 disabled:pointer-events-none",
            "flex items-center justify-center"
          )}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Component'
          )}
        </button>
      </div>
    </div>
  );
};

export default AIComponentGenerator;
