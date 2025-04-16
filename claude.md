Okay, let's lay out a detailed step-by-step plan to implement the "Import Mermaid to Editable beaUX Diagram" feature. This involves creating a conversion mechanism and integrating it into the existing `DiagramEditor` structure.

**Assumptions:**

- You have the `beaUX` project structure as analyzed previously.
- You want to keep the interactive `DiagramEditor` component largely intact but add Mermaid import functionality.
- You have `npm`/`yarn` set up.
- We'll focus on Mermaid `graph TD` / `graph LR` (flowcharts) initially, as they map best.

**Libraries Needed:**

- `mermaid`: For parsing.
- `@dagrejs/dagre`: For layout calculation.
- `react-zoom-pan-pinch`: (Already seems like you might have similar logic, but this is a good library if you need robust zoom/pan).
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`: For unit testing.

---

**Phase 0: Setup & Dependencies**

1.  **Install Dependencies:**

    ```bash
    npm install mermaid @dagrejs/dagre react-zoom-pan-pinch
    npm install @types/dagre vitest @testing-library/react @testing-library/jest-dom happy-dom --save-dev
    ```

    _(Note: `happy-dom` provides a browser-like environment for Vitest)_

2.  **Configure Vitest:** Create `vitest.config.ts` (if you don't have one):

    ```typescript
    // vitest.config.ts
    import { defineConfig } from "vitest/config";
    import react from "@vitejs/plugin-react-swc";
    import path from "path";

    export default defineConfig({
      plugins: [react()],
      test: {
        globals: true,
        environment: "happy-dom", // Use happy-dom
        setupFiles: "./src/setupTests.ts", // Optional setup file
        coverage: {
          reporter: ["text", "json", "html"],
        },
      },
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      },
    });
    ```

    _(Create `src/setupTests.ts` if needed, e.g., for global mocks or imports like `@testing-library/jest-dom/vitest`)_

3.  **Define Types:** Ensure you have clear types for your diagram state.

    ```typescript
    // src/types.ts (or ensure DiagramEditor exports these)
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
      // Add width/height if DiagramEditor needs them explicitly,
      // otherwise, they might be implicit in the styling/rendering
      width?: number;
      height?: number;
    }

    export interface Connection {
      id: string;
      sourceId: string;
      targetId: string;
      label: string;
      // Add points if DiagramEditor uses them for complex rendering,
      // otherwise, source/target might be enough for simple lines
      points?: Position[];
    }

    // Type for the layout engine output (simplified)
    export interface DagreNode {
      id: string; // Custom addition for easier mapping
      label: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }

    export interface DagreEdge {
      id: string; // Custom addition for easier mapping
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
    ```

**Phase 1: Core Conversion Logic (`useMermaidToBeaUX` Hook)**

1.  **Create Hook File:** `src/hooks/useMermaidToBeaUX.ts`
2.  **Implement the Hook:**

    ```typescript
    // src/hooks/useMermaidToBeaUX.ts
    import { useState, useCallback } from "react";
    import dagre from "@dagrejs/dagre";
    import mermaid from "mermaid";
    import {
      ComponentNode,
      Connection,
      NodeType,
      Position,
      DagreNode,
      DagreEdge,
      ProcessedLayout,
    } from "../types";

    // --- Constants ---
    const DEFAULT_NODE_WIDTH = 180; // Adjust as needed for beaUX node size
    const DEFAULT_NODE_HEIGHT = 90; // Adjust as needed
    const NODE_SEP = 80; // Dagre layout spacing
    const RANK_SEP = 80; // Dagre layout spacing
    const PADDING = 50; // Padding for Dagre graph bounds

    // --- Mermaid Initialization ---
    let mermaidInitialized = false;
    const initializeMermaid = async () => {
      if (mermaidInitialized) return;
      try {
        // Configure Mermaid - loose security needed for dynamic parsing in browser
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          // Optionally configure theme variables if needed,
          // but we mainly need the parser.
          // theme: 'base', // or 'default', 'dark', etc.
          // themeVariables: { ... }
        });
        // Attempt a dummy parse to ensure it's ready
        await mermaid.mermaidAPI.getDiagramFromText("graph TD; A;");
        mermaidInitialized = true;
        console.log("Mermaid initialized successfully.");
      } catch (e) {
        console.error("Failed to initialize Mermaid:", e);
        mermaidInitialized = false; // Reset on failure
        throw new Error("Mermaid library failed to initialize.");
      }
    };

    // --- Helper Mapping Functions ---
    const mapMermaidNodeToType = (nodeLabel: string | undefined): NodeType => {
      // Basic heuristic example (customize as needed)
      const lowerLabel = (nodeLabel || "").toLowerCase();
      if (lowerLabel.includes("page") || lowerLabel.includes("screen"))
        return "page";
      if (lowerLabel.startsWith("use")) return "hook";
      if (lowerLabel.includes("util") || lowerLabel.includes("helper"))
        return "util";
      if (lowerLabel.includes("note")) return "notes";
      return "component"; // Default
    };

    const getNodeColor = (type: NodeType): string => {
      const colors: Record<NodeType, string> = {
        component: "#3b82f6", // blue
        page: "#10b981", // green
        hook: "#8b5cf6", // purple
        util: "#f59e0b", // amber
        notes: "#ec4899", // pink
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
            await initializeMermaid(); // Ensure Mermaid is ready

            // 1. Parse Mermaid code
            const diagram = await mermaid.mermaidAPI.getDiagramFromText(
              mermaidCode
            );
            // Note: Accessing 'db' is internal API, might break in future Mermaid versions.
            const db = diagram.db;
            if (!db || !db.getVertices || !db.getEdges) {
              throw new Error(
                "Could not access parsed diagram data. Mermaid version compatibility issue?"
              );
            }
            const vertices = db.getVertices();
            const mermaidEdges = db.getEdges();

            if (
              Object.keys(vertices).length === 0 &&
              mermaidEdges.length === 0
            ) {
              return {
                nodes: [],
                edges: [],
                error: "Mermaid diagram appears empty or could not be parsed.",
              };
            }

            // 2. Prepare Dagre Graph
            const g = new dagre.graphlib.Graph({ compound: false }); // Keep compound false for simpler flowcharts
            g.setGraph({
              rankdir: "TB", // Top-to-bottom is common
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
              // edgeObj is {v: sourceId, w: targetId, name?: string}
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
              err.message || err.str || "Failed to process Mermaid diagram.";
            setProcessedLayout(null);
            return { nodes: [], edges: [], error: errorMsg };
          }
        },
        []
      ); // useCallback to memoize the function

      return { processMermaid }; // Only expose the processing function
    };

    export default useMermaidToBeaUX;

    // --- BeaUX Conversion Function (can be separate utility or part of hook return) ---
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
          isCodeCollapsed: true,
          width: n.width, // Store dimensions if needed by beaUX rendering
          height: n.height,
        };
      });

      const beaUXConnections: Connection[] = layout.edges.map((e) => ({
        id: e.id, // Use the generated unique ID
        sourceId: e.sourceId,
        targetId: e.targetId,
        label: e.label || "",
        points: e.points, // Pass points if beaUX uses them
      }));

      return { nodes: beaUXNodes, connections: beaUXConnections };
    };
    ```

**Phase 2: UI Integration**

1.  **Create Modal Component:** `src/components/MermaidImportModal.tsx`

    ```typescript
    // src/components/MermaidImportModal.tsx
    import React, { useState } from "react";
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogFooter,
      DialogClose,
    } from "@/components/ui/dialog";
    import { Button } from "@/components/ui/button";
    import { Textarea } from "@/components/ui/textarea";
    import { AlertCircle, CheckCircle } from "lucide-react";

    interface MermaidImportModalProps {
      isOpen: boolean;
      onClose: () => void;
      onImport: (mermaidCode: string) => Promise<{ error: string | null }>; // Returns error status
    }

    const MermaidImportModal: React.FC<MermaidImportModalProps> = ({
      isOpen,
      onClose,
      onImport,
    }) => {
      const [mermaidCode, setMermaidCode] = useState("");
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [success, setSuccess] = useState(false);

      const handleImportClick = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(false);
        const result = await onImport(mermaidCode);
        setIsLoading(false);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(true);
          // Optionally close modal after a short delay on success
          setTimeout(() => {
            handleClose(); // Close after success
          }, 1500);
        }
      };

      const handleClose = () => {
        // Reset state when closing
        setMermaidCode("");
        setError(null);
        setIsLoading(false);
        setSuccess(false);
        onClose();
      };

      return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Import from Mermaid</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste your Mermaid flowchart syntax (e.g., `graph TD;
                A--&gt;B;`) below. The diagram will be laid out automatically
                and added to your canvas for editing.
              </p>
              <Textarea
                value={mermaidCode}
                onChange={(e) => setMermaidCode(e.target.value)}
                placeholder="graph TD&#10;    A[Start] --&gt; B{Decision};&#10;    B --&gt;|Yes| C[Process 1];&#10;    B --&gt;|No| D[Process 2];&#10;    C --&gt; E[End];&#10;    D --&gt; E;"
                className="min-h-[200px] font-mono text-xs"
                disabled={isLoading || success}
              />
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Import successful! Closing modal...</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleImportClick}
                disabled={!mermaidCode.trim() || isLoading || success}
              >
                {isLoading
                  ? "Importing..."
                  : success
                  ? "Success!"
                  : "Import Diagram"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    export default MermaidImportModal;
    ```

2.  **Add Trigger in Parent Component (e.g., `src/pages/Home.tsx` or where `DiagramEditor` lives):**

    ```typescript
    // src/pages/Home.tsx (or similar parent)
    import React, { useState } from "react";
    import DiagramEditor /* import state setters or context */ from "../components/DiagramEditor";
    import MermaidImportModal from "../components/MermaidImportModal";
    import useMermaidToBeaUX, {
      convertLayoutToBeaUXState,
    } from "../hooks/useMermaidToBeaUX";
    import { Button } from "@/components/ui/button";
    import { FileInput } from "lucide-react"; // Example icon
    import { toast } from "sonner";
    import { ComponentNode, Connection } from "../types"; // Ensure types are imported

    const Home: React.FC = () => {
      // Assume DiagramEditor's state is managed here or via context/zustand
      const [nodes, setNodes] = useState<ComponentNode[]>([]);
      const [connections, setConnections] = useState<Connection[]>([]);
      // Add state for history if managed here
      const [history, setHistory] = useState<
        { nodes: ComponentNode[]; connections: Connection[] }[]
      >([]);
      const [historyIndex, setHistoryIndex] = useState(-1);

      const [isImportModalOpen, setIsImportModalOpen] = useState(false);
      const { processMermaid } = useMermaidToBeaUX();

      // Function to update diagram state and history
      const updateDiagramState = (
        newNodes: ComponentNode[],
        newConnections: Connection[]
      ) => {
        setNodes(newNodes);
        setConnections(newConnections);

        // Reset history with the imported state as the first entry
        const initialState = { nodes: newNodes, connections: newConnections };
        setHistory([initialState]);
        setHistoryIndex(0);
        console.log("Diagram state updated and history reset.", initialState);
        toast.success("Diagram imported and ready for editing!");
      };

      const handleImport = async (
        mermaidCode: string
      ): Promise<{ error: string | null }> => {
        const layoutResult = await processMermaid(mermaidCode);
        if (layoutResult.error) {
          toast.error(`Import Failed: ${layoutResult.error}`);
          return { error: layoutResult.error };
        } else if (layoutResult.nodes.length === 0) {
          const errMsg =
            "Import Warning: No nodes found in the Mermaid diagram.";
          toast.warning(errMsg);
          return { error: errMsg }; // Treat as error for modal UI
        } else {
          const { nodes: beaUXNodes, connections: beaUXConnections } =
            convertLayoutToBeaUXState(layoutResult);
          updateDiagramState(beaUXNodes, beaUXConnections); // Update state + history
          return { error: null };
        }
      };

      // --- Pass state and setters to DiagramEditor ---
      // This depends on how DiagramEditor is structured. Example using props:
      // const diagramEditorProps = {
      //     nodes, setNodes,
      //     connections, setConnections,
      //     history, setHistory,
      //     historyIndex, setHistoryIndex,
      //     saveToHistory: (n: ComponentNode[], c: Connection[]) => { /* impl */ },
      //     // ... other DiagramEditor props
      // };

      return (
        <div className="min-h-screen flex flex-col">
          {/* Simplified Header */}
          <header className="p-4 border-b">
            <h1 className="text-xl font-bold">beaUX - Mermaid Enhanced</h1>
          </header>

          <main className="flex-1 flex flex-col">
            {/* Add the import button to your UI, perhaps near DiagramEditor */}
            <div className="p-2 border-b flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
              >
                <FileInput className="h-3.5 w-3.5 mr-1.5" />
                Import Mermaid
              </Button>
            </div>

            {/* Render Diagram Editor - Pass necessary state and update functions */}
            <div className="flex-1 relative">
              {/* Pass props or use context to provide state to DiagramEditor */}
              <DiagramEditor
                // Pass the state and functions needed by DiagramEditor
                nodes={nodes}
                setNodes={setNodes} // Or use context dispatcher
                connections={connections}
                setConnections={setConnections} // Or use context dispatcher
                history={history}
                setHistory={setHistory} // Or use context dispatcher
                historyIndex={historyIndex}
                setHistoryIndex={setHistoryIndex} // Or use context dispatcher
                // Ensure DiagramEditor has a way to save to history
                // (e.g., pass a function or use context)
              />
            </div>
          </main>

          <MermaidImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleImport}
          />
          {/* Simplified Footer */}
        </div>
      );
    };

    export default Home;
    ```

**Phase 3: Updating `DiagramEditor`**

1.  **State Management:** Refactor `DiagramEditor` if necessary to accept `nodes`, `connections`, etc., as props, or use a shared state mechanism (Context, Zustand, Redux) that the parent (`Home`) can also access to update the state after import. The example above assumes props (`nodes`, `setNodes`, etc.).
2.  **History:** Ensure the `saveToHistory` function (or equivalent logic) inside `DiagramEditor` is callable from the parent _after_ the import, or that the parent directly manages the history state and passes it down, as shown in the `Home` component example. The key is to **reset the history** with the imported diagram as the first state.

**Phase 4: Unit Testing (`useMermaidToBeaUX` Hook)**

1.  **Create Test File:** `src/hooks/useMermaidToBeaUX.test.ts`
2.  **Write Tests:**

    ```typescript
    // src/hooks/useMermaidToBeaUX.test.ts
    import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
    import { renderHook, act } from "@testing-library/react";
    import useMermaidToBeaUX from "./useMermaidToBeaUX"; // Adjust path
    import mermaid from "mermaid";
    import dagre from "@dagrejs/dagre";
    import { Position } from "../types"; // Adjust path

    // --- Mocks ---
    // Mock Mermaid API (adjust structure based on actual usage)
    const mockDb = {
      getVertices: vi.fn(),
      getEdges: vi.fn(),
    };
    const mockDiagram = { db: mockDb };
    vi.mock("mermaid", () => ({
      default: {
        initialize: vi.fn(),
        mermaidAPI: {
          getDiagramFromText: vi.fn(() => Promise.resolve(mockDiagram)),
          // Potentially mock other API parts if used
        },
      },
    }));

    // Mock Dagre layout (more detailed mocks might be needed for complex scenarios)
    const mockGraph = {
      setGraph: vi.fn(),
      setNode: vi.fn(),
      setEdge: vi.fn(),
      setDefaultEdgeLabel: vi.fn(),
      nodes: vi.fn(() => []), // Default empty
      edges: vi.fn(() => []), // Default empty
      node: vi.fn((id) => undefined), // Default undefined
      edge: vi.fn((edgeObj) => undefined), // Default undefined
      graph: vi.fn(() => ({ width: 500, height: 400 })), // Mock graph dimensions
    };
    vi.mock("@dagrejs/dagre", () => ({
      default: {
        graphlib: {
          Graph: vi.fn(() => mockGraph),
        },
        layout: vi.fn((g) => {
          // Simulate layout adding x, y to nodes and points to edges
          const nodeIds = g.nodes();
          nodeIds.forEach((id: string, i: number) => {
            const mockNodeData = {
              id,
              label: `Node ${id}`,
              x: 100 * (i + 1),
              y: 150,
              width: 180,
              height: 90,
            };
            g.node(id, mockNodeData); // Simulate setting layout data
          });
          const edgeObjs = g.edges();
          edgeObjs.forEach((edgeObj: any, i: number) => {
            const mockEdgeData = {
              points: [
                { x: 100, y: 150 },
                { x: 200, y: 150 },
              ], // Mock points
              label: `Edge ${i}`,
            };
            g.edge(edgeObj, mockEdgeData); // Simulate setting layout data
          });
        }),
      },
    }));

    // Reset mocks before each test
    beforeEach(() => {
      vi.clearAllMocks();
      // Reset mock return values for a clean state
      mockDb.getVertices.mockReturnValue({});
      mockDb.getEdges.mockReturnValue([]);
      mockGraph.nodes.mockReturnValue([]);
      mockGraph.edges.mockReturnValue([]);
      mockGraph.node.mockImplementation((id) => undefined);
      mockGraph.edge.mockImplementation((edgeObj) => undefined);
      // Reset mermaid init flag if needed for multiple hook renders
      // (This might require exporting/mocking the flag itself, complex setup)
    });

    // --- Test Suite ---
    describe("useMermaidToBeaUX", () => {
      it("should return error for empty input", async () => {
        const { result } = renderHook(() => useMermaidToBeaUX());
        let processedLayout: any;
        await act(async () => {
          processedLayout = await result.current.processMermaid("");
        });
        expect(processedLayout.error).toBe("Mermaid input is empty.");
        expect(processedLayout.nodes).toEqual([]);
        expect(processedLayout.edges).toEqual([]);
      });

      it("should handle Mermaid initialization errors", async () => {
        // Force mermaid init to fail
        (mermaid.initialize as any).mockImplementationOnce(() => {
          throw new Error("Init Failed");
        });

        const { result } = renderHook(() => useMermaidToBeaUX());
        let processedLayout: any;
        await act(async () => {
          processedLayout = await result.current.processMermaid("graph TD; A;");
        });

        expect(processedLayout.error).toContain(
          "Mermaid library failed to initialize"
        );
      });

      it("should process a simple flowchart", async () => {
        // Setup Mocks for this specific test
        mockDb.getVertices.mockReturnValue({
          A: { id: "A", text: "Start" },
          B: { id: "B", text: "End" },
        });
        mockDb.getEdges.mockReturnValue([
          { start: "A", end: "B", text: "Link" },
        ]);
        // Mock Dagre node/edge return values AFTER layout
        mockGraph.nodes.mockReturnValue(["A", "B"]);
        mockGraph.edges.mockReturnValue([{ v: "A", w: "B" }]); // Dagre edge object format
        mockGraph.node.mockImplementation((id) => {
          if (id === "A")
            return {
              id: "A",
              label: "Start",
              x: 100,
              y: 50,
              width: 180,
              height: 90,
            };
          if (id === "B")
            return {
              id: "B",
              label: "End",
              x: 100,
              y: 250,
              width: 180,
              height: 90,
            };
          return undefined;
        });
        mockGraph.edge.mockImplementation((edgeObj) => {
          if (edgeObj.v === "A" && edgeObj.w === "B")
            return {
              points: [
                { x: 100, y: 95 },
                { x: 100, y: 205 },
              ], // Example points
              label: "Link",
            };
          return undefined;
        });

        const { result } = renderHook(() => useMermaidToBeaUX());
        let processedLayout: any;
        await act(async () => {
          processedLayout = await result.current.processMermaid(
            "graph TD; A[Start]-->|Link|B[End];"
          );
        });

        expect(processedLayout.error).toBeNull();
        expect(processedLayout.nodes).toHaveLength(2);
        expect(processedLayout.edges).toHaveLength(1);

        // Check node data (center coords from Dagre)
        expect(processedLayout.nodes[0]).toEqual(
          expect.objectContaining({ id: "A", label: "Start", x: 100, y: 50 })
        );
        expect(processedLayout.nodes[1]).toEqual(
          expect.objectContaining({ id: "B", label: "End", x: 100, y: 250 })
        );

        // Check edge data
        expect(processedLayout.edges[0]).toEqual(
          expect.objectContaining({
            sourceId: "A",
            targetId: "B",
            label: "Link",
            points: expect.any(Array), // Check points exist
          })
        );
        expect(processedLayout.edges[0].id).toMatch(/^e0-A-B/); // Check generated ID format
      });

      it("should handle Mermaid parsing errors", async () => {
        // Simulate Mermaid API throwing an error
        (mermaid.mermaidAPI.getDiagramFromText as any).mockImplementationOnce(
          () => {
            throw new Error("Parse Error");
          }
        );

        const { result } = renderHook(() => useMermaidToBeaUX());
        let processedLayout: any;
        await act(async () => {
          processedLayout = await result.current.processMermaid(
            "graph TD; A--"
          ); // Invalid syntax
        });

        expect(processedLayout.error).toBe("Parse Error");
        expect(processedLayout.nodes).toEqual([]);
        expect(processedLayout.edges).toEqual([]);
      });

      // Add more tests: different graph structures, edge cases, nodes without labels, etc.
    });

    // Test the standalone conversion function
    describe("convertLayoutToBeaUXState", () => {
      const { convertLayoutToBeaUXState } = await import("./useMermaidToBeaUX"); // Import the converter

      it("should convert layout data to beaUX state correctly", () => {
        const layout: ProcessedLayout = {
          nodes: [
            {
              id: "N1",
              label: "Node 1",
              x: 100,
              y: 50,
              width: 180,
              height: 90,
            },
          ],
          edges: [
            {
              id: "e1",
              sourceId: "N1",
              targetId: "N1",
              points: [{ x: 0, y: 0 }],
              label: "Self",
            },
          ], // Example edge
          error: null,
        };
        const { nodes: beaUXNodes, connections: beaUXConnections } =
          convertLayoutToBeaUXState(layout);

        expect(beaUXNodes).toHaveLength(1);
        expect(beaUXNodes[0].id).toBe("N1");
        expect(beaUXNodes[0].name).toBe("Node 1");
        // Check position conversion (center to top-left)
        expect(beaUXNodes[0].position.x).toBe(100 - 180 / 2); // 10
        expect(beaUXNodes[0].position.y).toBe(50 - 90 / 2); // 5
        expect(beaUXNodes[0].type).toBe("component"); // Default mapping
        expect(beaUXNodes[0].color).toBeDefined();
        expect(beaUXNodes[0].notes).toBe("");
        expect(beaUXNodes[0].code).toBe("");

        expect(beaUXConnections).toHaveLength(1);
        expect(beaUXConnections[0].id).toBe("e1");
        // ... check other connection properties
      });
    });
    ```

**Phase 5: Refinements**

- **Loading Indicators:** Show spinners in the modal and potentially overlay the `DiagramEditor` during `processMermaid`.
- **Error Display:** Make error messages in the modal more user-friendly.
- **Fit to View:** After import, calculate the bounding box of the imported nodes and use `react-zoom-pan-pinch`'s API (`zoomToElement` or manual `setTransform`) to center and zoom appropriately.
- **Mermaid Configuration:** Allow users to potentially select `rankdir` (TB, LR) in the import modal.
- **Node Size:** Investigate if Mermaid parsing provides any hints about node size based on text length, or allow configuration. For now, fixed size is simplest.
- **Styling:** Style the imported nodes/edges to look consistent with manually created `beaUX` elements.

This detailed plan provides the necessary code structure and steps to integrate Mermaid import into your editable `DiagramEditor`. Remember to adapt the state management integration (`Phase 2`, `Phase 3`) based on how `DiagramEditor` currently handles its state.
