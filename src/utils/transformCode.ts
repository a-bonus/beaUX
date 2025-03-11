
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
    const componentNameMatch = code.match(/function\s+([^({\s]+)/);
    const componentName = componentNameMatch ? componentNameMatch[1] : 'MyComponent';
    
    // Get React from the global scope
    const ReactLib = (window as any).React;
    
    if (!ReactLib) {
      return {
        Component: null,
        error: "React not found in global scope. Make sure React is globally available."
      };
    }
    
    try {
      // Prepare the transpiled code with proper JSX support
      const functionBody = `
        ${code}
        return ${componentName};
      `;
      
      // When creating the function, pass React as a parameter
      // This ensures JSX transformation will work properly
      const fn = new Function('React', functionBody);
      
      // Execute the function with React as an argument
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
