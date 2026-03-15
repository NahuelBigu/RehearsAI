import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Node, Edge } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

export type Role = 'user' | 'ai';

export interface CustomNodeData extends Record<string, unknown> {
  role: Role;
  text: string;
  emotion?: string;
  emotionLabel?: string;
  perception?: string;
  isGhost?: boolean;
  isInterrupted?: boolean;
  timestamp: number;
}

export type SimulationNode = Node<CustomNodeData>;

interface SetupData {
  name: string;
  userName: string;
  relationship: string;
  objective: string;
  profile: string;
  difficulty?: 'Fácil' | 'Intermedio' | 'Difícil';
  userImageBase64: string | null;
  skipImageGeneration?: boolean;
}

export type Emotion = 'neutral' | 'happy' | 'angry' | 'impatient' | 'sad' | 'surprised';

interface SimulationContextType {
  setupData: SetupData;
  setSetupData: (data: SetupData) => void;
  aiAvatars: Record<string, string>;
  setAiAvatars: (avatars: Record<string, string>) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  nodes: SimulationNode[];
  edges: Edge[];
  currentNodeId: string | null;
  addNode: (role: Role, text: string, emotion?: string, perception?: string, isGhost?: boolean, parentId?: string, emotionLabel?: string) => string;
  markInterrupted: (nodeId: string) => void;
  rewindToNode: (nodeId: string) => void;
  getHistory: (nodeId: string) => { role: Role; text: string; perception?: string; emotionLabel?: string }[];
  updateNodeText: (nodeId: string, textChunk: string) => void;
  setNodeText: (nodeId: string, text: string) => void;
  updateNodeEmotion: (nodeId: string, emotion: string, emotionLabel?: string, perception?: string) => void;
  updateNodePerception: (nodeId: string, perception: string) => void;
  resetSimulation: () => void;
  selectGhostNode: (nodeId: string) => void;
  setCurrentNodeId: (id: string | null) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [setupData, setSetupData] = useState<SetupData>({
    name: '',
    userName: '',
    relationship: '',
    objective: '',
    profile: '',
    userImageBase64: null,
    skipImageGeneration: false,
  });
  const [aiAvatars, setAiAvatars] = useState<Record<string, string>>({});
  const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');
  
  const [nodes, setNodes] = useState<SimulationNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);

  const nodesRef = React.useRef<SimulationNode[]>([]);
  const edgesRef = React.useRef<Edge[]>([]);
  const currentNodeIdRef = React.useRef<string | null>(null);

  // Keep refs in sync with state for any external updates
  React.useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  React.useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  React.useEffect(() => {
    currentNodeIdRef.current = currentNodeId;
  }, [currentNodeId]);

  const addNode = (
    role: Role,
    text: string,
    emotion?: string,
    perception?: string,
    isGhost = false,
    parentId?: string,
    emotionLabel?: string
  ) => {
    const id = uuidv4();
    const currentNodes = nodesRef.current;
    let parent = parentId || currentNodeIdRef.current;
    
    if (isGhost && !parentId && parent) {
      // Ghost nodes should be siblings of the current AI node, so they share the same parent
      const parentEdge = edgesRef.current.find(e => e.target === parent);
      if (parentEdge) {
        parent = parentEdge.source;
      } else {
        // If there is no parent edge, it means the current node is a root node.
        // Therefore, its sibling (the ghost node) should also be a root node.
        parent = null;
      }
    }
    
    // Calculate position based on parent
    let x = 0;
    let y = 0;
    
    if (parent) {
      const parentNode = currentNodes.find(n => n.id === parent);
      if (parentNode) {
        if (isGhost) {
          // Find existing ghosts for this parent to offset horizontally
          const existingGhosts = currentNodes.filter(n => n.data.isGhost && edgesRef.current.some(e => e.source === parent && e.target === n.id));
          const offsetMultiplier = existingGhosts.length + 1;
          
          // Ghosts go to the right of the parent, but at the same height as the main AI response
          x = parentNode.position.x + (450 * offsetMultiplier);
          y = parentNode.position.y + 300;
        } else {
          // Main path goes directly down
          x = parentNode.position.x;
          y = parentNode.position.y + 300;
        }
      }
    } else if (currentNodes.length > 0) {
      // If there's no parent, it's a root node.
      if (isGhost) {
        // Find the original root node to place the ghost next to it
        const originalRoot = currentNodes.find(n => !edgesRef.current.some(e => e.target === n.id));
        if (originalRoot) {
          const existingRootGhosts = currentNodes.filter(n => n.data.isGhost && !edgesRef.current.some(e => e.target === n.id));
          const offsetMultiplier = existingRootGhosts.length + 1;
          x = originalRoot.position.x + (450 * offsetMultiplier);
          y = originalRoot.position.y;
        }
      } else {
        const lastMainNode = [...currentNodes].reverse().find(n => !n.data.isGhost);
        if (lastMainNode) {
          x = lastMainNode.position.x;
          y = lastMainNode.position.y + 300;
        }
      }
    }

    // Collision avoidance: if a node already exists near this position, shift it horizontally
    let finalX = x;
    let finalY = y;
    let collision = true;
    let attempts = 0;
    while (collision && attempts < 20) {
      collision = currentNodes.some(n => 
        Math.abs(n.position.y - finalY) < 150 && 
        Math.abs(n.position.x - finalX) < 350
      );
      if (collision) {
        finalX += 400;
        attempts++;
      }
    }

    const newNode: SimulationNode = {
      id,
      type: 'customNode',
      position: { x: finalX, y: finalY },
      data: {
        role,
        text,
        emotion,
        emotionLabel,
        perception,
        isGhost,
        timestamp: Date.now(),
      },
    };

    const newNodes = [...currentNodes, newNode];
    nodesRef.current = newNodes;
    setNodes(newNodes);

    if (parent) {
      const newEdge: Edge = {
        id: `e-${parent}-${id}`,
        source: parent,
        target: id,
        animated: true,
        style: { stroke: isGhost ? '#6366f1' : '#a1a1aa', strokeWidth: 2, opacity: isGhost ? 0.5 : 1 },
      };
      const newEdges = [...edgesRef.current, newEdge];
      edgesRef.current = newEdges;
      setEdges(newEdges);
    }

    if (!isGhost) {
      currentNodeIdRef.current = id;
      setCurrentNodeId(id);
    }

    return id;
  };

  const updateNodeText = (nodeId: string, textChunk: string) => {
    const currentNodes = nodesRef.current;
    const newNodes = currentNodes.map(n => 
      n.id === nodeId ? { ...n, data: { ...n.data, text: n.data.text + textChunk } } : n
    );
    nodesRef.current = newNodes;
    setNodes(newNodes);
  };

  const setNodeText = (nodeId: string, text: string) => {
    const currentNodes = nodesRef.current;
    const newNodes = currentNodes.map(n => 
      n.id === nodeId ? { ...n, data: { ...n.data, text } } : n
    );
    nodesRef.current = newNodes;
    setNodes(newNodes);
  };

  const updateNodeEmotion = (nodeId: string, emotion: string, emotionLabel?: string, perception?: string) => {
    const newNodes = nodesRef.current.map(n => 
      n.id === nodeId ? { 
        ...n, 
        data: { 
          ...n.data, 
          emotion, 
          emotionLabel: emotionLabel || n.data.emotionLabel,
          perception: perception || n.data.perception
        } 
      } : n
    );
    nodesRef.current = newNodes;
    setNodes(newNodes);
  };

  const updateNodePerception = (nodeId: string, perception: string) => {
    const newNodes = nodesRef.current.map(n => 
      n.id === nodeId ? { 
        ...n, 
        data: { 
          ...n.data, 
          perception
        } 
      } : n
    );
    nodesRef.current = newNodes;
    setNodes(newNodes);
  };

  const getHistory = (nodeId: string) => {
    const history: { role: Role; text: string; perception?: string; emotionLabel?: string }[] = [];
    let currentId: string | null = nodeId;

    while (currentId) {
      const node = nodesRef.current.find(n => n.id === currentId);
      if (!node) break;
      history.unshift({ 
        role: node.data.role, 
        text: node.data.text,
        perception: node.data.perception,
        emotionLabel: node.data.emotionLabel
      });
      
      // Find parent edge
      const edge = edgesRef.current.find(e => e.target === currentId);
      currentId = edge ? edge.source : null;
    }

    return history;
  };

  const markInterrupted = (nodeId: string) => {
    const newNodes = nodesRef.current.map(n => 
      n.id === nodeId ? { ...n, data: { ...n.data, isInterrupted: true } } : n
    );
    nodesRef.current = newNodes;
    setNodes(newNodes);
  };

  const rewindToNode = React.useCallback((nodeId: string) => {
    const targetEdge = edgesRef.current.find(e => e.target === nodeId);
    const parentId = targetEdge ? targetEdge.source : null;
    
    if (!parentId) return; // Cannot rewind root

    // Calculate path from current node up to parentId for animation
    const path: string[] = [];
    let curr = currentNodeIdRef.current;
    
    while (curr && curr !== parentId) {
      path.push(curr);
      const edge = edgesRef.current.find(e => e.target === curr);
      curr = edge ? edge.source : null;
      if (path.length > 100) break; // safety
    }
    
    if (curr === parentId) {
      path.push(parentId);
    } else {
      // Fallback if not on same branch
      path.length = 0;
      if (currentNodeIdRef.current) path.push(currentNodeIdRef.current);
      path.push(parentId);
    }

    window.dispatchEvent(new CustomEvent('simulation:rewind', { detail: { path } }));
  }, []);

  const selectGhostNode = React.useCallback((nodeId: string) => {
    const newNodes = nodesRef.current.map(n => {
      if (n.id === nodeId) {
        return { ...n, data: { ...n.data, isGhost: false } };
      }
      return n;
    });
    
    const newEdges = edgesRef.current.map(e => {
      if (e.target === nodeId) {
        return { ...e, style: { stroke: '#a1a1aa', strokeWidth: 2, opacity: 1 } };
      }
      return e;
    });

    nodesRef.current = newNodes;
    edgesRef.current = newEdges;
    setNodes(newNodes);
    setEdges(newEdges);
    
    currentNodeIdRef.current = nodeId;
    setCurrentNodeId(nodeId);
  }, []);

  const resetSimulation = () => {
    nodesRef.current = [];
    edgesRef.current = [];
    currentNodeIdRef.current = null;
    setNodes([]);
    setEdges([]);
    setCurrentNodeId(null);
  };

  return (
    <SimulationContext.Provider value={{
      setupData,
      setSetupData,
      aiAvatars,
      setAiAvatars,
      selectedVoice,
      setSelectedVoice,
      nodes,
      edges,
      currentNodeId,
      addNode,
      updateNodeText,
      setNodeText,
      updateNodeEmotion,
      updateNodePerception,
      getHistory,
      markInterrupted,
      rewindToNode,
      resetSimulation,
      selectGhostNode,
      setCurrentNodeId,
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
