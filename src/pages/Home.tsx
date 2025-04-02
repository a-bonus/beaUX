import React from 'react';
import Header from '../components/Header';
import { cn } from '@/lib/utils';
import Footer from '../components/Footer';
import DiagramEditor from '../components/DiagramEditor';

// Content for The Visual Architect section
const section = {
  id: 'visual-architect',
  title: 'The Visual Architect',
  description: 'Design, visualize, and plan your component architecture with an interactive canvas board. Create beautiful diagrams, add code snippets, notes, and organize your component relationships - all persisted for your convenience.',
  bgClass: 'bg-gradient-to-b from-slate-50/20 to-indigo-50/20 dark:from-slate-900/20 dark:to-indigo-950/10'
};

const Home: React.FC = () => {

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* The Visual Architect Section */}
        <section 
          id={section.id} 
          className={cn("min-h-screen py-8 px-2 flex flex-col items-center", section.bgClass)}
        >
          {/* More compact header */}
          <div className="text-center max-w-3xl mx-auto mb-6">
            <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-500">
              {section.title}
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {section.description}
            </p>
          </div>
          
          {/* Expanded diagram area */}
          <div className="w-full max-w-full mx-auto px-2 flex-1">
            <DiagramEditor />
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
