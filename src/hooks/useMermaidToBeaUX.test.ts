// Basic test file for useMermaidToBeaUX hook
import useMermaidToBeaUX, { convertLayoutToBeaUXState, ProcessedLayout } from './useMermaidToBeaUX';

// This is a basic test file to validate the convertLayoutToBeaUXState function
// For complete testing, you would need to set up a test environment with Jest/Vitest
// that includes DOM support and proper mocking of the mermaid and dagre libraries

describe('convertLayoutToBeaUXState', () => {
  it('should convert layout data to beaUX state correctly', () => {
    // Mock layout data
    const mockLayout: ProcessedLayout = {
      nodes: [
        {
          id: 'node1',
          label: 'Component',
          x: 100,
          y: 50,
          width: 200,
          height: 80
        },
        {
          id: 'node2',
          label: 'Page',
          x: 400,
          y: 50,
          width: 200,
          height: 80
        },
        {
          id: 'node3',
          label: 'useHook',
          x: 100,
          y: 200,
          width: 200,
          height: 80
        }
      ],
      edges: [
        {
          id: 'edge1',
          sourceId: 'node1',
          targetId: 'node2',
          points: [{ x: 100, y: 50 }, { x: 400, y: 50 }],
          label: 'uses'
        },
        {
          id: 'edge2',
          sourceId: 'node1',
          targetId: 'node3',
          points: [{ x: 100, y: 50 }, { x: 100, y: 200 }],
          label: 'imports'
        }
      ],
      error: null
    };

    // Convert to beaUX state
    const { nodes, connections } = convertLayoutToBeaUXState(mockLayout);

    // Test nodes
    expect(nodes.length).toBe(3);
    
    // Check node 1
    expect(nodes[0].id).toBe('node1');
    expect(nodes[0].name).toBe('Component');
    expect(nodes[0].type).toBe('component');
    expect(nodes[0].position.x).toBe(0); // 100 - 200/2
    expect(nodes[0].position.y).toBe(10); // 50 - 80/2
    
    // Check node 2
    expect(nodes[1].id).toBe('node2');
    expect(nodes[1].name).toBe('Page');
    expect(nodes[1].type).toBe('page'); // Should map to page type
    
    // Check node 3
    expect(nodes[2].id).toBe('node3');
    expect(nodes[2].name).toBe('useHook');
    expect(nodes[2].type).toBe('hook'); // Should map to hook type
    
    // Test connections
    expect(connections.length).toBe(2);
    expect(connections[0].id).toBe('edge1');
    expect(connections[0].sourceId).toBe('node1');
    expect(connections[0].targetId).toBe('node2');
    expect(connections[0].label).toBe('uses');
    
    expect(connections[1].id).toBe('edge2');
    expect(connections[1].sourceId).toBe('node1');
    expect(connections[1].targetId).toBe('node3');
    expect(connections[1].label).toBe('imports');
  });
});