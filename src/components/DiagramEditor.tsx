import React, { useState, useRef, useEffect } from 'react';
import { 
  X,
  Plus,
  ChevronRight,
  ChevronLeft,
  Trash,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  FileCog,
  FileJson,
  Download,
  Hand,
  Move,
  Code,
  MousePointer,
  PanelLeftClose,
  PanelLeft,
  Maximize,
  Minimize,
  List,
  Image,
  ArrowRight,
  Link,
  Check
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface ComponentNode {
  id: string;
  name: string;
  position: { x: number; y: number };
  color: string;
  type: 'component' | 'page' | 'hook' | 'util' | 'notes';
  code: string;
  notes: string;
  isCodeCollapsed?: boolean;
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
}

const colors = {
  component: '#3b82f6', // blue
  page: '#10b981',      // green
  hook: '#8b5cf6',      // purple
  util: '#f59e0b',      // amber
  notes: '#ec4899'      // pink
};

const DiagramEditor: React.FC = () => {
  // State for nodes and connections
  const [nodes, setNodes] = useState<ComponentNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // State for editor interaction
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<ComponentNode['type']>('component');
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [viewportPosition, setViewportPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);
  
  // State for undo/redo
  const [history, setHistory] = useState<{nodes: ComponentNode[], connections: Connection[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // State for feedback toast
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  // State for save/load modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentDiagramName, setCurrentDiagramName] = useState('My Diagram');
  const [savedDiagrams, setSavedDiagrams] = useState<{id: string, name: string, timestamp: number}[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPastDiagramsOpen, setIsPastDiagramsOpen] = useState(false);
  
  // State for sidebar collapse and resizing
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240); // Fixed width now
  
  // Refs for interaction
  const editorRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDraggingCanvas = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs for each card to measure height
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Helper function to save to history for undo/redo
  const saveToHistory = (nodeState: ComponentNode[], connectionState: Connection[]) => {
    const newState = {
      nodes: [...nodeState],
      connections: [...connectionState]
    };
    
    // If we're not at the end of the history, trim it
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Cap history at 20 entries
    if (newHistory.length > 20) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Helper function for feedback toasts
  const showFeedbackToast = (message: string) => {
    setFeedbackMessage(message);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  };

  // Helper function to get node center for connections
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    // The node width is fixed at 200px and height is dynamic based on expanded state
    const nodeHeight = 80; // Default height
    return {
      x: node.position.x + 100, // Half the node width (200/2)
      y: node.position.y + nodeHeight / 2   // Dynamic vertical center
    };
  };

  // Delete a saved diagram
  const deleteDiagram = (diagramId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Remove from saved list
      const updatedDiagrams = savedDiagrams.filter(diagram => diagram.id !== diagramId);
      localStorage.setItem('beaUX-saved-diagrams', JSON.stringify(updatedDiagrams));
      
      // Remove diagram data
      localStorage.removeItem(`beaUX-diagram-${diagramId}`);
      
      setSavedDiagrams(updatedDiagrams);
      showFeedbackToast('Diagram deleted');
    } catch (err) {
      console.error('Failed to delete diagram:', err);
      showFeedbackToast('Error deleting diagram');
    }
  };

  // Export diagram to JSON
  const exportDiagramToJson = () => {
    const diagramData = {
      nodes,
      connections,
      name: currentDiagramName,
      lastSaved: new Date().toISOString()
    };
    
    try {
      // Create a JSON string
      const jsonString = JSON.stringify(diagramData, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentDiagramName.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showFeedbackToast('Diagram exported to JSON');
    } catch (err) {
      console.error('Failed to export diagram:', err);
      showFeedbackToast('Error exporting diagram');
    }
  };

  // Import diagram from JSON
  const importDiagramFromJson = () => {
    try {
      // Parse the JSON
      const parsedData = JSON.parse(importJsonText);
      
      // Validate basic structure
      if (!Array.isArray(parsedData.nodes) || !Array.isArray(parsedData.connections)) {
        throw new Error('Invalid diagram format: missing nodes or connections arrays');
      }
      
      // Optional: More detailed validation could be added here
      
      // Set the diagram data
      setNodes(parsedData.nodes);
      setConnections(parsedData.connections);
      
      // Set the diagram name if provided
      if (parsedData.name) {
        setCurrentDiagramName(parsedData.name);
      }
      
      // Save to history
      saveToHistory(parsedData.nodes, parsedData.connections);
      
      // Close modal and show feedback
      setIsImportModalOpen(false);
      setImportJsonText('');
      setImportError(null);
      showFeedbackToast('Diagram imported successfully');
    } catch (err) {
      console.error('Failed to import diagram:', err);
      setImportError(`Error importing diagram: ${err instanceof Error ? err.message : 'Invalid JSON format'}`);
    }
  };

  // Handle file upload for JSON import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImportJsonText(event.target.result as string);
        setImportError(null);
      }
    };
    reader.onerror = () => {
      setImportError('Error reading file');
    };
    reader.readAsText(file);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!diagramContainerRef.current) return;
    
    if (!isFullscreen) {
      if (diagramContainerRef.current.requestFullscreen) {
        diagramContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto-focus the title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  // Add custom CSS styles for resize cursor
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .cursor-nwse-resize {
        cursor: nwse-resize !important;
      }
    `;
    // Add it to the document head
    document.head.appendChild(styleEl);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Add helper function for auto-growing textareas
  const autoGrowTextarea = (element: HTMLTextAreaElement) => {
    // Reset height temporarily to get the correct scrollHeight
    element.style.height = 'auto';
    // Set the height to scrollHeight to expand based on content
    element.style.height = `${element.scrollHeight}px`;
  };

  // Sample data with tutorial content
  const initialSampleData: { nodes: ComponentNode[], connections: Connection[] } = {
    nodes: [
      { 
        id: 'welcome', 
        name: 'Welcome to beaUX', 
        position: { x: 350, y: 50 }, 
        color: colors.page,
        type: 'page',
        code: '',
        notes: 'This is an interactive diagram tool for mapping React component relationships. Start by adding components or importing JSON from AI.'
      },
      { 
        id: 'add', 
        name: 'Add Components', 
        position: { x: 150, y: 200 }, 
        color: colors.component,
        type: 'component',
        code: '',
        notes: 'Use the Add Component form to create new nodes. You can choose between components, pages, hooks, and utilities.'
      },
      { 
        id: 'connect', 
        name: 'Create Connections', 
        position: { x: 350, y: 200 }, 
        color: colors.component,
        type: 'component',
        code: '',
        notes: 'Click the arrow icon on a component to create connections between components. Connections represent relationships like "imports" or "uses".'
      },
      { 
        id: 'import', 
        name: 'AI Import', 
        position: { x: 550, y: 200 }, 
        color: colors.util,
        type: 'util',
        code: '',
        notes: 'Click the JSON import button and use the AI prompt template to generate component diagrams automatically from your architecture description.'
      },
      { 
        id: 'edit', 
        name: 'Edit Details', 
        position: { x: 250, y: 350 }, 
        color: colors.hook,
        type: 'hook',
        code: '// Example component code\nfunction EditDetails() {\n  return (\n    <div>\n      <h2>Component Details</h2>\n      <p>This is an example component</p>\n    </div>\n  );\n}',
        notes: 'Expand components to add code snippets and notes. This helps document your architecture.'
      },
      { 
        id: 'save', 
        name: 'Save & Export', 
        position: { x: 450, y: 350 }, 
        color: colors.hook,
        type: 'hook',
        code: '',
        notes: 'Save your diagrams to browser storage or export as JSON to share with others.'
      }
    ],
    connections: [
      { id: 'c1', sourceId: 'welcome', targetId: 'add', label: 'start with' },
      { id: 'c2', sourceId: 'welcome', targetId: 'connect', label: 'then' },
      { id: 'c3', sourceId: 'welcome', targetId: 'import', label: 'or use' },
      { id: 'c4', sourceId: 'add', targetId: 'edit', label: 'enables' },
      { id: 'c5', sourceId: 'connect', targetId: 'save', label: 'leads to' },
      { id: 'c6', sourceId: 'edit', targetId: 'save', label: 'before' }
    ]
  };

  useEffect(() => {
    // Load the saved diagrams list from localStorage
    const savedDiagramsList = localStorage.getItem('beaUX-saved-diagrams');
    if (savedDiagramsList) {
      setSavedDiagrams(JSON.parse(savedDiagramsList));
    }
    
    // Load the last edited diagram if it exists
    const lastDiagram = localStorage.getItem('beaUX-current-diagram');
    if (lastDiagram) {
      try {
        const parsed = JSON.parse(lastDiagram);
        setNodes(parsed.nodes);
        setConnections(parsed.connections);
        setCurrentDiagramName(parsed.name || 'Untitled Diagram');
        saveToHistory(parsed.nodes, parsed.connections);
        showFeedbackToast('Previous diagram loaded');
      } catch (err) {
        console.error('Failed to load saved diagram:', err);
        // Fall back to tutorial diagram on error
        setNodes(initialSampleData.nodes);
        setConnections(initialSampleData.connections);
        setCurrentDiagramName('Tutorial Diagram');
        saveToHistory(initialSampleData.nodes, initialSampleData.connections);
      }
    } else {
      // Use initial tutorial data if no saved diagram
      setNodes(initialSampleData.nodes);
      setConnections(initialSampleData.connections);
      setCurrentDiagramName('Tutorial Diagram');
      saveToHistory(initialSampleData.nodes, initialSampleData.connections);
    }
  }, []);

  // Export diagram as PNG
  const exportDiagramAsPng = () => {
    if (!canvasContainerRef.current) return;
    
    try {
      html2canvas(canvasContainerRef.current, {
        backgroundColor: '#000005',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
      }).then(canvas => {
        // Convert to PNG and trigger download
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${currentDiagramName.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showFeedbackToast('Diagram exported as PNG');
      }).catch(err => {
        console.error('Failed to export PNG:', err);
        showFeedbackToast('Error exporting diagram');
      });
    } catch (err) {
      console.error('Failed to capture canvas:', err);
      showFeedbackToast('Error exporting diagram');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      
      // Update mouse position for connection previews
      const rawX = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const rawY = (e.clientY - rect.top - canvasOffset.y) / zoom;
      
      setMousePosition({ x: rawX, y: rawY });
      
      // Handle canvas dragging
      if (isDraggingCanvas.current && canvasContainerRef.current) {
        const deltaX = e.clientX - lastMousePosition.current.x;
        const deltaY = e.clientY - lastMousePosition.current.y;
        
        setCanvasOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
      }
      
      // Handle node dragging with sticky selection
      if (isDraggingNode && selectedNode && canvasContainerRef.current) {
        e.preventDefault(); // Prevent text selection during drag
        
        const rect = canvasContainerRef.current.getBoundingClientRect();
        
        // Calculate new position based on mouse movement
        const mouseX = e.clientX - rect.left - canvasOffset.x;
        const mouseY = e.clientY - rect.top - canvasOffset.y; 
        
        // Get the node's dimensions
        const selectedNodeObj = nodes.find(n => n.id === selectedNode);
        if (selectedNodeObj) {
          const newX = mouseX / zoom - 100; // Half the node width
          const newY = mouseY / zoom - 40;  // Half the node height
          
          // Update only the currently selected node
          setNodes(prevNodes => 
            prevNodes.map(node => 
              node.id === selectedNode 
                ? { ...node, position: { x: newX, y: newY } } 
                : node
            )
          );
        }
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    // End canvas dragging
    if (isDraggingCanvas.current) {
      isDraggingCanvas.current = false;
      if (canvasContainerRef.current) {
        canvasContainerRef.current.style.cursor = isPanMode ? 'grab' : 'default';
      }
    }
    
    // We don't end node dragging on mouse up with the sticky approach
    // isDragging.current = false is now handled by the node click handler
    
    // Save history when dragging ends
    if (isDraggingNode && selectedNode) {
      saveToHistory(nodes, connections);
    }
    
    // Handle connection completion
    if (connectionStart && isCreatingConnection) {
      // Check if ended on a node
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - canvasOffset.x) / zoom;
        const canvasY = (e.clientY - rect.top - canvasOffset.y) / zoom;
        
        // Find if mouse is over any node
        const targetNode = nodes.find(node => {
          const nodeLeft = node.position.x - 5;
          const nodeRight = node.position.x + 205; // 200px width + 5px padding
          const nodeTop = node.position.y - 5;
          const nodeBottom = node.position.y + 105; // Approximate height + 5px padding
          
          return canvasX >= nodeLeft && canvasX <= nodeRight && 
                canvasY >= nodeTop && canvasY <= nodeBottom;
        });
        
        if (targetNode && targetNode.id !== connectionStart) {
          // Create the connection
          const newConnection: Connection = {
            id: `c${Date.now()}`,
            sourceId: connectionStart,
            targetId: targetNode.id,
            label: "uses"
          };
          
          const newConnections = [...connections, newConnection];
          setConnections(newConnections);
          saveToHistory(nodes, newConnections);
          
          // Provide visual feedback
          const sourceNode = nodes.find(n => n.id === connectionStart);
          if (sourceNode) {
            showFeedbackToast(`Connected ${sourceNode.name} to ${targetNode.name}`);
          }
        }
        
        // Reset connection creation state
        setIsCreatingConnection(false);
        setConnectionStart(null);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // If we are in connection creation mode, cancel it
    if (isCreatingConnection) {
      setIsCreatingConnection(false);
      setConnectionStart(null);
    }
    
    // Clear selection
    setSelectedNode(null); 
    setSelectedConnection(null);
  };

  // Effect to measure card heights
  useEffect(() => {
    // Function to measure all card heights
    const measureCardHeights = () => {
      const newHeights: Record<string, number> = {};
      nodes.forEach(node => {
        const element = cardRefs.current[node.id];
        if (element) {
          newHeights[node.id] = element.getBoundingClientRect().height;
        }
      });
      setCardHeights(newHeights);
    };

    // Set up resize observer to measure when DOM changes
    const resizeObserver = new ResizeObserver(() => {
      measureCardHeights();
    });
    
    // Observe all card elements
    Object.values(cardRefs.current).forEach(element => {
      if (element) {
        resizeObserver.observe(element);
      }
    });
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [nodes, expandedNodes]);

  // Effect to adjust positions when a node is expanded
  useEffect(() => {
    // When a node is expanded/collapsed, adjust the positions of nodes below it
    const adjustPositions = () => {
      // Sort nodes by vertical position (top to bottom)
      const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);
      const updatedNodes = [...nodes];
      let hasChanges = false;
      
      // For each node (in top-to-bottom order)
      for (let i = 0; i < sortedNodes.length; i++) {
        const current = sortedNodes[i];
        const height = cardHeights[current.id] || 100;
        
        // Check all nodes below this one
        for (let j = i + 1; j < sortedNodes.length; j++) {
          const nodeBelow = sortedNodes[j];
          
          // Check if they overlap horizontally (same column)
          const horizontalOverlap = 
            (current.position.x + 200 >= nodeBelow.position.x && 
             current.position.x <= nodeBelow.position.x + 200);
          
          // If they're in the same column and the below node is too close
          if (horizontalOverlap && 
              nodeBelow.position.y < current.position.y + height + 20) { // 20px gap
            
            // Find the nodeBelow in our updatedNodes array
            const nodeBelowIndex = updatedNodes.findIndex(n => n.id === nodeBelow.id);
            if (nodeBelowIndex >= 0) {
              // Update its position
              updatedNodes[nodeBelowIndex] = {
                ...nodeBelow,
                position: {
                  ...nodeBelow.position, 
                  y: current.position.y + height + 20 // Move it below with 20px gap
                }
              };
              
              // Update the sorted nodes array too to reflect new position
              sortedNodes[j] = updatedNodes[nodeBelowIndex];
              hasChanges = true;
            }
          }
        }
      }
      
      // Only update if we made changes
      if (hasChanges) {
        setNodes(updatedNodes);
      }
    };
    
    // Give the DOM time to update before measuring
    const timer = setTimeout(() => {
      adjustPositions();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [expandedNodes, cardHeights]);

  // Add color picker functionality when a node is selected
  const handleNodeColorChange = (nodeId: string, newColor: string) => {
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, color: newColor };
      }
      return node;
    });
    
    setNodes(updatedNodes);
    saveToHistory(updatedNodes, connections);
  };

  // Predefined color options
  const colorOptions = [
    '#3b82f6', // blue
    '#10b981', // green
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ec4899', // pink
    '#ef4444', // red
    '#06b6d4', // cyan
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16', // lime
  ];

  return (
    <div 
      ref={diagramContainerRef}
      className={`flex flex-col ${isFullscreen ? 'h-screen' : 'h-full'} bg-muted`}
    >
      {/* Top Bar */}
      <div className="bg-card border-b border-border p-2 flex items-center justify-between">
        <div className="flex items-center">
          {isEditingTitle ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setIsEditingTitle(false);
              }}
              className="mr-3"
            >
              <input
                ref={titleInputRef}
                type="text"
                value={currentDiagramName}
                onChange={(e) => setCurrentDiagramName(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                className="text-lg font-semibold bg-muted/30 border border-border rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </form>
          ) : (
            <h2 
              className="text-lg font-semibold mr-3 cursor-pointer hover:text-primary"
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit diagram title"
            >
              {currentDiagramName}
            </h2>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="mr-2 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Past Diagrams Button */}
          <div className="relative">
            <button 
              onClick={() => setIsPastDiagramsOpen(!isPastDiagramsOpen)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="View Past Diagrams"
            >
              <List className="h-4 w-4" />
            </button>
            
            {/* Past Diagrams Dropdown */}
            {isPastDiagramsOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-border">
                <div className="py-2 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border">
                    Your Saved Diagrams
                  </div>
                  
                  {savedDiagrams.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      No saved diagrams yet
                    </div>
                  ) : (
                    <>
                      {savedDiagrams.map(diagram => (
                        <div
                          key={diagram.id}
                          className="flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            // Load the diagram
                            const savedDiagram = localStorage.getItem(`beaUX-diagram-${diagram.id}`);
                            if (savedDiagram) {
                              try {
                                const parsed = JSON.parse(savedDiagram);
                                setNodes(parsed.nodes);
                                setConnections(parsed.connections);
                                setCurrentDiagramName(parsed.name || 'Untitled Diagram');
                                saveToHistory(parsed.nodes, parsed.connections);
                                showFeedbackToast('Diagram loaded');
                                setIsPastDiagramsOpen(false);
                              } catch (err) {
                                console.error('Failed to load saved diagram:', err);
                                showFeedbackToast('Error loading diagram');
                              }
                            }
                          }}
                        >
                          <div className="flex-1 truncate">
                            <span className="font-medium">{diagram.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {new Date(diagram.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={(e) => deleteDiagram(diagram.id, e)}
                            className="p-1 rounded-md hover:bg-red-100 text-red-600"
                            title="Delete diagram"
                          >
                            <Trash className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Undo/Redo */}
          <button 
            onClick={() => {
              if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                const prevState = history[newIndex];
                setNodes(prevState.nodes);
                setConnections(prevState.connections);
                setHistoryIndex(newIndex);
              }
            }} 
            disabled={historyIndex <= 0}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => {
              if (historyIndex < history.length - 1) {
                const newIndex = historyIndex + 1;
                const nextState = history[newIndex];
                setNodes(nextState.nodes);
                setConnections(nextState.connections);
                setHistoryIndex(newIndex);
              }
            }}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          
          <div className="h-4 mx-1 border-r border-border" />
          
          {/* Pan Mode Toggle */}
          <button 
            onClick={() => setIsPanMode(!isPanMode)}
            className={`p-1.5 rounded ${isPanMode ? 'bg-muted text-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
            title="Toggle Pan Mode"
          >
            {isPanMode ? <Hand className="h-4 w-4" /> : <MousePointer className="h-4 w-4" />}
          </button>
          
          {/* Zoom Controls */}
          <button 
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          
          <div className="h-4 mx-1 border-r border-border" />
          
          {/* Save/Load */}
          <button 
            onClick={() => setIsSaveModalOpen(true)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Save Diagram"
          >
            <Save className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setIsLoadModalOpen(true)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Load Diagram"
          >
            <FileCog className="h-4 w-4" />
          </button>
          
          {/* Import/Export */}
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Import JSON"
          >
            <FileJson className="h-4 w-4" />
          </button>
          <button 
            onClick={exportDiagramToJson}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Export to JSON"
          >
            <Download className="h-4 w-4" />
          </button>
          <button 
            onClick={exportDiagramAsPng}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Export as PNG"
          >
            <Image className="h-4 w-4" />
          </button>
          
          {/* Fullscreen Toggle */}
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {/* Canvas and Sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div 
          className={`border-r border-border overflow-y-auto bg-white transition-all duration-200 ${
            isSidebarCollapsed ? 'w-0 px-0 overflow-hidden' : 'overflow-y-auto p-2'
          }`}
          style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
        >
          {/* Component form */}
          <form className="flex items-center mb-3" onSubmit={(e) => {
            e.preventDefault();
            if (!newNodeName.trim()) return;
            
            // Calculate viewport center based on canvas offset, zoom, and container dimensions
            const containerRect = canvasContainerRef.current?.getBoundingClientRect();
            const viewportCenterX = containerRect ? 
              (-canvasOffset.x + containerRect.width / 2) / zoom : 200;
            const viewportCenterY = containerRect ? 
              (-canvasOffset.y + containerRect.height / 2) / zoom : 200;
            
            const newNode: ComponentNode = {
              id: `n${Date.now()}`,
              name: newNodeName,
              position: { x: viewportCenterX - 100, y: viewportCenterY - 40 }, // Center in viewport
              color: colors[newNodeType],
              type: newNodeType,
              code: '',
              notes: '',
              isCodeCollapsed: true
            };
            
            const updatedNodes = [...nodes, newNode];
            setNodes(updatedNodes);
            setNewNodeName('');
            saveToHistory(updatedNodes, connections);
          }}>
            <input
              type="text"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              placeholder="New component"
              className="text-xs border border-border rounded-l-md px-2 py-1.5 w-32"
            />
            <select
              value={newNodeType}
              onChange={(e) => setNewNodeType(e.target.value as ComponentNode['type'])}
              className="text-xs border-y border-r border-border rounded-r-md px-1 py-1.5 bg-white"
            >
              <option value="component">Component</option>
              <option value="page">Page</option>
              <option value="hook">Hook</option>
              <option value="util">Utility</option>
              <option value="notes">Notes</option>
            </select>
            <button 
              type="submit"
              className="ml-1 bg-primary text-white rounded-md p-1 hover:bg-primary/90"
              title="Add component"
            >
              <Plus className="h-3 w-3" />
            </button>
          </form>
          
          <div className="space-y-1">
            {nodes.map(node => (
              <div
                key={node.id}
                className={`flex items-center justify-between p-2 rounded-md text-xs ${
                  selectedNode === node.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-100'
                }`}
                onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
              >
                <div className="flex items-center gap-1">
                  <span 
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: node.color || '#2dd4bf' }}
                  ></span>
                  <span>{node.name}</span>
                </div>
                <div className="flex">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Filter nodes and connections that don't involve this node
                      const newNodes = nodes.filter(n => n.id !== node.id);
                      const newConnections = connections.filter(
                        c => c.sourceId !== node.id && c.targetId !== node.id
                      );
                      
                      setNodes(newNodes);
                      setConnections(newConnections);
                      setSelectedNode(null);
                      saveToHistory(newNodes, newConnections);
                    }}
                    className="p-1 rounded-md hover:bg-red-100 text-red-600"
                    title="Delete component"
                  >
                    <Trash className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Node Settings Panel - shows when a node is selected */}
          {selectedNode && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="text-xs font-medium mb-2">Node Settings</h3>
              
              {/* Color picker */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">Color</label>
                <div className="flex flex-wrap gap-1">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`w-5 h-5 rounded-full transition-all ${
                        nodes.find(n => n.id === selectedNode)?.color === color ? 
                        'ring-2 ring-offset-1 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleNodeColorChange(selectedNode, color)}
                      title={`Change to ${color}`}
                    />
                  ))}
                  
                  {/* Custom color input */}
                  <input
                    type="color"
                    className="w-5 h-5 rounded-full cursor-pointer"
                    value={nodes.find(n => n.id === selectedNode)?.color || '#000000'}
                    onChange={(e) => handleNodeColorChange(selectedNode, e.target.value)}
                    title="Custom color"
                  />
                </div>
              </div>
              
              {/* Node type */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">Type</label>
                <select
                  className="w-full text-xs border border-gray-300 rounded px-1 py-1"
                  value={nodes.find(n => n.id === selectedNode)?.type || 'component'}
                  onChange={(e) => {
                    const type = e.target.value as ComponentNode['type'];
                    const updatedNodes = nodes.map(node => {
                      if (node.id === selectedNode) {
                        // Update type but keep custom color if already set
                        return { ...node, type };
                      }
                      return node;
                    });
                    setNodes(updatedNodes);
                    saveToHistory(updatedNodes, connections);
                  }}
                >
                  <option value="component">Component</option>
                  <option value="page">Page</option>
                  <option value="hook">Hook</option>
                  <option value="util">Utility</option>
                  <option value="notes">Notes</option>
                </select>
              </div>
              
              {/* Delete button */}
              <button
                onClick={() => {
                  // Filter nodes and connections that don't involve this node
                  const newNodes = nodes.filter(n => n.id !== selectedNode);
                  const newConnections = connections.filter(
                    c => c.sourceId !== selectedNode && c.targetId !== selectedNode
                  );
                  
                  setNodes(newNodes);
                  setConnections(newConnections);
                  setSelectedNode(null);
                  saveToHistory(newNodes, newConnections);
                }}
                className="w-full text-xs text-white bg-red-500 hover:bg-red-600 rounded px-2 py-1 flex items-center justify-center gap-1"
              >
                <Trash className="h-3 w-3" />
                Delete Node
              </button>
            </div>
          )}
        </div>
        
        {/* Canvas */}
        <div 
          ref={canvasContainerRef}
          className={`relative flex-1 ${isFullscreen ? 'h-[calc(100vh-44px)]' : 'h-[500px]'} overflow-hidden ${
            isPanMode 
              ? 'cursor-grab' 
              : isDraggingCanvas.current 
                ? 'cursor-grabbing' 
                : isDraggingNode ? 'cursor-move' : 'cursor-default'
          }`}
          style={{ 
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundImage: `
              radial-gradient(circle at 30% 20%, rgba(20, 0, 40, 0.2) 0%, transparent 20%),
              radial-gradient(circle at 70% 60%, rgba(10, 10, 50, 0.15) 0%, transparent 30%),
              radial-gradient(circle at 10% 80%, rgba(30, 5, 50, 0.1) 0%, transparent 30%),
              radial-gradient(circle at 80% 15%, rgba(15, 0, 30, 0.15) 0%, transparent 40%)
            `,
            backgroundColor: '#000005',
            boxShadow: 'inset 0 0 80px rgba(30, 0, 60, 0.1)'
          }}
          onMouseDown={(e) => {
            // When in pan mode or clicking directly on the canvas background
            if (isPanMode || e.target === e.currentTarget) {
              isDraggingCanvas.current = true;
              lastMousePosition.current = { x: e.clientX, y: e.clientY };
              
              // Change cursor style to indicate grabbing
              if (canvasContainerRef.current) {
                canvasContainerRef.current.style.cursor = 'grabbing';
              }
            }
            
            // Clear selection when clicking on empty canvas area
            if (e.target === e.currentTarget) {
              // If we are in dragging mode, end it and save history
              if (isDraggingNode) {
                setIsDraggingNode(false);
                saveToHistory(nodes, connections);
              }
              setSelectedNode(null);
              setSelectedConnection(null);
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onClick={handleCanvasClick} // Add click handler here
        >
          {/* Connection creation indicator */}
          {isCreatingConnection && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-md shadow-md z-50 text-xs">
            Click on another component to connect
            <button 
              onClick={() => {
                setConnectionStart(null);
                setIsCreatingConnection(false);
              }}
              className="ml-2 bg-blue-600 hover:bg-blue-700 rounded px-2 py-0.5"
            >
              Cancel
            </button>
          </div>
          )}
          
          {/* Feedback toast */}
          {showFeedback && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-md z-50 text-xs">
              {feedbackMessage}
            </div>
          )}

          {/* Main canvas content */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: '0 0',
              left: `${canvasOffset.x}px`,
              top: `${canvasOffset.y}px`
            }}
          >
            {/* Stars */}
            <div className="stars-small"></div>
            <div className="stars-medium"></div>
            <div className="stars-large"></div>
            
            {/* Connections Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ overflow: 'visible' }}>
              {/* Live connection preview */}
              {isCreatingConnection && connectionStart && (
                <path
                  d={`M ${getNodeCenter(connectionStart).x} ${getNodeCenter(connectionStart).y} L ${mousePosition.x} ${mousePosition.y}`}
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  fill="none"
                />
              )}
              
              {/* Existing connections */}
              {connections.map(connection => {
                // Calculate path between two nodes
                const sourceNode = nodes.find(n => n.id === connection.sourceId);
                const targetNode = nodes.find(n => n.id === connection.targetId);
                
                if (!sourceNode || !targetNode) return null;
                
                // Get centers of nodes
                const sourceCenter = { 
                  x: sourceNode.position.x + 100, 
                  y: sourceNode.position.y + 40 
                };
                const targetCenter = { 
                  x: targetNode.position.x + 100, 
                  y: targetNode.position.y + 40 
                };
                
                // Calculate the path
                const dx = targetCenter.x - sourceCenter.x;
                const dy = targetCenter.y - sourceCenter.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate control points for a curved path (for quadratic bezier)
                const controlPointOffset = Math.min(80, length / 3);
                
                // Calculate the angle to offset the control point perpendicular to the line
                const angle = Math.atan2(dy, dx) + Math.PI / 2;
                const offsetX = controlPointOffset * Math.cos(angle);
                const offsetY = controlPointOffset * Math.sin(angle);
                
                // Calculate the midpoint with offset for the control point
                const midX = (sourceCenter.x + targetCenter.x) / 2 + offsetX;
                const midY = (sourceCenter.y + targetCenter.y) / 2 + offsetY;
                
                // Calculate the path and angle for arrow
                const path = `M ${sourceCenter.x} ${sourceCenter.y} Q ${midX} ${midY} ${targetCenter.x} ${targetCenter.y}`;
                const arrowAngle = Math.atan2(targetCenter.y - midY, targetCenter.x - midX) * 180 / Math.PI;
                
                return (
                  <g key={connection.id} className="pointer-events-auto">
                    <path
                      d={path}
                      fill="none"
                      stroke={selectedConnection === connection.id ? '#2dd4bf' : '#94a3b8'}
                      strokeWidth={selectedConnection === connection.id ? 3 : 2}
                      className={`${selectedConnection === connection.id ? 'glow-connection-teal' : ''}`}
                      onClick={() => setSelectedConnection(connection.id)}
                    />
                    
                    {/* Custom SVG connection icon at target end */}
                    <g 
                      transform={`translate(${targetCenter.x},${targetCenter.y}) rotate(${arrowAngle})`}
                      onClick={() => setSelectedConnection(connection.id)}
                    >
                      {/* Move origin back to create the icon in front of the line end */}
                      <g transform="translate(-15, -5)">
                        {/* Container rect for better click target */}
                        <rect 
                          x="0" 
                          y="0" 
                          width="30" 
                          height="10" 
                          fill="none" 
                          stroke="none"
                        />
                        
                        {/* Connection path */}
                        <path 
                          d="M5,5 C8,2 12,8 15,5 C18,2 22,8 25,5" 
                          stroke={selectedConnection === connection.id ? '#5eead4' : '#94a3b8'} 
                          fill="none"
                          strokeWidth="1.5"
                        />
                        
                        {/* End point */}
                        <circle 
                          cx="25" 
                          cy="5" 
                          r="2" 
                          fill={selectedConnection === connection.id ? '#5eead480' : '#f59e0b80'}
                          stroke={selectedConnection === connection.id ? '#5eead4' : '#94a3b8'} 
                          strokeWidth="1"
                        />
                        
                        {/* Start point */}
                        <circle 
                          cx="5" 
                          cy="5" 
                          r="2" 
                          fill={selectedConnection === connection.id ? '#5eead480' : '#3b82f680'}
                          stroke={selectedConnection === connection.id ? '#5eead4' : '#94a3b8'} 
                          strokeWidth="1"
                        />
                      </g>
                    </g>
                    
                    {/* Connection label */}
                    <text
                      x={midX}
                      y={midY - 10}
                      fill={selectedConnection === connection.id ? '#5eead4' : '#e2e8f0'}
                      fontSize="10"
                      textAnchor="middle"
                      className="pointer-events-none select-none space-text"
                    >
                      {connection.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Component Nodes Layer */}
            {nodes.map(node => (
              <div 
                key={node.id}
                ref={el => cardRefs.current[node.id] = el}
                className={`absolute pointer-events-auto cursor-pointer rounded-md border galaxy-node ${
                  selectedNode === node.id ? 'border-2 border-teal-400' : 
                  isDraggingNode && selectedNode === node.id ? 'border-2 border-indigo-400' : 
                  'border border-gray-700/50'
                } bg-black/60 backdrop-blur-sm p-3 w-[200px] transition-all duration-300 ease-in-out`}
                style={{
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  
                  // If we're in connection creation mode
                  if (isCreatingConnection && connectionStart) {
                    // Don't connect to self
                    if (node.id !== connectionStart) {
                      // Create the connection
                      const newConnection: Connection = {
                        id: `c${Date.now()}`,
                        sourceId: connectionStart,
                        targetId: node.id,
                        label: "uses"
                      };
                      
                      const newConnections = [...connections, newConnection];
                      setConnections(newConnections);
                      saveToHistory(nodes, newConnections);
                      
                      // Provide visual feedback
                      const sourceNode = nodes.find(n => n.id === connectionStart);
                      if (sourceNode) {
                        showFeedbackToast(`Connected ${sourceNode.name} to ${node.name}`);
                      }
                    }
                    
                    // Reset connection creation state
                    setIsCreatingConnection(false);
                    setConnectionStart(null);
                  } else {
                    // Toggle dragging mode with sticky selection
                    if (selectedNode === node.id && isDraggingNode) {
                      // If already in dragging mode for this node, end it and save history
                      setIsDraggingNode(false);
                      saveToHistory(nodes, connections);
                    } else {
                      // Either selecting a new node or enabling drag mode for selected node
                      setSelectedNode(node.id);
                      setSelectedConnection(null);
                      setIsDraggingNode(true);
                    }
                  }
                }}
                onMouseDown={(e) => {
                  e.stopPropagation(); // Prevent canvas drag when clicking on node
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span 
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: node.color || '#2dd4bf' }}
                    ></span>
                    {expandedNodes.has(node.id) ? (
                      <input
                        type="text"
                        className="font-medium text-sm text-gray-100 bg-transparent border-b border-gray-700 focus:border-teal-500 outline-none w-full"
                        value={node.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const updatedNodes = nodes.map(n => {
                            if (n.id === node.id) {
                              return { ...n, name: e.target.value };
                            }
                            return n;
                          });
                          
                          setNodes(updatedNodes);
                        }}
                        onBlur={() => saveToHistory(nodes, connections)}
                      />
                    ) : (
                      <h4 className="font-medium text-sm text-gray-100">{node.name}</h4>
                    )}
                  </div>
                  <div className="flex">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Create connection from this node
                        setSelectedNode(node.id);
                        setConnectionStart(node.id);
                        setIsCreatingConnection(true);
                        
                        // Show visual feedback
                        showFeedbackToast(`Select another component to connect from ${node.name}`);
                      }}
                      className="p-1 rounded-md hover:bg-indigo-800/50 text-gray-300 mr-1"
                      title="Create connection"
                    >
                      <Link className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Update expanded nodes set instead of single state
                        const newExpandedNodes = new Set(expandedNodes);
                        if (newExpandedNodes.has(node.id)) {
                          newExpandedNodes.delete(node.id);
                        } else {
                          newExpandedNodes.add(node.id);
                        }
                        setExpandedNodes(newExpandedNodes);
                      }}
                      className="p-1 rounded-md hover:bg-indigo-800/50 text-gray-300"
                      title={expandedNodes.has(node.id) ? "Collapse" : "Expand"}
                    >
                      <ChevronRight className={`h-3.5 w-3.5 transform transition-transform ${
                        expandedNodes.has(node.id) ? 'rotate-90' : ''
                      }`} />
                    </button>
                  </div>
                </div>
                
                {/* Component expanded details (notes & code) */}
                {expandedNodes.has(node.id) && (
                  <div className="mt-2 border-t border-gray-800/50 pt-2 relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-medium text-gray-300">Notes:</label>
                    </div>
                    <textarea
                      className="w-full text-xs bg-black/70 p-2 rounded-sm border border-gray-800/50 resize-none text-gray-200"
                      style={{ minHeight: '80px' }}
                      value={node.notes || ''}
                      onChange={(e) => {
                        // Auto-grow the textarea
                        autoGrowTextarea(e.target);
                        
                        const updatedNodes = nodes.map(n => {
                          if (n.id === node.id) {
                            return { ...n, notes: e.target.value };
                          }
                          return n;
                        });
                        
                        setNodes(updatedNodes);
                      }}
                      onFocus={(e) => autoGrowTextarea(e.target)}
                      onBlur={(e) => {
                        autoGrowTextarea(e.target);
                        saveToHistory(nodes, connections);
                      }}
                      placeholder="Add notes about this component..."
                      onClick={(e) => e.stopPropagation()}
                    ></textarea>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-medium text-gray-300">Component Code:</label>
                        <button
                          className="text-[10px] text-gray-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-gray-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedNodes = nodes.map(n => {
                              if (n.id === node.id) {
                                return { 
                                  ...n, 
                                  isCodeCollapsed: !n.isCodeCollapsed,
                                };
                              }
                              return n;
                            });
                            setNodes(updatedNodes);
                            saveToHistory(updatedNodes, connections);
                          }}
                        >
                          {node.isCodeCollapsed ? 'Show' : 'Hide'}
                        </button>
                      </div>
                      
                      {!node.isCodeCollapsed && (
                        <textarea
                          className="w-full text-[10px] bg-black/70 p-2 rounded-sm font-mono border border-gray-800/50 resize-none text-gray-200"
                          style={{ minHeight: '100px' }}
                          value={node.code || ''}
                          onChange={(e) => {
                            // Auto-grow the textarea
                            autoGrowTextarea(e.target);
                            
                            const updatedNodes = nodes.map(n => {
                              if (n.id === node.id) {
                                return { ...n, code: e.target.value };
                              }
                              return n;
                            });
                            
                            setNodes(updatedNodes);
                          }}
                          onFocus={(e) => autoGrowTextarea(e.target)}
                          onBlur={(e) => {
                            autoGrowTextarea(e.target);
                            saveToHistory(nodes, connections);
                          }}
                          placeholder="// Enter component code here..."
                          onClick={(e) => e.stopPropagation()}
                        ></textarea>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Import JSON Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Import Diagram from JSON</h3>
              <button onClick={() => {
                setIsImportModalOpen(false);
                setImportJsonText('');
                setImportError(null);
              }} className="hover:bg-muted rounded p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
              <p className="text-sm text-muted-foreground mb-4">
                Paste your diagram JSON below or upload a JSON file. 
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    // Copy the AI prompt to clipboard
                    navigator.clipboard.writeText(aiPromptTemplate)
                      .then(() => showFeedbackToast('AI prompt copied to clipboard'))
                      .catch(err => console.error('Failed to copy: ', err));
                  }}
                  className="ml-1 text-blue-600 hover:underline"
                >
                  Copy AI prompt template
                </a>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Upload JSON File</label>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80"
                />
              </div>
              
              <label className="block text-sm font-medium mb-2">JSON Content</label>
              <textarea
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  setImportError(null);
                }}
                placeholder="Paste your diagram JSON here..."
                className="w-full h-64 border rounded p-2 font-mono text-sm resize-none"
              />
              
              {importError && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {importError}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end gap-2">
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportJsonText('');
                  setImportError(null);
                }}
                className="px-3 py-2 rounded text-sm bg-muted/50 hover:bg-muted text-foreground"
              >
                Cancel
              </button>
              <button 
                onClick={importDiagramFromJson}
                disabled={!importJsonText.trim()}
                className="px-3 py-2 rounded text-sm bg-primary/90 hover:bg-primary text-primary-foreground disabled:opacity-50 disabled:pointer-events-none"
              >
                Import Diagram
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-96 bg-card rounded-lg shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-lg font-medium">Save Diagram</h3>
              <button 
                onClick={() => {
                  setIsSaveModalOpen(false);
                  setSaveSuccess(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form 
              className="p-4" 
              onSubmit={(e) => {
                e.preventDefault();
                
                try {
                  // Create a unique ID if this is a new save
                  const diagramId = `d${Date.now()}`;
                  
                  // Prepare the data
                  const diagramData = {
                    nodes,
                    connections,
                    name: currentDiagramName,
                    lastSaved: new Date().toISOString()
                  };
                  
                  // Save the diagram data
                  localStorage.setItem(`beaUX-diagram-${diagramId}`, JSON.stringify(diagramData));
                  
                  // Save current diagram as last edited
                  localStorage.setItem('beaUX-current-diagram', JSON.stringify(diagramData));
                  
                  // Add to diagrams list
                  const updatedDiagrams = [
                    ...savedDiagrams.filter(diagram => diagram.name !== currentDiagramName), // Remove old version if it exists
                    { id: diagramId, name: currentDiagramName, timestamp: Date.now() }
                  ];
                  
                  localStorage.setItem('beaUX-saved-diagrams', JSON.stringify(updatedDiagrams));
                  setSavedDiagrams(updatedDiagrams);
                  
                  // Show success
                  setSaveSuccess(true);
                  setTimeout(() => {
                    setIsSaveModalOpen(false);
                    setSaveSuccess(false);
                  }, 1500);
                } catch (err) {
                  console.error('Failed to save diagram:', err);
                  showFeedbackToast('Error saving diagram');
                  setIsSaveModalOpen(false);
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Diagram Name</label>
                <input
                  type="text"
                  value={currentDiagramName}
                  onChange={(e) => setCurrentDiagramName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="My Diagram"
                  required
                />
              </div>
              
              {saveSuccess ? (
                <div className="flex items-center justify-center py-2 text-green-600">
                  <div className="bg-green-50 text-green-600 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Diagram saved successfully!</span>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsSaveModalOpen(false)}
                    className="px-4 py-2 mr-2 border border-border rounded-md text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Save Diagram
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// AI prompt template for generating diagram JSON
const aiPromptTemplate = `# beaUX Diagram Generation Prompt

I need you to analyze my React component architecture and generate a JSON representation for the beaUX diagram tool. The output should follow this exact format:

\`\`\`json
{
  "nodes": [
    {
      "id": "string",
      "name": "ComponentName", 
      "position": { "x": number, "y": number },
      "color": "color-hex-code",
      "type": "component|page|hook|util",
      "code": "component-code-snippet",
      "notes": "description-or-notes"
    }
  ],
  "connections": [
    {
      "id": "string",
      "sourceId": "node-id-that-imports",
      "targetId": "node-id-being-imported",
      "label": "relationship-description"
    }
  ],
  "name": "Diagram Name"
}
\`\`\`

## Instructions

1. Analyze the component hierarchy I provide
2. Create nodes for each component, page, hook, or utility
3. Establish connections based on import/usage relationships
4. Position nodes logically (x, y coordinates between 50-800)
5. Assign appropriate colors:
   - Components: #3b82f6 (blue)
   - Pages: #10b981 (green)
   - Hooks: #8b5cf6 (purple)
   - Utils: #f59e0b (amber)
   - Notes: #ec4899 (pink)
6. Include brief code snippets and notes

## My Component Architecture

[Describe your component architecture here, starting with the root component and the key relationships]

Provide ONLY the JSON output in the exact format specified, with no additional explanations.`;

export default DiagramEditor;
