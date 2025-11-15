// utils.js - Data conversion utilities with position persistence support

export const DEFAULT_NODE_DATA = {
  id: "general_tools",
  title: "general_tools",
  prompt:
    "You are in the general Tools state.\nUse ONLY the available functions shown to you to fulfill the user's request.\nAfter a tool call returns, summarize briefly. If the topic changes, call the router again.",
  functions: [],
  respond_immediately: true,
};

export function createDefaultNode(id, x = 100, y = 100) {
  return {
    id: `reactflow_${id}`,
    type: "toolNode",
    position: { x, y },
    data: {
      ...DEFAULT_NODE_DATA,
      id,
      title: id,
    },
  };
}

/**
 * Convert backend flow format to ReactFlow format WITH position restoration
 * @param {Object} currentFlow - Flow from backend (your existing schema)
 * @param {Object} savedPositions - Position map from localStorage { nodeId: {x, y} }
 * @returns {Object} { nodes, edges } for ReactFlow
 */
export function convertToReactFlow(currentFlow, savedPositions = {}) {
  const nodes = [];
  const edges = [];

  if (!currentFlow || !Array.isArray(currentFlow.nodes)) {
    return { nodes, edges };
  }

  currentFlow.nodes.forEach((node, index) => {
    const nodeId = node.name || node.id;
    
    // ✅ CRITICAL: Try to restore saved position, fallback to calculated position
    const savedPos = savedPositions[nodeId];
    const position = savedPos 
      ? { x: savedPos.x, y: savedPos.y }
      : {
          x: 30 + (index % 3) * 160,
          y: 30 + Math.floor(index / 3) * 130,
        };

    const reactFlowNode = {
      id: `reactflow_${nodeId}`,
      type: "toolNode",
      position: position,
      data: {
        id: nodeId,
        title: node.title || nodeId,
        prompt:
          extractPromptFromTaskMessages(node.task_messages) ||
          DEFAULT_NODE_DATA.prompt,
        functions: node.functions || [],
        respond_immediately: node.respond_immediately !== false,
      },
    };
    nodes.push(reactFlowNode);
  });

  if (Array.isArray(currentFlow.edges)) {
    currentFlow.edges.forEach((edge, index) => {
      const reactFlowEdge = {
        id: edge.id || `edge_${index}`,
        source: `reactflow_${edge.source}`,
        target: `reactflow_${edge.target}`,
        type: "default",
        data: {
          // Preserve condition from DB (for the edge condition editor)
          condition: edge.condition || null,
        },
      };
      edges.push(reactFlowEdge);
    });
  }

  return { nodes, edges };
}

/**
 * Convert ReactFlow format back to backend format
 * NOTE: Positions are NOT included in the flow schema (stored separately in localStorage)
 */
export function convertFromReactFlow(nodes, edges, initialNodeId) {
  const currentNodes = [];
  const currentEdges = [];

  nodes.forEach((node) => {
    if (node.data) {
      const currentNode = {
        name: node.data.id,
        title: node.data.title,
        task_messages: [
          {
            role: "system",
            content: node.data.prompt || DEFAULT_NODE_DATA.prompt,
          },
        ],
        functions: node.data.functions || [],
        respond_immediately: node.data.respond_immediately !== false,
        meta: {},
        // ✅ NO position data included - keeps your schema clean
      };
      currentNodes.push(currentNode);
    }
  });

  edges.forEach((edge, index) => {
    const currentEdge = {
      id: edge.id || `edge_${index}`,
      source: edge.source.replace("reactflow_", ""),
      target: edge.target.replace("reactflow_", ""),
    };
    // Persist condition if set via the edge click pop-up
    if (edge.data && edge.data.condition) {
      currentEdge.condition = edge.data.condition;
    }
    currentEdges.push(currentEdge);
  });

  return {
    initial:
      initialNodeId?.replace("reactflow_", "") ||
      currentNodes[0]?.name ||
      "general_tools",
    nodes: currentNodes,
    edges: currentEdges,
  };
}

function extractPromptFromTaskMessages(taskMessages) {
  if (!Array.isArray(taskMessages)) return null;
  const systemMessage = taskMessages.find((msg) => msg.role === "system");
  return systemMessage?.content || null;
}

export function generateNodeId(existingNodes, baseName = "node") {
  let counter = 1;
  let newId = `${baseName}_${counter}`;

  while (existingNodes.some((node) => node.data?.id === newId)) {
    counter++;
    newId = `${baseName}_${counter}`;
  }

  return newId;
}

// ============================================================================
// POSITION STORAGE UTILITY
// ============================================================================

const POSITION_STORAGE_KEY = 'flow_node_positions';

export const PositionStorage = {
  /**
   * Save node positions to localStorage
   * Format: { assistantId: { nodeId: { x, y } } }
   */
  savePositions(assistantId, nodes) {
    try {
      const allPositions = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || '{}');
      
      // Create position map for current flow
      const positions = {};
      nodes.forEach(node => {
        if (node.data?.id) {
          positions[node.data.id] = {
            x: Math.round(node.position.x),
            y: Math.round(node.position.y)
          };
        }
      });
      
      // Store under assistant ID
      allPositions[assistantId] = positions;
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(allPositions));
      
      console.log('💾 Positions saved:', Object.keys(positions).length, 'nodes');
    } catch (e) {
      console.error('Failed to save positions:', e);
    }
  },

  /**
   * Load node positions from localStorage
   */
  loadPositions(assistantId) {
    try {
      const allPositions = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || '{}');
      const positions = allPositions[assistantId] || {};
      
      if (Object.keys(positions).length > 0) {
        console.log('📍 Positions loaded:', Object.keys(positions).length, 'nodes');
      }
      
      return positions;
    } catch (e) {
      console.error('Failed to load positions:', e);
      return {};
    }
  },

  /**
   * Clear positions for specific assistant
   */
  clearPositions(assistantId) {
    try {
      const allPositions = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || '{}');
      delete allPositions[assistantId];
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(allPositions));
      console.log('🗑️ Positions cleared for:', assistantId);
    } catch (e) {
      console.error('Failed to clear positions:', e);
    }
  },

  /**
   * Clear all positions (for debugging)
   */
  clearAll() {
    try {
      localStorage.removeItem(POSITION_STORAGE_KEY);
      console.log('🗑️ All positions cleared');
    } catch (e) {
      console.error('Failed to clear all positions:', e);
    }
  }
};