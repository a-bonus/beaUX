import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Make React available globally for the live preview component
// This enables our code transformation to work with JSX
window.React = React;

createRoot(document.getElementById("root")!).render(<App />);

// Add TypeScript declaration to avoid errors
declare global {
  interface Window {
    React: typeof React;
  }
}
