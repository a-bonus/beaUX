
import { toast } from "sonner";

export const transformCode = (code: string): { Component: React.ComponentType | null; error: string | null } => {
  try {
    // Check if the code is empty
    if (!code.trim()) {
      return { 
        Component: null, 
        error: null 
      };
    }

    // Create a dynamic component from the code string
    const fullCode = `
      const React = window.React;
      ${code}
      return typeof ${code.match(/function\s+([^({\s]+)/)?.[1] || 'MyComponent'};
    `;

    // First check if the component is defined
    const checkFunction = new Function(fullCode);
    const isComponentDefined = checkFunction();

    if (isComponentDefined !== 'function') {
      return {
        Component: null,
        error: 'Invalid component definition'
      };
    }

    // Now evaluate the actual component
    const evalCode = `
      const React = window.React;
      ${code}
      return ${code.match(/function\s+([^({\s]+)/)?.[1] || 'MyComponent'};
    `;

    const ComponentFunction = new Function(evalCode);
    const Component = ComponentFunction();

    return { 
      Component, 
      error: null 
    };

  } catch (error) {
    console.error("Error transforming code:", error);
    return { 
      Component: null, 
      error: error instanceof Error ? error.message : "Unknown error processing code" 
    };
  }
};
