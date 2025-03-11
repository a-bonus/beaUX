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
      // Create a blob URL for the iframe with HTML that includes React, ReactDOM, and Babel
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            #root {
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            ${code}
            
            // Render the component to the root element
            const rootElement = document.getElementById('root');
            const root = ReactDOM.createRoot(rootElement);
            root.render(React.createElement(${componentName}));
          </script>
        </body>
        </html>
      `;
      
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a simple iframe component that loads the blob URL
      const Component = () => {
        // Clean up the blob URL when the component unmounts
        ReactLib.useEffect(() => {
          return () => {
            URL.revokeObjectURL(blobUrl);
          };
        }, []);
        
        return ReactLib.createElement('iframe', {
          src: blobUrl,
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: 'white',
          },
          title: 'Component Preview',
        });
      };
      
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
