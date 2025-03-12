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
          acc[name] = version;
        }
        return acc;
      }, {} as Record<string, string>);

      // Send message to Snack iframe
      const message = {
        type: 'snackager',
        code,
        name: 'beaUX Generated Component',
        description: 'Created with beaUX',
        dependencies: depsObject,
        platform,
        files: {
          'App.js': {
            type: 'CODE',
            contents: code
          }
        }
      };

      console.log('Updating Snack with:', { code: code.substring(0, 50) + '...', platform, dependencies });
      iframeRef.current.contentWindow?.postMessage(message, 'https://snack.expo.dev');
    } catch (error) {
      console.error('Error updating Snack:', error);
    }
  }, [code, dependencies, platform, snackReady]);

  return (
    <div className={`w-full h-[500px] relative ${className || ''}`}>
      <iframe
        ref={iframeRef}
        id={snackId}
        title="Expo Snack"
        src={`https://snack.expo.dev/embedded?platform=${platform}&preview=true&theme=light&name=beaUX%20Component&supportedPlatforms=ios,android,web`}
        className="w-full h-full rounded-md border border-border"
        frameBorder="0"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; microphone; usb; web-share"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      />
      {!snackReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-md">
          <div className="text-sm text-foreground animate-pulse">
            Loading Expo Snack...
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpoSnackPreview;
