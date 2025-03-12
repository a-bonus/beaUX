import React, { useState } from 'react';
import { generateComponent } from '@/utils/openRouterApi';
import { cn } from '@/lib/utils';
import { transformCode } from '@/utils/transformCode';

interface AIComponentGeneratorProps {
  onGenerate: (code: string) => void;
  className?: string;
}

const AIComponentGenerator: React.FC<AIComponentGeneratorProps> = ({
  onGenerate,
  className,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a component description');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setValidationError(null);

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenRouter API key is not configured');
      }
      
      const result = await generateComponent(prompt, apiKey);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Store the generated code instead of immediately passing it to parent
      setGeneratedCode(result.component);
      setIsEditing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate component');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGeneratedCode(e.target.value);
  };

  const validateComponent = () => {
    try {
      // Use the transformCode function to validate if the component will render
      const { Component, error } = transformCode(generatedCode);
      
      if (error) {
        setValidationError(error);
        return false;
      }
      
      return true;
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Component validation failed');
      return false;
    }
  };

  const handleSave = () => {
    if (validateComponent()) {
      onGenerate(generatedCode);
      setIsEditing(false);
      setPrompt('');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setGeneratedCode('');
    setValidationError(null);
  };

  // Auto-fix common issues in the generated code
  const handleAutoFix = () => {
    let fixedCode = generatedCode;
    
    // Fix useState without React prefix
    fixedCode = fixedCode.replace(/\bconst\s+\[\w+,\s*\w+\]\s*=\s*useState\(/g, 
                                 'const [$1, $2] = React.useState(');
    
    // Fix useEffect without React prefix
    fixedCode = fixedCode.replace(/\buseEffect\(/g, 'React.useEffect(');
    
    // Fix useRef without React prefix
    fixedCode = fixedCode.replace(/\buseRef\(/g, 'React.useRef(');
    
    // Fix other common hooks
    fixedCode = fixedCode.replace(/\buseCallback\(/g, 'React.useCallback(');
    fixedCode = fixedCode.replace(/\buseMemo\(/g, 'React.useMemo(');
    
    // Remove import statements
    fixedCode = fixedCode.replace(/^import.*from\s+['"].*['"];?\n?/gm, '');
    
    setGeneratedCode(fixedCode);
    validateComponent();
  };

  return (
    <div className={cn(
      "rounded-lg border border-input p-4 bg-background",
      className
    )}>
      <h3 className="text-sm font-medium mb-3">AI Component Generator</h3>
      
      {!isEditing ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-xs text-muted-foreground block">
              Component Description
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-[100px] resize-y rounded-md border border-input px-3 py-2"
              placeholder="E.g., Create a dark mode toggle button with a sun/moon icon"
            />
          </div>
          
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
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Review & Edit Component</h4>
            <button
              onClick={handleAutoFix}
              className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-md"
            >
              Auto-Fix Common Issues
            </button>
          </div>
          
          <div className="space-y-2">
            <textarea
              value={generatedCode}
              onChange={handleCodeChange}
              className="w-full min-h-[200px] resize-y rounded-md border border-input px-3 py-2 font-mono text-sm"
            />
          </div>
          
          {validationError && (
            <div className="text-sm text-red-500 mt-2">
              <p className="font-medium">Validation Error:</p>
              <p>{validationError}</p>
            </div>
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm"
            >
              Save & Preview
            </button>
            <button
              onClick={handleCancel}
              className="py-2 px-4 rounded-md bg-secondary text-secondary-foreground text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIComponentGenerator;
