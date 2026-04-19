import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import type { Connection, NodeChange, EdgeChange } from 'reactflow';
import { MarkerType } from 'reactflow';
import type { WorkflowNode, WorkflowEdge, SimulationLogEntry } from '../types';

// ─── State Shape ───────────────────────────────────────────────────────────────

interface WorkflowHistoryEntry {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowStore {
  // Canvas state
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];

  // Undo / Redo
  history: WorkflowHistoryEntry[];
  historyIndex: number;

  // Selection
  selectedNodeId: string | null;

  // Simulation
  isSimulating: boolean;
  simulationLogs: SimulationLogEntry[];
  simulationActiveNodeId: string | null;

  // Actions: canvas
  setNodes: (nodes: WorkflowNode[] | ((nds: WorkflowNode[]) => WorkflowNode[])) => void;
  setEdges: (edges: WorkflowEdge[] | ((eds: WorkflowEdge[]) => WorkflowEdge[])) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // Actions: nodes
  addNode: (node: WorkflowNode) => void;
  deleteNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<WorkflowNode['data']>) => void;
  selectNode: (id: string | null) => void;

  // Actions: history
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Actions: simulation
  startSimulation: () => void;
  stopSimulation: () => void;
  setSimulationData: (logs: SimulationLogEntry[], activeId: string | null) => void;

  // Actions: import / export
  importWorkflow: (json: string) => void;
}

// ─── Initial Nodes ─────────────────────────────────────────────────────────────

const INITIAL_NODES: WorkflowNode[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 80, y: 180 },
    data: {
      title: 'Workflow Start',
      description: 'Triggered on new employee hire',
      type: 'start',
      config: { event: 'employee.hired', metadata: [] },
      status: 'idle',
    },
  },
];

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: INITIAL_NODES,
  edges: [],
  history: [],
  historyIndex: -1,
  selectedNodeId: null,
  isSimulating: false,
  simulationLogs: [],
  simulationActiveNodeId: null,

  // ── Canvas ──────────────────────────────────────────────────────────────────

  setNodes: (nodes) => {
    const next = typeof nodes === 'function' ? nodes(get().nodes) : nodes;
    set({ nodes: next });
  },

  setEdges: (edges) => {
    const next = typeof edges === 'function' ? edges(get().edges) : edges;
    set({ edges: next });
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as WorkflowNode[] });
    const sel = changes.find((c) => c.type === 'select');
    if (sel && sel.type === 'select') {
      set({
        selectedNodeId: sel.selected
          ? sel.id
          : get().selectedNodeId === sel.id
          ? null
          : get().selectedNodeId,
      });
    }
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    const { nodes, edges } = get();
    const target = nodes.find((n) => n.id === connection.target);
    if (target?.data.type === 'start') return; // Cannot connect into start

    const newEdges = addEdge(
      {
        ...connection,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        style: { stroke: '#6366f1', strokeWidth: 2 },
      },
      edges
    );
    set({ edges: newEdges });
    get().saveHistory();
  },

  // ── Nodes ────────────────────────────────────────────────────────────────────

  addNode: (node) => {
    set((s) => ({ nodes: [...s.nodes, node] }));
    get().saveHistory();
  },

  deleteNode: (id) => {
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    }));
    get().saveHistory();
  },

  updateNodeData: (id, data) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  // ── History ──────────────────────────────────────────────────────────────────

  saveHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const trimmed = history.slice(0, historyIndex + 1);
    set({
      history: [...trimmed, { nodes: [...nodes], edges: [...edges] }],
      historyIndex: historyIndex + 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({
        nodes: [...prev.nodes],
        edges: [...prev.edges],
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        nodes: [...next.nodes],
        edges: [...next.edges],
        historyIndex: historyIndex + 1,
      });
    }
  },

  // ── Simulation ───────────────────────────────────────────────────────────────

  startSimulation: () =>
    set({ isSimulating: true, simulationLogs: [], simulationActiveNodeId: null }),

  stopSimulation: () =>
    set({ isSimulating: false, simulationActiveNodeId: null }),

  setSimulationData: (logs, activeId) =>
    set({ simulationLogs: logs, simulationActiveNodeId: activeId }),

  // ── Import / Export ──────────────────────────────────────────────────────────

  importWorkflow: (json) => {
    try {
      const data = JSON.parse(json);
      if (!data.nodes || !data.edges) throw new Error('Invalid format');
      set({ nodes: data.nodes, edges: data.edges, selectedNodeId: null });
      get().saveHistory();
    } catch {
      alert('Invalid Workflow JSON — please check the file and try again.');
    }
  },
}));
