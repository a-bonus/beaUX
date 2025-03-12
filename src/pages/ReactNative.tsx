import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import AIReactNativeGenerator from '../components/AIReactNativeGenerator';
import ExpoSnackPreview from '../components/ExpoSnackPreview';
import { Clipboard, ClipboardCheck, History, ChevronRight, Code, ExternalLink, Send } from 'lucide-react';

const defaultReactNativeCode = `import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

function ExampleComponent() {
  const [count, setCount] = React.useState(0);
  
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Hello React Native</Text>
      <Text style={styles.paragraph}>
        Start by editing this component or using the AI generator.
      </Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setCount(count + 1)}
      >
        <Text style={styles.buttonText}>Count: {count}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    maxWidth: 300,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ExampleComponent;`;

interface HistoryItem {
  id: string;
  code: string;
  prompt: string;
  timestamp: number;
}

const ReactNativePage: React.FC = () => {
  const [code, setCode] = useState(defaultReactNativeCode);
  const [isVisible, setIsVisible] = useState(false);
  const [dependencies, setDependencies] = useState('expo-constants,react-native-paper@4');
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android' | 'mydevice'>('web');
  const [isCopied, setIsCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [recentlyAddedDeps, setRecentlyAddedDeps] = useState<string[]>([]);
  const snackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const detectDependenciesFromCode = (code: string): string[] => {
    const detectedDependencies: string[] = [];
    const importRegex = /import\s+(?:[\w\s{},*]+)\s+from\s+['"]([^./][^'"]+)['"]/g;
    
    // Find all imports that don't start with . or / (external packages)
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const packageName = match[1];
      
      // Skip React and React Native as they're included by default
      if (packageName !== 'react' && 
          packageName !== 'react-native' && 
          !packageName.startsWith('react-native/')) {
        
        // For scoped packages, we need the full name (@org/package)
        detectedDependencies.push(packageName);
      }
    }
    
    return detectedDependencies;
  };

  const handleGeneratedCode = (generatedCode: string, prompt: string) => {
    setCode(generatedCode);
    setCurrentPrompt(prompt);
    
    // Detect and add dependencies automatically
    const detectedDependencies = detectDependenciesFromCode(generatedCode);
    if (detectedDependencies.length > 0) {
      const currentDeps = dependencies.split(',').map(d => d.trim()).filter(Boolean);
      // Only add dependencies that aren't already included
      const newDepsToAdd = detectedDependencies.filter(dep => {
        // Check if dependency or dependency@version is already in the list
        return !currentDeps.some(existingDep => {
          const existingPackageName = existingDep.split('@')[0];
          return existingPackageName === dep;
        });
      });
      
      if (newDepsToAdd.length > 0) {
        const newDeps = [...currentDeps, ...newDepsToAdd];
        setDependencies(newDeps.join(','));
        // Store recently added dependencies for UI feedback
        setRecentlyAddedDeps(newDepsToAdd);
        // Clear the recently added deps after 5 seconds
        setTimeout(() => setRecentlyAddedDeps([]), 5000);
      }
    }
    
    // Add to history
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      code: generatedCode,
      prompt,
      timestamp: Date.now()
    };
    
    setHistory(prev => [newHistoryItem, ...prev]);
    
    // Automatically switch back to the Snack preview when new code is generated
    if (snackTimeoutRef.current) {
      clearTimeout(snackTimeoutRef.current);
    }
  };
  
  const loadFromHistory = (historyItem: HistoryItem) => {
    setCode(historyItem.code);
    setCurrentPrompt(historyItem.prompt);
  };
  
  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const openInExpoSnack = () => {
    const encodedCode = encodeURIComponent(code);
    // Format dependencies for proper Expo Snack URL
    const depsObject = dependencies.split(',').reduce((acc, dep) => {
      const [name, version = 'latest'] = dep.trim().split('@');
      if (name) {
        acc[name] = version;
      }
      return acc;
    }, {} as Record<string, string>);
    
    // Create a properly formatted dependencies string for the URL
    const formattedDeps = Object.entries(depsObject)
      .map(([name, version]) => `${name}@${version}`)
      .join(',');
    
    const encodedDependencies = encodeURIComponent(formattedDeps);
    const snackUrl = `https://snack.expo.dev/?code=${encodedCode}&dependencies=${encodedDependencies}&platform=${platform}&sdkVersion=48.0.0&name=beaUX%20Component`;
    
    if (typeof window !== 'undefined') {
      window.open(snackUrl, '_blank');
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className={`flex-1 container mx-auto px-4 py-6 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">React Native Playground</h1>
            <p className="text-muted-foreground">
              Create and preview React Native components with Expo Snack
            </p>
          </div>
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <History className="h-4 w-4" />
            <span>History</span>
            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground ml-1">
              {history.length}
            </span>
          </button>
        </div>
        
        {isHistoryOpen && history.length > 0 && (
          <div className="mb-6 bg-muted/40 rounded-lg p-3 border border-border">
            <h3 className="text-sm font-medium mb-2">Component History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2">
              {history.map((item) => (
                <div 
                  key={item.id}
                  className="group flex flex-col p-3 rounded-md border border-border bg-card hover:bg-card/80 cursor-pointer transition-colors"
                  onClick={() => loadFromHistory(item)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium truncate max-w-[180px]">
                      {item.prompt.length > 30 ? `${item.prompt.substring(0, 30)}...` : item.prompt}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground bg-muted/50 rounded p-1 font-mono line-clamp-2 overflow-hidden">
                    {item.code.substring(0, 100)}...
                  </div>
                  <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                    <button 
                      className="text-[10px] flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(item.code);
                      }}
                    >
                      <Clipboard className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setPlatform('web')}
            className={`px-3 py-1 rounded-md text-sm ${
              platform === 'web' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Web
          </button>
          <button
            onClick={() => setPlatform('ios')}
            className={`px-3 py-1 rounded-md text-sm ${
              platform === 'ios' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            iOS
          </button>
          <button
            onClick={() => setPlatform('android')}
            className={`px-3 py-1 rounded-md text-sm ${
              platform === 'android' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            Android
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-4 flex-1">
            <AIReactNativeGenerator 
              onGenerate={handleGeneratedCode}
              className="flex-1"
            />
            
            <div className="text-xs text-muted-foreground">
              Tip: Use the AI to generate React Native components with natural language prompts
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <div className="rounded-lg border border-input p-4 bg-background flex-1">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Live Preview</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyCodeToClipboard}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                    title="Copy code to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={openInExpoSnack}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    title="Open in Expo Snack"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open in Expo</span>
                  </button>
                </div>
              </div>
              <ExpoSnackPreview 
                code={code}
                dependencies={dependencies}
                platform={platform}
              />
            </div>
            
            <div className="rounded-lg border border-input p-4 bg-background">
              <h3 className="text-sm font-medium mb-3">Dependencies</h3>
              <input
                value={dependencies}
                onChange={(e) => setDependencies(e.target.value)}
                placeholder="expo-constants,react-native-paper@4"
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
              />
              {recentlyAddedDeps.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-xs text-green-700 animate-pulse">
                  <p className="font-medium">Dependencies automatically added:</p>
                  <ul className="mt-1 list-disc list-inside">
                    {recentlyAddedDeps.map((dep, idx) => (
                      <li key={idx}>{dep}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Comma-separated list of dependencies with optional versions
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReactNativePage;
