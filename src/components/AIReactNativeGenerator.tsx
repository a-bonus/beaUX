import React, { useState } from 'react';
import { generateReactNativeComponent } from '@/utils/openRouterApi';
import { cn } from '@/lib/utils';

interface AIReactNativeGeneratorProps {
  onGenerate: (code: string, prompt: string) => void;
  className?: string;
}

function AIReactNativeGenerator({ 
  onGenerate,
  className,
}: AIReactNativeGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string, code?: string}>>([]);
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a component description');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, { role: 'user', content: prompt }]);

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenRouter API key is not configured');
      }
      
      const result = await generateReactNativeComponent(prompt, apiKey, chatHistory);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Add AI response to chat history
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'I generated this React Native component:',
        code: result.component
      }]);
      
      // Pass generated code and prompt to parent
      onGenerate(result.component, prompt);
      
      // Clear prompt for next message
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate component');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn(
      "rounded-lg border border-input p-4 bg-background flex flex-col h-[700px]", 
      className
    )}>
      <h3 className="text-sm font-medium mb-3">AI React Native Generator</h3>
      
      {/* Chat History - Now much taller */}
      <div className="flex-grow overflow-hidden mb-4 flex flex-col">
        <div className="flex-grow overflow-y-auto p-2 border border-input rounded-md">
          {chatHistory.length > 0 ? (
            <div className="space-y-4">
              {chatHistory.map((message, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "p-3 rounded-lg", 
                    message.role === 'user' 
                      ? "bg-blue-100 ml-4" 
                      : "bg-gray-100 mr-4"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.code && (
                    <div className="mt-2 p-2 bg-gray-800 text-white rounded text-xs font-mono overflow-x-auto max-h-[300px] overflow-y-auto">
                      <pre className="text-xs">{message.code}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Your component generation history will appear here</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      {/* Input Area - Now at the bottom */}
      <div className="mt-auto">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full min-h-[100px] resize-y rounded-md border border-input px-3 py-2"
          placeholder="E.g., Create a React Native card component with an image, title, and description"
        />
        
        <div className="flex justify-end mt-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={cn(
              "inline-flex items-center gap-1 px-4 py-2 rounded-md font-medium text-white",
              isGenerating
                ? "bg-primary/70 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isGenerating ? 'Generating...' : 'Generate Component'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIReactNativeGenerator;
