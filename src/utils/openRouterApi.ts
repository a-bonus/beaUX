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

ESSENTIAL REQUIREMENTS:
- Use ONLY the named function syntax: function ComponentName() {} (NOT arrow functions or const declarations)
- The beaUX renderer specifically requires this syntax
- Return ONLY valid code without explanations or markdown formatting

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

EXAMPLE FORMAT:
function ProductCard({ name, price, imageUrl, onAddToCart }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const cardStyle = {
    border: isHovered ? '1px solid blue' : '1px solid #eee',
    padding: '16px',
    borderRadius: '8px',
    transition: 'all 0.3s ease'
  };
  
  function handleMouseEnter() {
    setIsHovered(true);
  }
  
  return (
    <div 
      style={cardStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Component content */}
    </div>
  );
}
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
        model: 'deepseek/deepseek-r1:free', // You can change this to another model
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
