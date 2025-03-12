import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import AIReactNativeGenerator from '../components/AIReactNativeGenerator';
import ExpoSnackPreview from '../components/ExpoSnackPreview';

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

const ReactNativePage: React.FC = () => {
  const [code, setCode] = useState(defaultReactNativeCode);
  const [isVisible, setIsVisible] = useState(false);
  const [dependencies, setDependencies] = useState('expo-constants,react-native-paper@4');
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android' | 'mydevice'>('web');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleGeneratedCode = (generatedCode: string) => {
    setCode(generatedCode);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className={`flex-1 container mx-auto px-4 py-6 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="mb-4">
          <h1 className="text-2xl font-bold">React Native Playground</h1>
          <p className="text-muted-foreground">
            Create and preview React Native components with Expo Snack
          </p>
        </div>
        
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
          <div className="flex flex-col space-y-4">
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
              <h3 className="text-sm font-medium mb-3">Live Preview</h3>
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
