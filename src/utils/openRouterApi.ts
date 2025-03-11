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

/**
 * Generate a React component using OpenRouter AI
 * 
 * @param prompt The description of the component to generate
 * @returns The generated React component code
 */
export const generateComponent = async (prompt: string): Promise<string> => {
  if (!prompt.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  // Use the environment variable for the API key
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const systemPrompt = `You are an expert React developer. Generate clean, functional React components based on user descriptions.

CRITICAL RENDERING REQUIREMENTS:
- Use ONLY the named function syntax: function ComponentName() {} (NOT arrow functions or const declarations)
- ALWAYS begin with imports: import React, { useState, useEffect, etc. } from 'react';
- Include PropTypes import if you use prop validation: import PropTypes from 'prop-types';
- The component MUST be defined with the exact pattern 'function ComponentName() {' for the renderer to detect it
- Return ONLY valid code without explanations or markdown formatting

HOW THE BEAUX PREVIEWER WORKS:
- It looks for a function component using the regex pattern /function\\s+([^({\\s]+)/ to extract the component name
- It creates a sandboxed iframe with React, ReactDOM, and Babel pre-loaded
- It injects your component code into this iframe and renders it
- Your component must be completely self-contained with all necessary imports

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

EXAMPLE OF A FULLY FUNCTIONAL COMPONENT:
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function ProductCard({ name, price, imageUrl, onAddToCart, isOnSale = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  
  useEffect(() => {
    // This is just a demonstration effect
    if (isInCart) {
      console.log('${name} was added to cart');
    }
  }, [isInCart, name]);
  
  const cardStyle = {
    border: isHovered ? '1px solid blue' : '1px solid #eee',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: isOnSale ? '#fff8e6' : 'white',
    transition: 'all 0.3s ease',
    maxWidth: '300px'
  };
  
  const imageStyle = {
    width: '100%',
    height: 'auto',
    borderRadius: '4px'
  };
  
  function handleAddToCart() {
    setIsInCart(true);
    if (onAddToCart) {
      onAddToCart(name);
    }
  }
  
  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {imageUrl && <img src={imageUrl} alt={name} style={imageStyle} />}
      <h3 style={{ marginTop: '12px', fontSize: '18px' }}>{name}</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <span style={{ fontWeight: 'bold', color: isOnSale ? '#e63946' : '#333' }}>
          ${`{${price.toFixed(2)}}`} {isOnSale && <span style={{ fontSize: '12px' }}>SALE</span>}
        </span>
        <button 
          onClick={handleAddToCart}
          disabled={isInCart}
          aria-label={'Add ' + name + ' to cart'}
          style={{
            backgroundColor: isInCart ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: isInCart ? 'default' : 'pointer'
          }}
        >
          {isInCart ? 'Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  imageUrl: PropTypes.string,
  onAddToCart: PropTypes.func,
  isOnSale: PropTypes.bool
};
  `;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin, // Required for OpenRouter API
        'X-Title': 'beaUX Component Generator'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // You can change this to another model
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Create a React component that: ${prompt}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate component');
    }

    const data = await response.json() as OpenRouterResponse;
    
    // Extract the generated code from the response
    const generatedCode = data.choices[0]?.message?.content?.trim() || '';
    
    return generatedCode;
  } catch (error) {
    console.error('Error generating component:', error);
    throw error;
  }
};
