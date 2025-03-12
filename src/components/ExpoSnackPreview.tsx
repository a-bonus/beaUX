import React, { useEffect, useRef } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Ensure Snack embed script is loaded
    if (!document.getElementById('snack-embed-script')) {
      const script = document.createElement('script');
      script.id = 'snack-embed-script';
      script.src = 'https://snack.expo.dev/embed.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        // Clean up script when component unmounts if it was added by this component
        const embeddedScript = document.getElementById('snack-embed-script');
        if (embeddedScript) {
          document.body.removeChild(embeddedScript);
        }
      };
    }
  }, []);
  
  // When the code, dependencies, or platform changes, we need to update the container
  // This will be handled by the Expo embed.js script which looks for data-snack attributes
  useEffect(() => {
    // If there's an iframe in the container, we need to remove it so embed.js can create a new one
    if (containerRef.current) {
      // The embed.js script will automatically repopulate the container
      const iframe = containerRef.current.querySelector('iframe');
      if (iframe) {
        containerRef.current.removeChild(iframe);
      }
    }
  }, [code, dependencies, platform]);
  
  return (
    <div
      ref={containerRef}
      data-snack-code={encodeURIComponent(code)}
      data-snack-dependencies={encodeURIComponent(dependencies)}
      data-snack-name="beaUX Generated Component"
      data-snack-description="Generated with beaUX AI"
      data-snack-preview="true"
      data-snack-platform={platform}
      className={className}
      style={{
        overflow: "hidden", 
        background: "#fafafa", 
        border: "1px solid rgba(0,0,0,.08)", 
        borderRadius: "4px", 
        height: "505px", 
        width: "100%"
      }}
    />
  );
}

export default ExpoSnackPreview;
