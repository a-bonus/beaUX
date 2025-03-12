import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowRight, 
  Plus, 
  Trash2, 
  MoveHorizontal, 
  Undo, 
  Redo,
  ZoomIn,
  ZoomOut,
  PackagePlus,
  FileCode,
  Download,
  ArrowRightCircle,
  ChevronDown,
  ChevronUp,
  Move,
  Save
} from 'lucide-react';

interface ComponentNode {
  id: string;
  name: string;
  position: { x: number; y: number };
  color: string;
  type: 'component' | 'page' | 'hook' | 'util';
  code: string;
  notes: string;
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
};

const DiagramEditor: React.FC = () => {
  const [nodes, setNodes] = useState<ComponentNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<ComponentNode['type']>('component');
  const [history, setHistory] = useState<Array<{ nodes: ComponentNode[], connections: Connection[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const editorRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const isDraggingCanvas = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);

  // Sample data for demonstration
  const initialSampleData: { nodes: ComponentNode[], connections: Connection[] } = {
    nodes: [
      { 
        id: '1', 
        name: 'Button', 
        position: { x: 100, y: 100 }, 
        color: colors.component,
        type: 'component',
        code: '',
        notes: ''
      },
      { 
        id: '2', 
        name: 'Card', 
        position: { x: 300, y: 150 }, 
        color: colors.component,
        type: 'component',
        code: '',
        notes: ''
      },
      { 
        id: '3', 
        name: 'HomePage', 
        position: { x: 500, y: 100 }, 
        color: colors.page,
        type: 'page',
        code: '',
        notes: ''
      },
      { 
        id: '4', 
        name: 'useFetch', 
        position: { x: 400, y: 300 }, 
        color: colors.hook,
        type: 'hook',
        code: '',
        notes: ''
      }
    ],
    connections: [
      { id: 'c1', sourceId: '1', targetId: '2', label: 'uses' },
      { id: 'c2', sourceId: '2', targetId: '3', label: 'uses' },
      { id: 'c3', sourceId: '4', targetId: '3', label: 'uses' }
    ]
  };

  useEffect(() => {
    setNodes(initialSampleData.nodes);
    setConnections(initialSampleData.connections);
    saveToHistory(initialSampleData.nodes, initialSampleData.connections);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
      isDraggingCanvas.current = false;
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

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

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      setNodes(prevState.nodes);
      setConnections(prevState.connections);
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setNodes(nextState.nodes);
      setConnections(nextState.connections);
      setHistoryIndex(newIndex);
    }
  };

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(nodeId);
    
    // Start dragging
    const node = nodes.find(n => n.id === nodeId);
    if (node && editorRef.current) {
      isDragging.current = true;
      const rect = editorRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - (node.position.x * zoom + rect.left + canvasOffset.x),
        y: e.clientY - (node.position.y * zoom + rect.top + canvasOffset.y)
      };
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // When in pan mode, enable canvas dragging regardless of where you click
    // Otherwise, only enable when clicking directly on the canvas background
    if (isPanMode || e.target === e.currentTarget) {
      isDraggingCanvas.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      
      // Change cursor style to indicate grabbing
      if (editorRef.current) {
        editorRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle canvas dragging
    if (isDraggingCanvas.current) {
      e.preventDefault();
      const dx = e.clientX - lastMousePosition.current.x;
      const dy = e.clientY - lastMousePosition.current.y;
      
      setCanvasOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    // Handle node dragging
    if (isDragging.current && selectedNode && editorRef.current) {
      e.preventDefault(); // Prevent text selection during drag
      const rect = editorRef.current.getBoundingClientRect();
      
      const newX = (e.clientX - rect.left - dragOffset.current.x - canvasOffset.x) / zoom;
      const newY = (e.clientY - rect.top - dragOffset.current.y - canvasOffset.y) / zoom;
      
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === selectedNode) {
          return {
            ...node,
            position: { x: newX, y: newY }
          };
        }
        return node;
      }));
    }
    
    // Update mouse position for connection preview
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const y = (e.clientY - rect.top - canvasOffset.y) / zoom;
      setMousePosition({ x, y });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // End canvas dragging
    if (isDraggingCanvas.current) {
      isDraggingCanvas.current = false;
      if (editorRef.current) {
        editorRef.current.style.cursor = 'grab';
      }
    }
    
    // Handle node drag end
    if (isDragging.current && selectedNode) {
      isDragging.current = false;
      saveToHistory(nodes, connections);
    }
    
    // Handle connection completion
    if (connectionStart && isCreatingConnection) {
      completeConnection(e);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
      
      if (isDraggingCanvas.current) {
        isDraggingCanvas.current = false;
        if (editorRef.current) {
          editorRef.current.style.cursor = 'grab';
        }
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space + mouse drag for canvas panning
      if (e.code === 'Space' && editorRef.current) {
        editorRef.current.style.cursor = 'grab';
      }
      
      // Arrow keys for small movements
      const moveAmount = 10;
      if (e.key === 'ArrowUp') {
        setCanvasOffset(prev => ({ ...prev, y: prev.y + moveAmount }));
      } else if (e.key === 'ArrowDown') {
        setCanvasOffset(prev => ({ ...prev, y: prev.y - moveAmount }));
      } else if (e.key === 'ArrowLeft') {
        setCanvasOffset(prev => ({ ...prev, x: prev.x + moveAmount }));
      } else if (e.key === 'ArrowRight') {
        setCanvasOffset(prev => ({ ...prev, x: prev.x - moveAmount }));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && editorRef.current) {
        editorRef.current.style.cursor = 'default';
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const calculateConnectionPath = (sourceId: string, targetId: string) => {
    const sourceCenter = getNodeCenter(sourceId);
    const targetCenter = getNodeCenter(targetId);
    
    // Calculate the path
    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate control points for a curved path
    const controlPointOffset = Math.min(80, length / 3);
    
    // Calculate the angle to offset the control point perpendicular to the line
    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const offsetX = controlPointOffset * Math.cos(angle);
    const offsetY = controlPointOffset * Math.sin(angle);
    
    // Calculate the midpoint
    const midX = (sourceCenter.x + targetCenter.x) / 2 + offsetX;
    const midY = (sourceCenter.y + targetCenter.y) / 2 + offsetY;
    
    // Calculate the path
    return {
      path: `M ${sourceCenter.x} ${sourceCenter.y} Q ${midX} ${midY} ${targetCenter.x} ${targetCenter.y}`,
      midX,
      midY,
      angle: Math.atan2(dy, dx) * 180 / Math.PI
    };
  };

  const getLiveConnectionEndPoint = () => {
    return mousePosition;
  };

  const startConnectionCreation = (nodeId: string) => {
    setSelectedNode(nodeId);
    setConnectionStart(nodeId);
    setIsCreatingConnection(true);
    
    // Show visual feedback
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      showFeedbackToast(`Select another component to connect from ${node.name}`);
    }
  };

  const cancelConnectionCreation = () => {
    if (isCreatingConnection) {
      setIsCreatingConnection(false);
      setConnectionStart(null);
    }
  };

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If we're in connection creation mode
    if (isCreatingConnection && connectionStart) {
      // Don't connect to self
      if (nodeId !== connectionStart) {
        // Create the connection
        const newConnection: Connection = {
          id: `c${Date.now()}`,
          sourceId: connectionStart,
          targetId: nodeId,
          label: 'uses'
        };
        
        const updatedConnections = [...connections, newConnection];
        setConnections(updatedConnections);
        saveToHistory(nodes, updatedConnections);
      }
      
      // Reset connection creation state
      setIsCreatingConnection(false);
      setConnectionStart(null);
      
      // Provide visual feedback
      const sourceNode = nodes.find(n => n.id === connectionStart);
      const targetNode = nodes.find(n => n.id === nodeId);
      if (sourceNode && targetNode) {
        showFeedbackToast(`Connected ${sourceNode.name} to ${targetNode.name}`);
      }
    } else {
      // If not creating a connection, just select the node
      setSelectedNode(nodeId === selectedNode ? null : nodeId);
    }
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setSelectedConnection(null);
  };

  const updateNodeCode = (nodeId: string, code: string) => {
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, code };
      }
      return node;
    });
    
    setNodes(updatedNodes);
    saveToHistory(updatedNodes, connections);
    
    // Show feedback
    setFeedbackMessage('Code updated successfully');
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 2000);
  };

  const updateNodeNotes = (nodeId: string, notes: string) => {
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, notes };
      }
      return node;
    });
    
    setNodes(updatedNodes);
    saveToHistory(updatedNodes, connections);
  };

  // Find if mouse position is over any node
  const findNodeAtPosition = (x: number, y: number) => {
    // Check if position is within any node bounds (with some padding for connection points)
    return nodes.find(node => {
      const nodeLeft = node.position.x - 5;
      const nodeRight = node.position.x + 205; // 200px width + 5px padding
      const nodeTop = node.position.y - 5;
      const nodeBottom = node.position.y + 105; // Approximate height + 5px padding
      
      return x >= nodeLeft && x <= nodeRight && y >= nodeTop && y <= nodeBottom;
    });
  };

  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    return {
      x: node.position.x + 100,
      y: node.position.y + 40
    };
  };

  const deleteNode = (nodeId: string) => {
    const newNodes = nodes.filter(node => node.id !== nodeId);
    const newConnections = connections.filter(
      connection => connection.sourceId !== nodeId && connection.targetId !== nodeId
    );
    
    setNodes(newNodes);
    setConnections(newConnections);
    setSelectedNode(null);
    saveToHistory(newNodes, newConnections);
  };

  const deleteConnection = (connectionId: string) => {
    const newConnections = connections.filter(connection => connection.id !== connectionId);
    setConnections(newConnections);
    setSelectedConnection(null);
    saveToHistory(nodes, newConnections);
  };

  const handleConnectionClick = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedConnection(connectionId);
    setSelectedNode(null);
  };

  const toggleNodeExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNode(expandedNode === nodeId ? null : nodeId);
  };

  const addNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;
    
    const newNode: ComponentNode = {
      id: `n${Date.now()}`,
      name: newNodeName,
      position: { x: 200, y: 200 },
      color: colors[newNodeType],
      type: newNodeType,
      code: '',
      notes: ''
    };
    
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    setNewNodeName('');
    saveToHistory(updatedNodes, connections);
  };

  const showFeedbackToast = (message: string) => {
    setFeedbackMessage(message);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  };

  // Complete connection creation
  const completeConnection = (e: React.MouseEvent) => {
    if (!connectionStart) return;
    
    // Check if ended on a different node
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const canvasY = (e.clientY - rect.top - canvasOffset.y) / zoom;
      
      const targetNode = findNodeAtPosition(canvasX, canvasY);
      
      if (targetNode && targetNode.id !== connectionStart) {
        // Create the connection
        const newConnection: Connection = {
          id: `c${Date.now()}`,
          sourceId: connectionStart,
          targetId: targetNode.id,
          label: "connects to"
        };
        
        const newConnections = [...connections, newConnection];
        setConnections(newConnections);
        saveToHistory(nodes, newConnections);
        showFeedbackToast('Connection created successfully');
      }
    }
    
    setConnectionStart(null);
    setIsCreatingConnection(false);
  };

  return (
    <div className="flex flex-col rounded-lg border border-border overflow-hidden bg-white">
      <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Component Diagram</h3>
          <div className="flex items-center border border-border rounded-md bg-white">
            <button 
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              className="p-1 hover:bg-muted/50 border-r border-border"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
              className="p-1 hover:bg-muted/50 border-l border-border"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          
          <button 
            onClick={undo}
            disabled={historyIndex <= 0}
            className={`p-1 rounded-md ${historyIndex <= 0 ? 'text-muted-foreground/30' : 'hover:bg-muted/50 text-muted-foreground'}`}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className={`p-1 rounded-md ${historyIndex >= history.length - 1 ? 'text-muted-foreground/30' : 'hover:bg-muted/50 text-muted-foreground'}`}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
          
          <button 
            className={`flex items-center gap-1 text-xs ${
              isPanMode 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'bg-white border-border text-foreground'
            } border rounded-md px-2 py-1 hover:bg-muted/30`}
            title={isPanMode ? "Exit pan mode" : "Enter pan mode"}
            onClick={() => setIsPanMode(!isPanMode)}
          >
            <Move className="h-3 w-3" />
            <span>{isPanMode ? "Exit Pan" : "Pan"}</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <form className="flex items-center" onSubmit={addNode}>
            <input
              type="text"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              placeholder="Component name"
              className="text-sm border border-border rounded-l-md px-2 py-1 w-32"
            />
            <select
              value={newNodeType}
              onChange={(e) => setNewNodeType(e.target.value as ComponentNode['type'])}
              className="text-sm border-y border-r border-border rounded-r-md px-2 py-1 bg-white"
            >
              <option value="component">Component</option>
              <option value="page">Page</option>
              <option value="hook">Hook</option>
              <option value="util">Utility</option>
            </select>
            <button 
              type="submit"
              className="ml-2 flex items-center gap-1 text-xs bg-primary text-white rounded-md px-2 py-1 hover:bg-primary/90"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>
      
      <div className="flex flex-1 min-h-0">
        <div className="border-r border-border w-60 overflow-y-auto p-2 bg-white">
          <h4 className="font-medium text-sm mb-2">Components</h4>
          <div className="space-y-1">
            {nodes.map(node => (
              <div
                key={node.id}
                className={`flex items-center justify-between p-2 rounded-md text-xs ${
                  selectedNode === node.id 
                    ? connectionStart === node.id
                      ? 'bg-muted border border-input' 
                      : 'border-primary shadow-md' 
                    : 'hover:bg-muted/50'
                } ${connectionStart === node.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              >
                <div className="flex items-center gap-1">
                  <span 
                    className="h-2.5 w-2.5 rounded-full" 
                    style={{ backgroundColor: node.color }}
                  ></span>
                  <span>{node.name}</span>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                    title="Delete component"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div 
          ref={editorRef}
          className={`relative flex-1 h-[400px] overflow-hidden bg-[#f8fafc] bg-grid-pattern ${
            isPanMode 
              ? 'cursor-grab' 
              : isDraggingCanvas.current 
                ? 'cursor-grabbing' 
                : 'cursor-default'
          }`}
          style={{ 
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`
          }}
          onClick={handleBackgroundClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Overlay notifications */}
          {isCreatingConnection && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-md shadow-md z-50 text-sm flex items-center gap-2">
              <span>Click on another component to connect</span>
              <button 
                onClick={cancelConnectionCreation}
                className="bg-blue-600 hover:bg-blue-700 rounded-md px-2 py-0.5 text-xs"
              >
                Cancel
              </button>
            </div>
          )}
          
          {showFeedback && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-md z-50 text-sm">
              {feedbackMessage}
            </div>
          )}

          {/* Canvas Content */}
          <div 
            className="absolute inset-0" 
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: '0 0',
              left: `${canvasOffset.x}px`,
              top: `${canvasOffset.y}px`
            }}
          >
            {/* Connections Layer */}
            <svg className="absolute inset-0 w-full h-full">
              {connections.map((connection) => {
                const { path, angle } = calculateConnectionPath(
                  connection.sourceId,
                  connection.targetId
                );
                
                return (
                  <g key={connection.id}>
                    <path
                      d={path}
                      fill="none"
                      stroke={selectedConnection === connection.id ? '#3b82f6' : '#94a3b8'}
                      strokeWidth={selectedConnection === connection.id ? 3 : 2}
                      onClick={(e) => handleConnectionClick(connection.id, e)}
                      className="cursor-pointer"
                    />
                    <path
                      d="M 0,0 L -8,-4 L -8,4 Z"
                      fill={selectedConnection === connection.id ? '#3b82f6' : '#94a3b8'}
                      transform={`translate(${getNodeCenter(connection.targetId).x},${getNodeCenter(connection.targetId).y}) rotate(${angle})`}
                      onClick={(e) => handleConnectionClick(connection.id, e)}
                      className="cursor-pointer"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Component Nodes Layer */}
            {nodes.map(node => (
              <div
                key={node.id}
                className={`absolute cursor-pointer rounded-md border ${
                  selectedNode === node.id 
                    ? connectionStart === node.id
                      ? 'border-blue-500 shadow-md bg-blue-50'
                      : 'border-primary shadow-md' 
                    : 'border-border shadow-sm'
                } ${connectionStart === node.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''} bg-white p-3 w-[200px]`}
                style={{
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(node.id, e);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation(); // Prevent canvas drag when clicking on node
                  handleNodeMouseDown(node.id, e);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: node.color }}
                    ></span>
                    <h4 className="font-medium text-sm">{node.name}</h4>
                  </div>
                  <div className="flex">
                    {!isCreatingConnection && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          startConnectionCreation(node.id);
                        }}
                        className="p-1 mr-1 rounded-md hover:bg-blue-100 text-blue-600"
                        title="Create connection from this component"
                      >
                        <ArrowRightCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => toggleNodeExpand(node.id, e)}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                      title={expandedNode === node.id ? "Hide code" : "Show code"}
                    >
                      {expandedNode === node.id ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                      title="Delete component"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                
                {/* Component Code (Collapsible & Editable) */}
                {expandedNode === node.id && (
                  <div className="mt-2 border-t pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-medium text-muted-foreground">Component Code:</label>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const codeElement = document.getElementById(`code-${node.id}`) as HTMLTextAreaElement;
                          if (codeElement) {
                            updateNodeCode(node.id, codeElement.value);
                          }
                        }}
                        className="p-1 rounded-md hover:bg-blue-100 text-blue-600"
                        title="Save code changes"
                      >
                        <Save className="h-3 w-3" />
                      </button>
                    </div>
                    <textarea
                      id={`code-${node.id}`}
                      className="w-full h-24 text-[10px] bg-gray-50 p-2 rounded-sm overflow-x-auto font-mono border border-gray-200 resize-none"
                      defaultValue={node.code}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="// Enter component code here..."
                    ></textarea>
                    
                    <div className="mt-2">
                      <label className="text-[10px] font-medium text-muted-foreground block mb-1">Notes:</label>
                      <textarea
                        className="w-full h-16 text-[10px] bg-gray-50 p-2 rounded-sm overflow-x-auto border border-gray-200 resize-none"
                        defaultValue={node.notes}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => updateNodeNotes(node.id, e.target.value)}
                        placeholder="Add notes about this component..."
                      ></textarea>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-2 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium mr-1">To connect components:</span> 
          <span>
            1) Click the connection icon <ArrowRightCircle className="inline h-3 w-3" /> on a component
            2) Then click on another component to create a connection
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-blue-500"></span>
            <span>Connection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramEditor;
