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
      "rounded-lg border border-input p-4 bg-background",
      className
    )}>
      <h3 className="text-sm font-medium mb-3">AI React Native Generator</h3>
      
      {/* Chat History */}
      {chatHistory.length > 0 && (
        <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto p-2 border border-input rounded-md">
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
                <div className="mt-2 p-2 bg-gray-800 text-white rounded text-xs font-mono overflow-x-auto max-h-[150px] overflow-y-auto">
                  <pre className="text-xs">{message.code}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Input Area */}
      <div className="space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full min-h-[100px] resize-y rounded-md border border-input px-3 py-2"
          placeholder="E.g., Create a React Native card component with an image, title, and description"
        />
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={cn(
            "w-full py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm",
            isGenerating && "opacity-70 cursor-not-allowed"
          )}
        >
          {isGenerating ? "Generating..." : "Generate Component"}
        </button>
        
        {error && (
          <div className="text-sm text-red-500 mt-2">
            {error}
          </div>
        )}
      </div>
      
      {/* Help Text */}
      {chatHistory.length === 0 && (
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Describe the React Native component you want to create, and the AI will generate it for you.</p>
          <p className="mt-1">Examples:</p>
          <ul className="list-disc pl-4 mt-1 space-y-1">
            <li>A product card with image, title, price and add to cart button</li>
            <li>A login form with validation and loading state</li>
            <li>An animated toggle switch with a custom animation</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default AIReactNativeGenerator;
