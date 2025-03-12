import React from 'react';
import Header from '../components/Header';
import { cn } from '@/lib/utils';
import Footer from '../components/Footer';

// React Native Section
import AIReactNativeGenerator from '../components/AIReactNativeGenerator';
import ExpoSnackPreview from '../components/ExpoSnackPreview';
import DiagramEditor from '../components/DiagramEditor';

// React Web Section
import CodeEditor from '../components/CodeEditor';
import LivePreview from '../components/LivePreview';
import ComponentLibrary from '../components/ComponentLibrary';
import AIComponentGenerator from '../components/AIComponentGenerator';

// Default code examples
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

const defaultReactWebCode = `function MyComponent() {
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

// Content for section headers
const sections = [
  {
    id: 'diagram',
    title: 'Visual Architecture Designer',
    description: 'Visualize and plan your component architecture with an interactive canvas board. Save your diagrams, add notes, and organize your component relationships - all persisted in local storage for your convenience.',
    bgClass: 'bg-gradient-to-b from-slate-50/20 to-indigo-50/20 dark:from-slate-900/20 dark:to-indigo-950/10'
  },
  {
    id: 'react-native',
    title: 'AI Powered React Native Sandbox',
    description: 'Create, preview, and generate React Native components with AI assistance and Expo Snack integration.',
    bgClass: 'bg-gradient-to-b from-background to-slate-50/20 dark:to-slate-900/20'
  },
  {
    id: 'react-web',
    title: 'React Web Sandbox',
    description: 'Build React web components with real-time preview and AI-powered component generation.',
    bgClass: 'bg-gradient-to-b from-indigo-50/20 to-cyan-50/20 dark:from-indigo-950/10 dark:to-cyan-950/10'
  }
];

const Home: React.FC = () => {
  // React Native states
  const [rnCode, setRnCode] = React.useState(defaultReactNativeCode);
  const [dependencies, setDependencies] = React.useState('expo-constants,react-native-paper@4');
  const [platform, setPlatform] = React.useState<'web' | 'ios' | 'android' | 'mydevice'>('web');
  
  // React Web states
  const [webCode, setWebCode] = React.useState(defaultReactWebCode);
  const [cssFramework, setCssFramework] = React.useState('none');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Diagram Section - Now First */}
        <section 
          id={sections[0].id} 
          className={cn("min-h-screen py-16 px-4 flex flex-col items-center", sections[0].bgClass)}
        >
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-500">
              {sections[0].title}
            </h2>
            <p className="text-xl text-muted-foreground">
              {sections[0].description}
            </p>
          </div>
          
          <div className="w-full max-w-7xl mx-auto">
            <DiagramEditor />
          </div>
        </section>
        
        {/* React Native Section */}
        <section 
          id={sections[1].id} 
          className={cn("min-h-screen py-16 px-4 flex flex-col items-center", sections[1].bgClass)}
        >
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-500">
              {sections[1].title}
            </h2>
            <p className="text-xl text-muted-foreground">
              {sections[1].description}
            </p>
          </div>
          
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ExpoSnackPreview 
                code={rnCode} 
                dependencies={dependencies}
                platform={platform}
              />
            </div>
            <div>
              <AIReactNativeGenerator onGenerate={setRnCode} />
            </div>
          </div>
        </section>
        
        {/* React Web Section */}
        <section 
          id={sections[2].id} 
          className={cn("min-h-screen py-16 px-4 flex flex-col items-center", sections[2].bgClass)}
        >
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">
              {sections[2].title}
            </h2>
            <p className="text-xl text-muted-foreground">
              {sections[2].description}
            </p>
          </div>
          
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col h-full">
              <CodeEditor 
                value={webCode} 
                onChange={setWebCode} 
              />
            </div>
            <div className="flex flex-col h-full">
              <LivePreview 
                code={webCode} 
              />
              <div className="mt-4">
                <AIComponentGenerator onGenerate={setWebCode} />
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
