/**
 * Utility for making API calls to OpenRouter
 * https://openrouter.ai/docs/quickstart
 */

// Define the response type
interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
    index: number;
  }[];
  id: string;
  model: string;
  object: string;
}

interface GenerateComponentResponse {
  component: string;
  error: string | null;
}

/**
 * Generate a React component using OpenRouter AI
 * 
 * @param prompt The description of the component to generate
 * @param apiKey The OpenRouter API key
 * @returns The generated React component code
 */
export async function generateComponent(prompt: string, apiKey: string): Promise<GenerateComponentResponse> {
  if (!prompt.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const systemPrompt = `You are an expert React developer. Generate clean, functional React components based on user descriptions.

CRITICAL RENDERING REQUIREMENTS:
- DO NOT include imports in your response 
- Use ONLY the named function syntax: function ComponentName() {} (NOT arrow functions or const declarations)
- Component name MUST be in PascalCase and descriptive (e.g., TestComponent, UserProfile)
- DO NOT use export statements - the component will be rendered directly
- Add Component.displayName = 'ComponentName' for better debugging
- ALWAYS begin with imports: import React, { useState, useEffect, etc. } from 'react';
- Include PropTypes import if you use prop validation: import PropTypes from 'prop-types';
- The component MUST be defined with the exact pattern 'function ComponentName() {' for the renderer to detect it
- Return ONLY valid code without explanations or markdown formatting

HOW THE BEAUX PREVIEWER WORKS:
- It looks for a function component using the regex pattern /function\\s+([^({\\s]+)/ to extract the component name
- It creates a sandboxed iframe with React, ReactDOM, and Babel pre-loaded
- It injects your component code into this iframe and renders it
- Your component must be completely self-contained with all necessary imports
- The beaUX previewer creates a sandboxed environment with just React, ReactDOM, and Babel - it doesn't include external CSS or icon libraries.

COMPONENT STRUCTURE:
- Use PascalCase for component names (e.g., UserProfile not userProfile)
- Define props with clear destructuring at the top of the component
- Include PropTypes for type checking when appropriate
- Group related state hooks together
- Place useEffect hooks after state declarations
- Handle loading/error states where appropriate

STYLING APPROACH:
- Use inline styling via the style={{}} attribute for simplicity
- Group related styles in objects for readability
- Follow responsive design principles

CODE QUALITY:
- Include concise, helpful comments for complex logic
- Implement proper event handling with appropriate naming (handleClick, etc.)
- Ensure accessibility with proper aria attributes and semantic HTML
- Extract complex logic to separate named functions within the component

EXAMPLE #1 - Simple Component: (DO NOT INCLUDE IMPORTS)
function TestComponent() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Hello World</h1>
    </div>
  );
}

TestComponent.displayName = 'TestComponent'; (DO NOT INCLUDE IMPORTS)

EXAMPLE #2 - Interactive Component:
function UIComponent() {
  const [isActive, setIsActive] = useState(false);
  
  const buttonStyle = {
    backgroundColor: isActive ? '#4CAF50' : '#2196F3',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  };

  const starIcon = (
    <svg viewBox="0 0 576 512" style={{ width: '20px', height: '20px', fill: 'currentColor', marginRight: '8px' }}>
      <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/>
    </svg>
  );

  return (
    <div style={{ padding: '20px' }}>
      <button 
        style={buttonStyle}
        onClick={() => setIsActive(!isActive)}
        aria-pressed={isActive}
      >
        {starIcon}
        {isActive ? 'Active' : 'Inactive'}
      </button>
    </div>
  );
}

UIComponent.displayName = 'UIComponent';`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'beaUX'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      component: data.choices[0].message.content,
      error: null
    };
  } catch (error) {
    console.error('Error generating component:', error);
    return {
      component: '',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}
