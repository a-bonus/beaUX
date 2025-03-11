// Simplified transformCode function - no imports needed
export const transformCode = (code: string): { Component: any | null; error: string | null } => {
  try {
    // Check if the code is empty
    if (!code.trim()) {
      return { 
        Component: null, 
        error: null 
      };
    }

    // Extract the component name from the code
    const componentName = code.match(/function\s+([^({\s]+)/)?.[1] || 'MyComponent';
    
    // Simple approach: evaluate the code directly in the context where React is available
    try {
      // Since we're using Vite/React, we need to access React from the global scope
      // to ensure JSX works properly when evaluated
      const ReactLib = (window as any).React;
      
      if (!ReactLib) {
        return {
          Component: null,
          error: "React not found in global scope. Make sure React is globally available."
        };
      }
      
      // Use Function constructor to create a function that can execute our code
      const fn = new Function('React', `
        try {
          ${code}
          return ${componentName};
        } catch (e) {
          throw e;
        }
      `);
      
      // Execute with React from the global scope
      const Component = fn(ReactLib);
      
      if (typeof Component !== 'function') {
        return {
          Component: null,
          error: `Component "${componentName}" is not a valid function. Make sure you're returning a React component.`
        };
      }
      
      return { Component, error: null };
    } catch (err) {
      console.error("Component evaluation error:", err);
      return {
        Component: null,
        error: err instanceof Error ? err.message : "Error evaluating component"
      };
    }
  } catch (error) {
    console.error("Error transforming code:", error);
    return { 
      Component: null, 
      error: error instanceof Error ? error.message : "Unknown error processing code" 
    };
  }
};

// Extend Window interface to add our temporary properties
declare global {
  interface Window {
    _tempComponent?: any;
    _tempComponentError?: string;
  }
}
