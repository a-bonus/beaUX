import { useState, useCallback } from "react";
import dagre from "@dagrejs/dagre";
import mermaid from "mermaid";

export interface Position {
  x: number;
  y: number;
}

export type NodeType = "component" | "page" | "hook" | "util" | "notes";

export interface ComponentNode {
  id: string;
  name: string;
  position: Position;
  color: string;
  type: NodeType;
  code: string;
  notes: string;
  isCodeCollapsed?: boolean;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
}

export interface DagreNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DagreEdge {
  id: string;
  sourceId: string;
  targetId: string;
  points: Position[];
  label?: string;
}

export interface ProcessedLayout {
  nodes: DagreNode[];
  edges: DagreEdge[];
  error: string | null;
}

// --- Constants ---
const DEFAULT_NODE_WIDTH = 200; // Match the DiagramEditor node size
const DEFAULT_NODE_HEIGHT = 80; // Match the DiagramEditor node size
const NODE_SEP = 80; // Dagre layout spacing
const RANK_SEP = 100; // Dagre layout spacing
const PADDING = 50; // Padding for Dagre graph bounds

// --- Helper Functions ---
const parseMermaidSyntax = (mermaidCode: string): { nodes: Record<string, {id: string, text: string}>, edges: any[] } => {
  // This is a simple parser for mermaid flowchart syntax
  // It handles the common patterns but is not a full parser
  const nodes: Record<string, {id: string, text: string}> = {};
  const edges: any[] = [];
  
  // Split into lines and process each line
  const lines = mermaidCode.trim().split('\n');
  let direction = "TD"; // Default direction
  
  for (let line of lines) {
    line = line.trim();
    
    // Check for direction definition
    if (line.startsWith("graph ")) {
      direction = line.substring(6).trim();
      continue;
    }
    
    // Skip comment lines
    if (line.startsWith('%')) continue;
    
    // Check for node definitions and connections
    if (line.includes('-->') || line.includes('---') || line.includes('==>') || line.includes('--x')) {
      // This line has a connection
      // Split on common connection indicators, preserving the delimiter
      const parts = line.split(/(-->|---|==>|--x)/);
      if (parts.length >= 3) {
        const sourceStr = parts[0].trim();
        const targetStr = parts[2].trim();
        const edgeType = parts[1].trim();
        
        // Parse source and target nodes
        const sourceId = extractNodeId(sourceStr);
        const targetId = extractNodeId(targetStr);
        
        // Add nodes if they don't exist
        if (!nodes[sourceId]) {
          nodes[sourceId] = { id: sourceId, text: extractNodeText(sourceStr) || sourceId };
        }
        
        if (!targetId) continue; // Skip if target is invalid
        
        if (!nodes[targetId]) {
          nodes[targetId] = { id: targetId, text: extractNodeText(targetStr) || targetId };
        }
        
        // Extract edge label if present
        let label = '';
        if (parts.length > 3 && parts[3].includes('|')) {
          // Pattern: source --> |label| target
          const labelMatch = parts[3].match(/\|(.*?)\|/);
          if (labelMatch) {
            label = labelMatch[1].trim();
          }
        }
        
        // Add the edge
        edges.push({
          start: sourceId,
          end: targetId,
          text: label,
          type: edgeType
        });
      }
    } else if (line.includes('[') && line.includes(']')) {
      // Standalone node definition, e.g., A[Node Label]
      const nodeMatch = line.match(/([A-Za-z0-9_]+)\[(.*?)\]/);
      if (nodeMatch) {
        const id = nodeMatch[1].trim();
        const text = nodeMatch[2].trim();
        nodes[id] = { id, text };
      }
    }
  }
  
  return { nodes, edges };
};

const extractNodeId = (nodeStr: string): string => {
  // Extract the node ID
  // Examples: 
  // A[Label] -> A
  // B -> B
  // C((Circle)) -> C
  const match = nodeStr.match(/^([A-Za-z0-9_]+)(?:\[|\(|\{|>|\[\/)/);
  if (match) return match[1];
  
  // If no brackets, the whole string might be the ID
  return nodeStr.trim();
};

const extractNodeText = (nodeStr: string): string | null => {
  // Extract text from different node shapes
  // A[Text] or A(Text) or A((Text)) or A>Text] or A{Text}
  const bracketMatch = nodeStr.match(/\[(.*?)\]|\((.*?)\)|\(\((.*?)\)\)|\>(.*?)\]|\{(.*?)\}/);
  if (bracketMatch) {
    // Return the first non-undefined group
    for (let i = 1; i < bracketMatch.length; i++) {
      if (bracketMatch[i] !== undefined) {
        return bracketMatch[i];
      }
    }
  }
  return null;
};

// --- Helper Mapping Functions ---
const mapMermaidNodeToType = (nodeLabel: string | undefined): NodeType => {
  // Basic heuristic example (customize as needed)
  const lowerLabel = (nodeLabel || "").toLowerCase();
  if (lowerLabel.includes("page") || lowerLabel.includes("screen"))
    return "page";
  if (lowerLabel.startsWith("use") || lowerLabel.includes("hook"))
    return "hook";
  if (lowerLabel.includes("util") || lowerLabel.includes("helper"))
    return "util";
  if (lowerLabel.includes("note"))
    return "notes";
  return "component"; // Default
};

const getNodeColor = (type: NodeType): string => {
  const colors: Record<NodeType, string> = {
    component: '#3b82f6', // blue
    page: '#10b981',      // green
    hook: '#8b5cf6',      // purple
    util: '#f59e0b',      // amber
    notes: '#ec4899'      // pink
  };
  return colors[type] || "#6366f1"; // Default (indigo)
};

// --- The Hook ---
const useMermaidToBeaUX = () => {
  const [processedLayout, setProcessedLayout] =
    useState<ProcessedLayout | null>(null);

  const processMermaid = useCallback(
    async (mermaidCode: string): Promise<ProcessedLayout> => {
      if (!mermaidCode.trim()) {
        return { nodes: [], edges: [], error: "Mermaid input is empty." };
      }

      try {
        // Use our custom parser instead of relying on mermaid library internals
        const { nodes: vertices, edges: mermaidEdges } = parseMermaidSyntax(mermaidCode);

        if (Object.keys(vertices).length === 0) {
          return {
            nodes: [],
            edges: [],
            error: "Mermaid diagram appears empty or could not be parsed.",
          };
        }

        // 2. Prepare Dagre Graph
        const g = new dagre.graphlib.Graph();
        g.setGraph({
          rankdir: mermaidCode.includes("graph TD") ? "TB" : 
                   mermaidCode.includes("graph LR") ? "LR" : "TB", // Detect direction
          nodesep: NODE_SEP,
          ranksep: RANK_SEP,
          marginx: PADDING,
          marginy: PADDING,
        });
        g.setDefaultEdgeLabel(() => ({}));

        // 3. Add Nodes to Dagre
        const nodeMap = new Map<
          string,
          { label: string; width: number; height: number }
        >();
        
        for (const id in vertices) {
          const vertex = vertices[id];
          const label = vertex.text || id;
          const nodeData = {
            label,
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
          };
          g.setNode(id, nodeData);
          nodeMap.set(id, nodeData);
        }

        // 4. Add Edges to Dagre
        const edgeMap = new Map<
          string,
          { sourceId: string; targetId: string; label?: string }
        >();
        
        mermaidEdges.forEach((edge: any, index: number) => {
          // Ensure source and target nodes exist in our map
          if (nodeMap.has(edge.start) && nodeMap.has(edge.end)) {
            const edgeId = `e${index}-${edge.start}-${edge.end}`; // Create a unique ID for Dagre edge lookup
            g.setEdge(edge.start, edge.end, { label: edge.text });
            edgeMap.set(edgeId, {
              sourceId: edge.start,
              targetId: edge.end,
              label: edge.text,
            });
          } else {
            console.warn(
              `Skipping edge due to missing node(s): ${edge.start} -> ${edge.end}`
            );
          }
        });

        // 5. Calculate Layout
        dagre.layout(g);

        // 6. Extract Layout Data into desired format
        const finalNodes: DagreNode[] = [];
        g.nodes().forEach((nodeId) => {
          const node = g.node(nodeId);
          if (node) {
            finalNodes.push({
              id: nodeId,
              label: node.label,
              x: node.x, // Dagre provides center coordinates
              y: node.y,
              width: node.width,
              height: node.height,
            });
          }
        });

        const finalEdges: DagreEdge[] = [];
        g.edges().forEach((edgeObj) => {
          const edge = g.edge(edgeObj); // Get edge details { points: [], label?, ... }
          if (edge) {
            // Find the original edge based on source/target to get the ID we created
            let originalEdgeId = "";
            for (const [id, data] of edgeMap.entries()) {
              if (
                data.sourceId === edgeObj.v &&
                data.targetId === edgeObj.w
              ) {
                originalEdgeId = id;
                break;
              }
            }
            if (originalEdgeId) {
              // Only add if we found the original edge
              finalEdges.push({
                id: originalEdgeId, // Use the ID we generated
                sourceId: edgeObj.v,
                targetId: edgeObj.w,
                points: edge.points, // Dagre provides points for edge path
                label: edge.label,
              });
            }
          }
        });

        const result = {
          nodes: finalNodes,
          edges: finalEdges,
          error: null,
        };
        setProcessedLayout(result); // Store result if needed internally
        return result;
      } catch (err: any) {
        console.error("Error processing Mermaid:", err);
        const errorMsg =
          err.message || "Failed to process Mermaid diagram.";
        setProcessedLayout(null);
        return { nodes: [], edges: [], error: errorMsg };
      }
    },
    []
  ); // useCallback to memoize the function

  return { processMermaid }; // Only expose the processing function
};

export default useMermaidToBeaUX;

// --- BeaUX Conversion Function ---
export const convertLayoutToBeaUXState = (
  layout: ProcessedLayout
): { nodes: ComponentNode[]; connections: Connection[] } => {
  const beaUXNodes: ComponentNode[] = layout.nodes.map((n) => {
    const type = mapMermaidNodeToType(n.label);
    return {
      id: n.id,
      name: n.label || n.id,
      // Convert Dagre's center (x,y) to beaUX's top-left (x,y)
      position: { x: n.x - n.width / 2, y: n.y - n.height / 2 },
      color: getNodeColor(type),
      type: type,
      code: "", // Initialize empty
      notes: "", // Initialize empty
      isCodeCollapsed: true
    };
  });

  const beaUXConnections: Connection[] = layout.edges.map((e) => ({
    id: e.id, // Use the generated unique ID
    sourceId: e.sourceId,
    targetId: e.targetId,
    label: e.label || "",
  }));

  return { nodes: beaUXNodes, connections: beaUXConnections };
};