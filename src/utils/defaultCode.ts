// Default code for React Native components
export const defaultReactNativeCode = `import React from 'react';
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

// Default code for React Web components
export const defaultReactWebCode = `function MyComponent() {
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
