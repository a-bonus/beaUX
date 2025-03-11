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
 * @param apiKey OpenRouter API Key
 * @returns The generated React component code
 */
export const generateComponent = async (prompt: string, apiKey: string): Promise<string> => {
  if (!prompt.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const systemPrompt = `You are an expert React developer. Generate a clean, functional React component based on the user's description. 
  Return ONLY valid React component code without any explanations or markdown formatting.
  The component should use functional component syntax with hooks as needed.
  Use inline styling for simplicity, but follow good React practices.`;

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
