
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CodeEditor from '@/components/CodeEditor';
import LivePreview from '@/components/LivePreview';
import ComponentLibrary from '@/components/ComponentLibrary';

const defaultCode = `function MyComponent() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ 
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: '#f3f4f6',
      maxWidth: '300px'
    }}>
      <h2 style={{ 
        margin: '0', 
        marginBottom: '10px',
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827'
      }}>
        Hello beaUX
      </h2>
      
      <p style={{ 
        margin: '0',
        color: '#4b5563',
        fontSize: '14px',
        lineHeight: '1.5',
        marginBottom: '16px'
      }}>
        Start by editing this component or selecting from the library.
      </p>
      
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 16px',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Count: {count}
      </button>
    </div>
  );
}`;

const Index = () => {
  const [code, setCode] = useState(defaultCode);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSelectComponent = (componentCode: string) => {
    setCode(componentCode);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className={`flex-1 container mx-auto px-4 py-6 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
          <div className="lg:col-span-6 flex flex-col space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Code Editor</h2>
              <button
                onClick={() => setCode(defaultCode)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Reset
              </button>
            </div>
            
            <CodeEditor
              value={code}
              onChange={setCode}
              className="flex-1 shadow-subtle"
            />
            
            <div className="text-xs text-muted-foreground">
              Tip: Write React component code directly or select from the component library
            </div>
          </div>
          
          <div className="lg:col-span-6 flex flex-col space-y-6 h-full animate-slide-in-right" style={{ animationDelay: '200ms' }}>
            <LivePreview 
              code={code} 
              className="flex-1 shadow-subtle"
            />
            
            <div className="flex-1 overflow-hidden">
              <ComponentLibrary onSelectComponent={handleSelectComponent} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
