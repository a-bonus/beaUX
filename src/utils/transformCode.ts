// This utility handles parsing and transforming the user-provided component code
import { toast } from "sonner";

// Transform the input code into a renderable component
export const transformCode = (code: string): { Component: React.ComponentType | null; error: string | null } => {
  try {
    // Simple transformation to create a React component from the code
    // This approach is meant for client-side-only evaluation
    
    // Check if the code is empty
    if (!code.trim()) {
      return { 
        Component: null, 
        error: null 
      };
    }

    // Check if the code wraps the component in a function or not
    const hasFunction = /function\s+\w+\s*\(\s*\)\s*{/.test(code);
    
    // Safe transformation of the code using Function constructor
    let transformedCode;
    
    if (hasFunction) {
      // If it's already a function, wrap it to return the component
      transformedCode = `
        const React = window.React;
        ${code}
        return eval(code.match(/function\\s+(\\w+)\\s*\\(/)[1]);
      `;
    } else {
      // Otherwise, wrap it in a component
      transformedCode = `
        const React = window.React;
        function SnackableComponent() {
          ${code}
        }
        return SnackableComponent;
      `;
    }
    
    // Create a component from the code
    const ComponentFunction = new Function(transformedCode);
    const Component = ComponentFunction();
    
    return { 
      Component, 
      error: null 
    };
    
  } catch (error) {
    console.error("Error transforming code:", error);
    toast.error("There was an error processing your code");
    return { 
      Component: null, 
      error: error instanceof Error ? error.message : "Unknown error processing code" 
    };
  }
};
