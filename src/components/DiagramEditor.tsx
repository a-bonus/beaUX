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
  ArrowRightCircle
} from 'lucide-react';

interface ComponentNode {
  id: string;
  name: string;
  position: { x: number; y: number };
  imports: string[];
  exports: string[];
  color: string;
  type: 'component' | 'page' | 'hook' | 'util';
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  type: 'import' | 'export' | 'both';
}

const colors = {
  component: '#3b82f6', // blue
  page: '#10b981',      // green
  hook: '#8b5cf6',      // purple
  util: '#f59e0b',      // amber
};

const connectionStyles = {
  import: {
    stroke: '#3b82f6',
    strokeDasharray: 'none',
    label: 'imports'
  },
  export: {
    stroke: '#10b981',
    strokeDasharray: '5,5',
    label: 'exports'
  },
  both: {
    stroke: '#8b5cf6',
    strokeDasharray: '10,2,2,2',
    label: 'imports/exports'
  }
};

const DiagramEditor: React.FC = () => {
  const [nodes, setNodes] = useState<ComponentNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionType, setConnectionType] = useState<Connection['type']>('import');
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

  // Sample data for demonstration
  const initialSampleData: { nodes: ComponentNode[], connections: Connection[] } = {
    nodes: [
      { 
        id: '1', 
        name: 'Button', 
        position: { x: 100, y: 100 }, 
        imports: ['React', 'useState'], 
        exports: ['Button'], 
        color: colors.component,
        type: 'component'
      },
      { 
        id: '2', 
        name: 'Card', 
        position: { x: 300, y: 150 }, 
        imports: ['React', 'Button'], 
        exports: ['Card'], 
        color: colors.component,
        type: 'component'
      },
      { 
        id: '3', 
        name: 'HomePage', 
        position: { x: 500, y: 100 }, 
        imports: ['Card', 'useFetch'], 
        exports: ['HomePage'], 
        color: colors.page,
        type: 'page'
      },
      { 
        id: '4', 
        name: 'useFetch', 
        position: { x: 400, y: 300 }, 
        imports: ['useState', 'useEffect'], 
        exports: ['useFetch'], 
        color: colors.hook,
        type: 'hook'
      }
    ],
    connections: [
      { id: 'c1', sourceId: '1', targetId: '2', label: 'imports', type: 'import' },
      { id: 'c2', sourceId: '2', targetId: '3', label: 'imports', type: 'import' },
      { id: 'c3', sourceId: '4', targetId: '3', label: 'imports', type: 'import' }
    ]
  };

  useEffect(() => {
    setNodes(initialSampleData.nodes);
    setConnections(initialSampleData.connections);
    saveToHistory(initialSampleData.nodes, initialSampleData.connections);
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
        x: e.clientX - (node.position.x * zoom + rect.left),
        y: e.clientY - (node.position.y * zoom + rect.top)
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update mouse position for connection drawing
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      setMousePosition({ x, y });
    }
    
    if (isDragging.current && selectedNode && editorRef.current) {
      e.preventDefault(); // Prevent text selection during drag
      const rect = editorRef.current.getBoundingClientRect();
      
      const newX = (e.clientX - rect.left - dragOffset.current.x) / zoom;
      const newY = (e.clientY - rect.top - dragOffset.current.y) / zoom;
      
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
  };

  const calculateConnectionPath = (sourceId: string, targetId: string, connectionType: Connection['type']) => {
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
      angle: Math.atan2(dy, dx) * 180 / Math.PI,
      strokeDasharray: connectionType === 'export' ? '5,5' : 
                      connectionType === 'both' ? '10,2,2,2' : 'none'
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
          label: 'imports',
          type: connectionType
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

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      saveToHistory(nodes, connections);
    }
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

  const toggleConnectionType = (connectionId: string) => {
    const updatedConnections = connections.map(connection => {
      if (connection.id === connectionId) {
        const newType: Connection['type'] = 
          connection.type === 'import' ? 'export' :
          connection.type === 'export' ? 'both' : 'import';
          
        return {
          ...connection,
          type: newType,
          label: newType === 'import' ? 'imports' : 
                 newType === 'export' ? 'exports' : 'imports/exports'
        };
      }
      return connection;
    });
    
    setConnections(updatedConnections);
    saveToHistory(nodes, updatedConnections);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    return {
      x: node.position.x + 100,
      y: node.position.y + 40
    };
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setSelectedConnection(null);
  };

  const addNode = () => {
    if (newNodeName.trim() === '') return;
    
    const newNode: ComponentNode = {
      id: `n${Date.now()}`,
      name: newNodeName,
      position: { x: 200, y: 200 },
      imports: [],
      exports: [newNodeName],
      color: colors[newNodeType],
      type: newNodeType
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

  return (
    <div className="flex flex-col rounded-lg border border-border overflow-hidden bg-white">
      <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <h3 className="text-sm font-medium">Component Diagram</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={undo} 
            className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground"
            disabled={historyIndex <= 0}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button 
            onClick={redo} 
            className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground"
            disabled={historyIndex >= history.length - 1}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
          <div className="h-4 border-r border-border mx-1"></div>
          <button 
            onClick={zoomOut} 
            className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={zoomIn} 
            className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="h-4 border-r border-border mx-1"></div>
          <button 
            className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground"
            title="Download Diagram"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="flex">
        <div className="w-64 p-3 border-r border-border bg-muted/20 flex flex-col h-[400px]">
          <div className="mb-3">
            <h4 className="text-xs font-medium mb-2">Add Component</h4>
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={newNodeName} 
                onChange={(e) => setNewNodeName(e.target.value)}
                placeholder="Component name"
                className="flex-1 text-sm rounded-md border border-input px-3 py-1 h-8"
              />
              <button 
                onClick={addNode}
                disabled={!newNodeName.trim()}
                className="p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 mb-4">
              {(['component', 'page', 'hook', 'util'] as ComponentNode['type'][]).map(type => (
                <button 
                  key={type}
                  onClick={() => setNewNodeType(type)}
                  className={`text-xs py-1 px-2 rounded-md flex items-center justify-center gap-1 border ${
                    newNodeType === type 
                      ? 'bg-muted border-input' 
                      : 'bg-transparent border-muted hover:bg-muted/50'
                  }`}
                >
                  <span 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: colors[type] }}
                  ></span>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <h4 className="text-xs font-medium mb-2">Components</h4>
          <div className="space-y-1 flex-1 overflow-y-auto pr-1">
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
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: node.color }}
                  ></span>
                  <span>{node.name}</span>
                </div>
                <div className="flex items-center">
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

          <div className="mt-3 pt-3 border-t border-border">
            <h4 className="text-xs font-medium mb-2">Repository Integration</h4>
            <button className="w-full flex items-center justify-center gap-1 p-2 rounded-md text-xs bg-secondary hover:bg-secondary/80 transition-colors">
              <PackagePlus className="h-3.5 w-3.5" />
              Connect to Repository
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              Connect to a repository to visualize component imports and exports
            </p>
          </div>
        </div>
        
        <div 
          ref={editorRef}
          className="relative flex-1 h-[400px] overflow-hidden bg-[#f8fafc] bg-grid-pattern"
          style={{ 
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`
          }}
          onClick={handleBackgroundClick}
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
          
          {/* Connection type selector */}
          <div className="fixed top-4 right-4 bg-white rounded-md shadow-md border border-gray-200 p-2 z-50">
            <div className="text-xs font-medium mb-1">Connection Type:</div>
            <div className="flex gap-2">
              <button 
                className={`px-2 py-1 rounded-md text-xs ${connectionType === 'import' ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'}`}
                onClick={() => setConnectionType('import')}
              >
                Import
              </button>
              <button 
                className={`px-2 py-1 rounded-md text-xs ${connectionType === 'export' ? 'bg-green-100 border border-green-300' : 'hover:bg-gray-100'}`}
                onClick={() => setConnectionType('export')}
              >
                Export
              </button>
              <button 
                className={`px-2 py-1 rounded-md text-xs ${connectionType === 'both' ? 'bg-purple-100 border border-purple-300' : 'hover:bg-gray-100'}`}
                onClick={() => setConnectionType('both')}
              >
                Both
              </button>
            </div>
          </div>

          {/* Canvas Content */}
          <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
            {/* Connections Layer */}
            <svg className="absolute inset-0 w-full h-full">
              {connections.map((connection) => {
                const { path, angle, strokeDasharray } = calculateConnectionPath(
                  connection.sourceId,
                  connection.targetId,
                  connection.type
                );
                
                const connectionColor = connectionStyles[connection.type].stroke;
                
                return (
                  <g key={connection.id}>
                    <path
                      d={path}
                      fill="none"
                      stroke={selectedConnection === connection.id ? '#3b82f6' : connectionColor}
                      strokeWidth={selectedConnection === connection.id ? 3 : 2}
                      strokeDasharray={strokeDasharray}
                      onClick={(e) => handleConnectionClick(connection.id, e)}
                      className="cursor-pointer"
                    />
                    <path
                      d="M 0,0 L -8,-4 L -8,4 Z"
                      fill={selectedConnection === connection.id ? '#3b82f6' : connectionColor}
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
                onClick={(e) => handleNodeClick(node.id, e)}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
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
                
                {node.imports.length > 0 && (
                  <div className="mb-1">
                    <span className="text-[10px] text-muted-foreground mb-0.5 block">Imports:</span>
                    <div className="flex flex-wrap gap-1">
                      {node.imports.map((imp, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px]">
                          {imp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {node.exports.length > 0 && (
                  <div>
                    <span className="text-[10px] text-muted-foreground mb-0.5 block">Exports:</span>
                    <div className="flex flex-wrap gap-1">
                      {node.exports.map((exp, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-green-50 border border-green-100 rounded text-[10px]">
                          {exp}
                        </span>
                      ))}
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
            <span>Import</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-green-500 border-t border-dashed border-green-500"></span>
            <span>Export</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-purple-500 border-t border-dotted border-purple-500"></span>
            <span>Both</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramEditor;
