import React, { useState } from 'react';
import Header from '../components/Header';
import { cn } from '@/lib/utils';
import Footer from '../components/Footer';
import DiagramEditor from '../components/DiagramEditor';
import MermaidImportModal from '../components/MermaidImportModal';
import useMermaidToBeaUX, { convertLayoutToBeaUXState } from '../hooks/useMermaidToBeaUX';

// Content for The Visual Architect section
const section = {
  id: 'visual-architect',
  title: 'The Visual Architect',
  description: 'Design, visualize, and plan your component architecture with an interactive canvas board. Create beautiful diagrams, add code snippets, notes, and organize your component relationships - all persisted for your convenience.',
  bgClass: 'bg-gradient-to-b from-slate-50/20 to-indigo-50/20 dark:from-slate-900/20 dark:to-indigo-950/10'
};

const Home: React.FC = () => {
  const [isMermaidImportModalOpen, setIsMermaidImportModalOpen] = useState(false);
  const { processMermaid } = useMermaidToBeaUX();
  const diagramEditorRef = React.useRef<{ importDiagram: (nodes: any[], connections: any[]) => void } | null>(null);

  // Handle Mermaid import
  const handleMermaidImport = async (mermaidCode: string): Promise<{ error: string | null }> => {
    try {
      const layoutResult = await processMermaid(mermaidCode);
      
      if (layoutResult.error) {
        return { error: layoutResult.error };
      } else if (layoutResult.nodes.length === 0) {
        return { error: "No nodes found in the Mermaid diagram." };
      }
      
      // Convert to beaUX format
      const { nodes: beaUXNodes, connections: beaUXConnections } = 
        convertLayoutToBeaUXState(layoutResult);
      
      // Import the diagram via the ref
      if (diagramEditorRef.current) {
        diagramEditorRef.current.importDiagram(beaUXNodes, beaUXConnections);
      } else {
        console.error('DiagramEditor reference not available');
        return { error: "Could not access diagram editor. Please try again." };
      }
      
      return { error: null };
    } catch (err: any) {
      console.error('Failed to import Mermaid diagram:', err);
      return { 
        error: `Error importing Mermaid diagram: ${err instanceof Error ? err.message : 'Unknown error'}` 
      };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onOpenMermaidImport={() => setIsMermaidImportModalOpen(true)} />
      
      <main className="flex-1">
        {/* The Visual Architect Section */}
        <section 
          id={section.id} 
          className={cn("min-h-screen py-8 px-2 flex flex-col items-center", section.bgClass)}
        >
          {/* More compact header */}
          <div className="text-center max-w-3xl mx-auto mb-4">
            <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-500">
              {section.title}
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {section.description}
            </p>
          </div>
          
          {/* New feature highlight */}
          <div className="w-full max-w-xl mx-auto mb-6 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-3">
            <div className="shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-600 h-8 w-8 rounded-full">
              <span className="text-sm font-bold">✨</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-indigo-800">New: Import Mermaid Diagrams</h3>
              <p className="text-xs text-indigo-600">
                Easily convert your existing Mermaid diagrams into interactive beaUX diagrams.
              </p>
            </div>
            <button 
              onClick={() => setIsMermaidImportModalOpen(true)}
              className="shrink-0 px-3 py-1 text-xs font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 transition-colors"
            >
              Try Now
            </button>
          </div>
          
          {/* Expanded diagram area */}
          <div className="w-full max-w-full mx-auto px-2 flex-1">
            <DiagramEditor ref={diagramEditorRef} />
          </div>
        </section>
      </main>
      
      <Footer />
      
      {/* Mermaid Import Modal */}
      <MermaidImportModal
        isOpen={isMermaidImportModalOpen}
        onClose={() => setIsMermaidImportModalOpen(false)}
        onImport={handleMermaidImport}
      />
    </div>
  );
};

export default Home;
