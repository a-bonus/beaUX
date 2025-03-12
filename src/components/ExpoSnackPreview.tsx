import React, { useEffect, useRef, useState } from 'react';

interface ExpoSnackPreviewProps {
  code: string;
  dependencies?: string;
  platform?: 'web' | 'ios' | 'android' | 'mydevice';
  className?: string;
}

function ExpoSnackPreview({ 
  code, 
  dependencies = 'expo-constants,react-native-paper@4', 
  platform = 'web',
  className
}: ExpoSnackPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [snackId] = useState(() => `snack-${Math.random().toString(36).substring(2, 11)}`);
  const [snackReady, setSnackReady] = useState(false);

  // This will handle loading the SDK script only once
  useEffect(() => {
    // Check if the script already exists
    if (!document.getElementById('snack-sdk-script')) {
      const script = document.createElement('script');
      script.id = 'snack-sdk-script';
      script.src = 'https://snack.expo.dev/embed.js';
      script.async = true;
      script.onload = () => {
        console.log('Expo Snack SDK loaded');
        setSnackReady(true);
      };
      document.body.appendChild(script);
    } else {
      setSnackReady(true);
    }

    // Cleanup function
    return () => {
      // We don't remove the script as other instances may need it
    };
  }, []);

  // Message handler for Snack communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only process messages from Snack
      if (event.origin !== 'https://snack.expo.dev') return;
      
      // Log Snack events for debugging
      if (event.data && event.data.type === 'snack') {
        console.log('Snack event:', event.data);
        
        // If Snack signals it's ready
        if (event.data.status === 'ready') {
          setSnackReady(true);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Update the Snack when code, dependencies, or platform changes
  useEffect(() => {
    if (!snackReady || !iframeRef.current) return;
    
    try {
      // Convert dependencies string to object format expected by Snack
      const depsObject = dependencies.split(',').reduce((acc, dep) => {
        const [name, version = 'latest'] = dep.trim().split('@');
        if (name) {
          // Ensure proper versioning for known problematic packages
          if (name === 'expo-linear-gradient') {
            acc[name] = '~12.3.0'; // Use a specific compatible version
          } else {
            acc[name] = version;
          }
        }
        return acc;
      }, {} as Record<string, string>);

      // Create a modified version of the code that pre-imports the dependencies
      // to ensure they're properly initialized
      const appCode = `// App.js - Generated with beaUX
// Ensure all dependencies are properly imported
${code}

// Make sure the component is exported at the end
export default ${getComponentName(code) || 'App'};`;

      // Send message to Snack iframe
      const message = {
        type: 'snackager',
        action: 'updateSnack',
        name: 'beaUX Component',
        description: 'Created with beaUX',
        dependencies: depsObject,
        platform,
        sdkVersion: '48.0.0', // Specify a stable SDK version
        files: {
          'App.js': {
            type: 'CODE',
            contents: appCode
          }
        },
        // Force update to ensure dependencies are re-evaluated
        forceUpdate: true
      };

      console.log('Updating Snack with:', { 
        code: code.substring(0, 50) + '...', 
        platform, 
        dependencies: JSON.stringify(depsObject)
      });
      
      iframeRef.current.contentWindow?.postMessage(message, 'https://snack.expo.dev');
    } catch (error) {
      console.error('Error updating Snack:', error);
    }
  }, [code, dependencies, platform, snackReady]);

  // Function to extract component name from code
  const getComponentName = (code: string): string | null => {
    const functionMatch = code.match(/function\s+([A-Za-z0-9_]+)\s*\(/);
    if (functionMatch && functionMatch[1]) {
      return functionMatch[1];
    }
    const constMatch = code.match(/const\s+([A-Za-z0-9_]+)\s*=\s*\(\)/);
    if (constMatch && constMatch[1]) {
      return constMatch[1];
    }
    return null;
  };

  return (
    <div className={`w-full h-full rounded-md overflow-hidden bg-white ${className || ''}`}>
      {!snackReady && (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <p className="text-muted-foreground animate-pulse">Loading Expo Snack...</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Expo Snack Preview"
        src={`https://snack.expo.dev/embedded?name=beaUX%20Component&iframeId=${snackId}&preview=true&platform=${platform}&supportedPlatforms=${platform}&theme=light&sdkVersion=48.0.0&dependencies=${encodeURIComponent(dependencies)}`}
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          overflow: 'hidden',
          background: '#fafafa',
        }}
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      />
    </div>
  );
}

export default ExpoSnackPreview;
