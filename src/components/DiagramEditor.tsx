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
  Move, // Add Move icon import
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
  Check,
  ArrowDown,
  FileInput
} from 'lucide-react';
import html2canvas from 'html2canvas';
import MermaidImportModal from './MermaidImportModal';
import useMermaidToBeaUX, { convertLayoutToBeaUXState } from '../hooks/useMermaidToBeaUX';

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

interface DiagramEditorProps {
  ref?: React.ForwardedRef<{
    importDiagram: (nodes: ComponentNode[], connections: Connection[]) => void;
  }>;
}

const DiagramEditor: React.ForwardRefExoticComponent<DiagramEditorProps> = 
  React.forwardRef((props, ref) => {
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
  const [movableNode, setMovableNode] = useState<string | null>(null);
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
  const [isMermaidImportModalOpen, setIsMermaidImportModalOpen] = useState(false);
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
  
  // State for improved sidebar organization
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['component', 'page', 'hook', 'util', 'notes'])
  );
  
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

  // Hook for Mermaid import functionality
  const { processMermaid } = useMermaidToBeaUX();

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
  
  // Method to import diagram from Mermaid
  const importDiagram = (newNodes: ComponentNode[], newConnections: Connection[]) => {
    setNodes(newNodes);
    setConnections(newConnections);
    // Save to history
    saveToHistory(newNodes, newConnections);
    showFeedbackToast('Diagram imported successfully');
  };
  
  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    importDiagram
  }));

  // Helper function for feedback toasts
  const showFeedbackToast = (message: string) => {
    setFeedbackMessage(message);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  };

  // Helper function to calculate intersection points of line with rectangle
  const calculateCardIntersection = (cardCenter: {x: number, y: number}, otherPoint: {x: number, y: number}) => {
    // Card dimensions
    const cardWidth = 200;
    const cardHeight = 80;
    
    // Calculate half dimensions
    const halfWidth = cardWidth / 2;
    const halfHeight = cardHeight / 2;
    
    // Calculate angle of line
    const dx = otherPoint.x - cardCenter.x;
    const dy = otherPoint.y - cardCenter.y;
    const angle = Math.atan2(dy, dx);
    
    // Calculate intersection distances based on angle
    let xIntersect, yIntersect;
    
    // Calculate the intersection with either vertical or horizontal edge
    if (Math.abs(Math.cos(angle)) * halfHeight > Math.abs(Math.sin(angle)) * halfWidth) {
      // Intersects with left or right edge
      xIntersect = Math.sign(Math.cos(angle)) * halfWidth;
      yIntersect = Math.tan(angle) * xIntersect;
    } else {
      // Intersects with top or bottom edge
      yIntersect = Math.sign(Math.sin(angle)) * halfHeight;
      xIntersect = yIntersect / Math.tan(angle);
    }
    
    // Return intersection point
    return {
      x: cardCenter.x + xIntersect,
      y: cardCenter.y + yIntersect
    };
  };

  // Simple helper function to get node center position
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    return {
      x: node.position.x + 100, // Half of 200px width
      y: node.position.y + 40   // Half of 80px height
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
  
  // Import diagram from Mermaid code
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
      
      // Update state with new nodes and connections
      setNodes(beaUXNodes);
      setConnections(beaUXConnections);
      
      // Reset history with the imported state as the first entry
      const initialState = { nodes: beaUXNodes, connections: beaUXConnections };
      setHistory([initialState]);
      setHistoryIndex(0);
      
      showFeedbackToast('Mermaid diagram imported successfully');
      return { error: null };
    } catch (err) {
      console.error('Failed to import Mermaid diagram:', err);
      return { 
        error: `Error importing Mermaid diagram: ${err instanceof Error ? err.message : 'Unknown error'}` 
      };
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
        name: 'Welcome',
        type: 'component',
        position: { x: 100, y: 100 },
        notes: 'This is a simple tutorial to help you get started with the diagram editor.',
        color: colors.component,
        code: ''
      },
      {
        id: 'add',
        name: 'Add Components',
        type: 'component',
        position: { x: 400, y: 50 },
        notes: 'Click the + button to add new components to your diagram. You can create components, pages, hooks, and utilities.',
        color: colors.component,
        code: ''
      },
      {
        id: 'move',
        name: 'Move Components',
        type: 'component',
        position: { x: 400, y: 250 },
        notes: 'Click the move icon on a component to make it movable, then drag it around. Press ESC or click elsewhere to stop moving.',
        color: colors.component,
        code: ''
      },
      {
        id: 'connect',
        name: 'Connect',
        type: 'component',
        position: { x: 700, y: 150 },
        notes: 'Click the arrow icon on a component to create connections between components. Show how they relate to each other.',
        color: colors.component,
        code: ''
      }
    ],
    connections: [
      {
        id: 'c-welcome-add-1',
        sourceId: 'welcome',
        targetId: 'add',
        label: ""
      },
      {
        id: 'c-welcome-move-1',
        sourceId: 'welcome',
        targetId: 'move',
        label: ""
      },
      {
        id: 'c-add-connect-1',
        sourceId: 'add',
        targetId: 'connect',
        label: ""
      },
      {
        id: 'c-move-connect-1',
        sourceId: 'move',
        targetId: 'connect',
        label: ""
      }
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
      if (isDraggingNode && movableNode && canvasContainerRef.current) {
        e.preventDefault(); // Prevent text selection during drag
        
        const rect = canvasContainerRef.current.getBoundingClientRect();
        
        // Calculate new position based on mouse movement
        const mouseX = e.clientX - rect.left - canvasOffset.x;
        const mouseY = e.clientY - rect.top - canvasOffset.y; 
        
        // Get the node's dimensions
        const selectedNodeObj = nodes.find(n => n.id === movableNode);
        if (selectedNodeObj) {
          const newX = mouseX / zoom - 100; // Half the node width
          const newY = mouseY / zoom - 40;  // Half the node height
          
          // Use requestAnimationFrame for smoother updates
          window.requestAnimationFrame(() => {
            // Update only the currently movable node
            setNodes(prevNodes => 
              prevNodes.map(node => 
                node.id === movableNode 
                  ? { ...node, position: { x: newX, y: newY } } 
                  : node
              )
            );
          });
        }
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    isDraggingCanvas.current = false;
    
    // Finish dragging a node
    if (isDraggingNode && movableNode) {
      // Save the state to history when finished dragging
      saveToHistory(nodes, connections);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Clear selections unless we're in connection mode
    if (!isCreatingConnection) {
      setSelectedNode(null);
      setSelectedConnection(null);
    }
    
    // If we have a movable node, fix its position when clicking on canvas
    if (movableNode) {
      setMovableNode(null);
      setIsDraggingNode(false);
      showFeedbackToast('Component position fixed');
    }
  };

  // Function to exit move mode
  const exitMoveMode = () => {
    if (movableNode) {
      const node = nodes.find(n => n.id === movableNode);
      setMovableNode(null);
      setIsDraggingNode(false);
      saveToHistory(nodes, connections);
      if (node) {
        showFeedbackToast(`${node.name} is no longer movable`);
      }
    }
  };

  // Function to toggle favorite status of a node
  const toggleFavorite = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
        showFeedbackToast('Removed from favorites');
      } else {
        newSet.add(nodeId);
        showFeedbackToast('Added to favorites');
      }
      return newSet;
    });
  };

  // Function to toggle expanded/collapsed state of a node type group
  const toggleGroup = (type: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
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

  // Create a new empty diagram
  const createNewDiagram = () => {
    if (nodes.length > 0 || connections.length > 0) {
      if (window.confirm("Create a new diagram? Any unsaved changes will be lost.")) {
        setNodes([]);
        setConnections([]);
        setCurrentDiagramName('New Diagram');
        setSelectedNode(null);
        setSelectedConnection(null);
        // Reset history
        const newHistory = [{nodes: [], connections: []}];
        setHistory(newHistory);
        setHistoryIndex(0);
        showFeedbackToast('Created new diagram');
      }
    } else {
      // If current diagram is already empty
      setCurrentDiagramName('New Diagram');
      showFeedbackToast('Created new diagram');
    }
  };

  // Effect to handle escape key for exiting drag mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If we're in movable mode
      if (movableNode) {
        // Use E key to exit drag mode in both fullscreen and normal mode
        if (e.key === 'e' || e.key === 'E') {
          exitMoveMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movableNode, nodes, connections]);

  // Effect to handle click outside to exit drag mode
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // If we have a movable node, any click will exit move mode
      // EXCEPT clicks on the node itself or child elements of the node
      if (movableNode) {
        // Find if the click is inside the movable node
        const movableNodeElement = cardRefs.current[movableNode];
        if (movableNodeElement && !movableNodeElement.contains(e.target as Node)) {
          exitMoveMode();
        }
      }
    };

    // We need to use mouseup instead of click to ensure it works properly with drag operations
    document.addEventListener('mouseup', handleDocumentClick);
    return () => {
      document.removeEventListener('mouseup', handleDocumentClick);
    };
  }, [movableNode, nodes, connections]);

  // Handle clicking outside of selected nodes to collapse them by deselecting the node
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Only proceed if we have a selected node
      if (selectedNode) {
        // Check if the click was outside the sidebar nodes and node settings panel
        const sidebarNodes = document.querySelectorAll('.sidebar-node');
        const nodeSettingsPanel = document.querySelector('.node-settings-panel');
        
        let clickedInside = false;
        
        // Check if clicked on any sidebar node
        sidebarNodes.forEach(node => {
          if (node.contains(e.target as Node)) {
            clickedInside = true;
          }
        });
        
        // Check if clicked on node settings panel
        if (nodeSettingsPanel && nodeSettingsPanel.contains(e.target as Node)) {
          clickedInside = true;
        }
        
        // If clicked outside both, collapse by deselecting the node
        if (!clickedInside) {
          setSelectedNode(null);
          setEditingNodeId(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedNode]);

  // State for editing node names
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeName, setEditingNodeName] = useState('');

  // Save edited node name
  const saveNodeNameEdit = () => {
    if (editingNodeId) {
      const updatedNodes = nodes.map(node => {
        if (node.id === editingNodeId) {
          return { ...node, name: editingNodeName };
        }
        return node;
      });
      setNodes(updatedNodes);
      saveToHistory(updatedNodes, connections);
    }
    setEditingNodeId(null);
  };

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
                  <div className="px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border flex justify-between items-center">
                    <span>Your Saved Diagrams</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        createNewDiagram();
                        setIsPastDiagramsOpen(false);
                      }}
                      className="text-xs bg-primary text-white px-2 py-0.5 rounded flex items-center hover:bg-primary/90"
                      title="Create new diagram"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      New
                    </button>
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
            onClick={() => setIsMermaidImportModalOpen(true)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Import from Mermaid"
          >
            <FileInput className="h-4 w-4" />
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
          
          {/* New Diagram Button */}
          <button
            onClick={createNewDiagram}
            className="p-1.5 mr-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground bg-green-100 flex items-center"
            title="Create new diagram"
          >
            <Plus className="h-4 w-4 text-green-600" />
            <span className="ml-1 text-xs font-medium text-green-800">New Diagram</span>
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
          {/* Add Component Form */}
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
          
          {/* Sidebar Organization Controls */}
          <div className="space-y-2 mb-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search components..."
                className="w-full text-xs border border-border rounded-md pl-7 pr-2 py-1.5 bg-white"
              />
              <div className="absolute left-2 top-1.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            
            {/* Favorites Toggle */}
            <label className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showOnlyFavorites}
                onChange={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className="rounded text-blue-500"
              />
              Show favorites only
            </label>
          </div>
          
          {/* Nodes List */}
          {showOnlyFavorites ? (
            // Favorites View
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-gray-500 mb-2">Favorites</h3>
              {nodes
                .filter(node => favorites.has(node.id))
                .map(node => (
                  <div
                    key={node.id}
                    className={`sidebar-node flex items-center justify-between p-2 rounded-md text-xs ${
                      selectedNode === node.id ? 'bg-gray-800 border-2 border-blue-500' : 'bg-gray-800 border border-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedNode(node.id === selectedNode ? null : node.id);
                      if (selectedNode !== node.id) {
                        setEditingNodeId(null);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <span 
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: node.color || '#2dd4bf' }}
                      ></span>
                      {editingNodeId === node.id ? (
                        <input
                          className="bg-white text-gray-900 rounded px-1 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={editingNodeName}
                          onChange={(e) => setEditingNodeName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveNodeNameEdit();
                            } else if (e.key === 'Escape') {
                              setEditingNodeId(null);
                            }
                          }}
                          autoFocus
                          onBlur={saveNodeNameEdit}
                        />
                      ) : (
                        <span 
                          className={`truncate text-white`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingNodeId(node.id);
                            setEditingNodeName(node.name);
                          }}
                        >
                          {node.name}
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => toggleFavorite(node.id, e)}
                        className="p-1 rounded-md hover:bg-yellow-500/50 text-yellow-400"
                        title="Remove from favorites"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      </button>
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
                        className="p-1 rounded-md hover:bg-red-500/50 text-gray-300"
                        title="Delete component"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            // Categorized View
            <div className="space-y-2">
              {Object.entries(
                nodes
                  .filter(node => {
                    if (!searchTerm) return true;
                    return (
                      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      node.type.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                  })
                  .reduce((acc, node) => {
                    acc[node.type] = [...(acc[node.type] || []), node];
                    return acc;
                  }, {} as Record<string, ComponentNode[]>)
              ).map(([type, typeNodes]) => (
                <div key={type} className="mb-2">
                  <button 
                    onClick={() => toggleGroup(type)}
                    className="flex items-center justify-between w-full text-xs font-medium py-1 px-2 bg-gray-700 rounded-md text-white hover:bg-gray-600 transition-colors"
                  >
                    <span>{type}s ({typeNodes.length})</span>
                    {expandedGroups.has(type) ? 
                      <ArrowDown className="h-3 w-3" /> : 
                      <ArrowRight className="h-3 w-3" />
                    }
                  </button>
                  
                  {expandedGroups.has(type) && (
                    <div className="mt-1 space-y-1 pl-1">
                      {typeNodes.map(node => (
                        <div
                          key={node.id}
                          className={`sidebar-node flex items-center justify-between p-2 rounded-md text-xs ${
                            selectedNode === node.id ? 'bg-gray-800 border-2 border-blue-500' : 'bg-gray-800 border border-gray-700'
                          }`}
                          onClick={() => {
                            setSelectedNode(node.id === selectedNode ? null : node.id);
                            if (selectedNode !== node.id) {
                              setEditingNodeId(null);
                            }
                          }}
                        >
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span 
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: node.color || '#2dd4bf' }}
                            ></span>
                            {editingNodeId === node.id ? (
                              <input
                                className="bg-white text-gray-900 rounded px-1 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={editingNodeName}
                                onChange={(e) => setEditingNodeName(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    saveNodeNameEdit();
                                  } else if (e.key === 'Escape') {
                                    setEditingNodeId(null);
                                  }
                                }}
                                autoFocus
                                onBlur={saveNodeNameEdit}
                              />
                            ) : (
                              <span 
                                className={`truncate text-white`}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingNodeId(node.id);
                                  setEditingNodeName(node.name);
                                }}
                              >
                                {node.name}
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => toggleFavorite(node.id, e)}
                              className={`p-1 rounded-md ${favorites.has(node.id) ? 'text-yellow-400 hover:bg-yellow-500/50' : 'text-gray-400 hover:bg-gray-600'}`}
                              title={favorites.has(node.id) ? "Remove from favorites" : "Add to favorites"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={favorites.has(node.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                            </button>
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
                              className="p-1 rounded-md hover:bg-red-500/50 text-gray-300"
                              title="Delete component"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Node Settings Panel - shows when a node is selected */}
          {selectedNode && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200 node-settings-panel">
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

          {/* Connection Settings Panel - shows when a connection is selected */}
          {selectedConnection && !selectedNode && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="text-xs font-medium mb-2">Connection Settings</h3>
              
              {/* Connection info */}
              {(() => {
                const connection = connections.find(c => c.id === selectedConnection);
                if (!connection) return null;
                
                const sourceNode = nodes.find(n => n.id === connection.sourceId);
                const targetNode = nodes.find(n => n.id === connection.targetId);
                
                if (!sourceNode || !targetNode) return null;
                
                return (
                  <>
                    <div className="mb-3">
                      <div className="text-gray-400 text-sm mb-1">From</div>
                      <div className="text-white">{sourceNode?.name || 'Unknown'}</div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-gray-400 text-sm mb-1">To</div>
                      <div className="text-white">{targetNode?.name || 'Unknown'}</div>
                    </div>
                    
                    <button
                      onClick={() => {
                        // Remove this connection
                        const newConnections = connections.filter(c => c.id !== selectedConnection);
                        setConnections(newConnections);
                        setSelectedConnection(null);
                        saveToHistory(nodes, newConnections);
                        showFeedbackToast("Connection deleted");
                      }}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md transition-colors"
                    >
                      Delete Connection
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        
        {/* Canvas */}
        <div 
          ref={canvasContainerRef}
          className={`relative flex-1 ${isFullscreen ? 'h-[calc(100vh-44px)]' : 'h-[calc(100vh-180px)]'} overflow-hidden ${
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
          {/* Connection creation UI */}
          {isCreatingConnection && connectionStart && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-50 shadow-lg border border-gray-700 flex items-center gap-3">
              <span>Click on any component card to create a connection</span>
              <button 
                onClick={() => {
                  setIsCreatingConnection(false);
                  setConnectionStart(null);
                }}
                className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          )}
          
          {/* Connection preview when creating */}
          {isCreatingConnection && connectionStart && (
            <svg className="absolute inset-0 z-10 pointer-events-none">
              <path
                d={`M ${getNodeCenter(connectionStart).x} ${getNodeCenter(connectionStart).y} L ${mousePosition.x} ${mousePosition.y}`}
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="5,5"
                fill="none"
              />
            </svg>
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
            
            {/* Connections Layer - Renders BENEATH components */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ overflow: 'visible', zIndex: 1 }}>
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
                // Get the centers of both nodes
                const sourceCenter = getNodeCenter(connection.sourceId);
                const targetCenter = getNodeCenter(connection.targetId);
                
                // Draw a simple curved line between them
                const dx = targetCenter.x - sourceCenter.x;
                const dy = targetCenter.y - sourceCenter.y;
                
                // Adjust the midpoint based on multiple connections
                // Randomly offset each connection slightly to make multiple connections visible
                const mid = connection.id.charCodeAt(connection.id.length - 1) % 50 - 25;
                const midX = (sourceCenter.x + targetCenter.x) / 2;
                const midY = (sourceCenter.y + targetCenter.y) / 2 + mid;
                
                // Create a simple quadratic bezier curve path
                const path = `M ${sourceCenter.x} ${sourceCenter.y} Q ${midX} ${midY} ${targetCenter.x} ${targetCenter.y}`;
                
                return (
                  <g key={connection.id}>
                    {/* Wider invisible path for easier selection */}
                    <path
                      d={path}
                      stroke="transparent"
                      strokeWidth={20}
                      fill="none"
                      className="pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConnection(connection.id);
                        setSelectedNode(null);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    
                    {/* Visible connection line */}
                    <path
                      d={path}
                      stroke={selectedConnection === connection.id ? '#22c55e' : '#94a3b8'}
                      strokeWidth={selectedConnection === connection.id ? 3 : 2}
                      fill="none"
                      strokeDasharray={selectedConnection === connection.id ? "" : ""}
                      className="pointer-events-none"
                    />
                    
                    {/* Simple arrow at the end */}
                    <circle
                      cx={targetCenter.x}
                      cy={targetCenter.y}
                      r={4}
                      fill={selectedConnection === connection.id ? '#22c55e' : '#94a3b8'}
                      className="pointer-events-none"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Component Nodes Layer */}
            {nodes.map(node => (
              <div 
                key={node.id}
                ref={el => cardRefs.current[node.id] = el}
                style={{
                  position: 'absolute',
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`,
                  width: '200px',
                  minHeight: '80px',
                  transform: node.id === movableNode ? 'scale(1.02)' : 'scale(1)',
                  transition: node.id === movableNode ? 'box-shadow 0.1s ease, transform 0.1s ease' : 'box-shadow 0.2s ease, transform 0.2s ease',
                  zIndex: node.id === movableNode ? 100 : 10,
                  boxShadow: node.id === movableNode ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  backgroundColor: expandedNodes.has(node.id) 
                    ? `${node.color}f0` // Using semi-transparent version of the component color
                    : node.color || '#6366f1',
                  borderRadius: '8px',
                  border: selectedNode === node.id 
                    ? '2px solid #3b82f6' 
                    : expandedNodes.has(node.id) 
                      ? `1px solid ${node.color}` 
                      : '1px solid transparent'
                }}
                className={`node-card overflow-hidden galaxy-node pointer-events-auto ${movableNode === node.id ? 'cursor-move' : 'cursor-pointer'} absolute p-3 backdrop-blur-sm`}
                onClick={(e) => {
                  e.stopPropagation();
                  
                  // If we're in connection creation mode
                  if (isCreatingConnection && connectionStart) {
                    // Don't connect to self
                    if (node.id !== connectionStart) {
                      // Create the connection with a simple unique ID - ensure uniqueness with timestamp
                      const newConnection: Connection = {
                        id: `c-${connectionStart}-${node.id}-${Date.now()}`,
                        sourceId: connectionStart,
                        targetId: node.id,
                        label: ""
                      };
                      
                      // Add the new connection
                      const newConnections = [...connections, newConnection];
                      setConnections(newConnections);
                      saveToHistory(nodes, newConnections);
                      
                      showFeedbackToast(`Connected ${nodes.find(n => n.id === connectionStart)?.name || 'node'} to ${node.name}`);
                    } else {
                      showFeedbackToast("Cannot connect a node to itself");
                    }
                    
                    // Reset connection creation state
                    setIsCreatingConnection(false);
                    setConnectionStart(null);
                  } else {
                    // Just select the node when clicked
                    setSelectedNode(node.id === selectedNode ? null : node.id);
                    setSelectedConnection(null);
                  }
                }}
                onMouseDown={(e) => {
                  e.stopPropagation(); // Prevent canvas drag when clicking on node
                }}
              >
                {/* Movable mode tooltip - appears above the card */}
                {movableNode === node.id && (
                  <div className="absolute -top-8 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-black/70 text-white text-xs py-1 px-2 rounded-md shadow-sm backdrop-blur-sm">
                      Press <span className="font-bold mx-1">E</span> to exit move mode
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span 
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: node.color || '#2dd4bf' }}
                    ></span>
                    <span className="text-white">{node.name}</span>
                  </div>
                  <div className="flex">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Create connection from this node
                        setSelectedNode(node.id);
                        setConnectionStart(node.id);
                        setIsCreatingConnection(true);
                        showFeedbackToast(`Select any component to connect from ${node.name}`);
                      }}
                      className="p-1 rounded-md hover:bg-indigo-800/50 text-gray-300 mr-1"
                      title="Create connection"
                    >
                      <Link className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle movable state for this node
                        if (movableNode === node.id) {
                          setMovableNode(null);
                          setIsDraggingNode(false);
                        } else {
                          setMovableNode(node.id);
                          setSelectedNode(node.id);
                          setIsDraggingNode(true);
                          showFeedbackToast(`${node.name} is now movable - press E to fix position`);
                        }
                      }}
                      className={`p-1 rounded-md hover:bg-indigo-800/50 text-gray-300 mr-1 ${
                        movableNode === node.id ? 'bg-indigo-800/70 text-white' : ''
                      }`}
                      title={movableNode === node.id 
                        ? `Press E to exit move mode` 
                        : "Make component movable"}
                    >
                      <Move className="h-3.5 w-3.5" />
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
                  <div className="mt-2 border-t border-white/20 pt-2 relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-medium text-white">Notes:</label>
                    </div>
                    <textarea
                      className="w-full text-xs bg-black/30 p-2 rounded-md border border-white/20 resize-none text-white"
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
                        <label className="text-[10px] font-medium text-white">Component Code:</label>
                        <button
                          className="text-[10px] text-white/80 hover:text-white px-1.5 py-0.5 rounded hover:bg-black/30"
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
                          className="w-full text-[10px] bg-black/30 p-2 rounded-md font-mono border border-white/20 resize-none text-white"
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
      
      {/* Connection Settings Panel */}
      {selectedConnection && (
        <div className="absolute bottom-4 right-4 bg-gray-900 rounded-lg shadow-lg border border-gray-700 p-4 w-64 z-50">
          <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
            <h3 className="text-white font-medium">Connection Settings</h3>
            <button 
              onClick={() => setSelectedConnection(null)}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {(() => {
            const connection = connections.find(c => c.id === selectedConnection);
            if (!connection) return null;
            
            const sourceNode = nodes.find(n => n.id === connection.sourceId);
            const targetNode = nodes.find(n => n.id === connection.targetId);
            
            return (
              <>
                <div className="mb-3">
                  <div className="text-gray-400 text-sm mb-1">From</div>
                  <div className="text-white">{sourceNode?.name || 'Unknown'}</div>
                </div>
                
                <div className="mb-3">
                  <div className="text-gray-400 text-sm mb-1">To</div>
                  <div className="text-white">{targetNode?.name || 'Unknown'}</div>
                </div>
                
                <button
                  onClick={() => {
                    // Remove this connection
                    const newConnections = connections.filter(c => c.id !== selectedConnection);
                    setConnections(newConnections);
                    setSelectedConnection(null);
                    saveToHistory(nodes, newConnections);
                    showFeedbackToast("Connection deleted");
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md transition-colors"
                >
                  Delete Connection
                </button>
              </>
            );
          })()}
        </div>
      )}
      
      {/* Mermaid Import Modal */}
      <MermaidImportModal
        isOpen={isMermaidImportModalOpen}
        onClose={() => setIsMermaidImportModalOpen(false)}
        onImport={handleMermaidImport}
      />
    </div>
  );
});

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
