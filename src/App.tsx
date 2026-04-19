import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
  BackgroundVariant,
  Panel,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { create } from 'zustand';
import {
  Play,
  Download,
  Upload,
  Undo2,
  Redo2,
  Layout,
  Plus,
  Trash2,
  Settings,
  ChevronRight,
  CirclePlay,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Clock,
  Zap,
  Mail,
  Slack,
  FileText,
  Database,
  Ticket,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import dagre from 'dagre';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Types & Interfaces ---

type NodeType = 'start' | 'task' | 'approval' | 'automation' | 'end';

interface NodeData {
  title: string;
  description: string;
  type: NodeType;
  config: any;
  status?: 'idle' | 'executing' | 'success' | 'warning' | 'error';
}

interface WorkflowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  history: { nodes: Node<NodeData>[][]; edges: Edge[][] };
  historyIndex: number;
  selectedNodeId: string | null;
  isSimulating: boolean;
  simulationLogs: any[];
  simulationActiveNodeId: string | null;
}

// --- Utility: Tailwind Merge ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Mock API Data ---

const automations = [
  { id: 'send_email', label: 'Send Email', icon: Mail, params: ['to', 'subject', 'body'] },
  { id: 'generate_doc', label: 'Generate Document', icon: FileText, params: ['template', 'output_path'] },
  { id: 'notify_slack', label: 'Notify Slack', icon: Slack, params: ['channel', 'message'] },
  { id: 'update_hris', label: 'Update HRIS Record', icon: Database, params: ['employee_id', 'field', 'value'] },
  { id: 'create_ticket', label: 'Create IT Ticket', icon: Ticket, params: ['title', 'priority'] },
];

// --- Zustand Store ---

interface GlobalState extends WorkflowState {
  setNodes: (nodes: Node<NodeData>[] | ((nds: Node<NodeData>[]) => Node<NodeData>[])) => void;
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  selectNode: (id: string | null) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  setSimulationData: (logs: any[], activeId: string | null) => void;
  importWorkflow: (json: string) => void;
}

const useStore = create<GlobalState>((set, get) => ({
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 100, y: 150 },
      data: { title: 'New Hire Onboarding', description: 'Triggered when a candidate accepts an offer', type: 'start', config: { metadata: [] } },
    },
  ],
  edges: [],
  history: { nodes: [], edges: [] },
  historyIndex: -1,
  selectedNodeId: null,
  isSimulating: false,
  simulationLogs: [],
  simulationActiveNodeId: null,

  setNodes: (nodes) => {
    const nextNodes = typeof nodes === 'function' ? nodes(get().nodes) : nodes;
    set({ nodes: nextNodes });
  },
  setEdges: (edges) => {
    const nextEdges = typeof edges === 'function' ? edges(get().edges) : edges;
    set({ edges: nextEdges });
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    const selectChange = changes.find((c: any) => c.type === 'select');
    if (selectChange) {
      set({ selectedNodeId: selectChange.selected ? selectChange.id : (get().selectedNodeId === selectChange.id ? null : get().selectedNodeId) });
    }
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    const { nodes, edges } = get();
    const targetNode = nodes.find(n => n.id === connection.target);
    if (targetNode?.data.type === 'start') return;

    const newEdges = addEdge(
      {
        ...connection,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      },
      edges
    );
    set({ edges: newEdges });
    get().saveHistory();
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  updateNodeData: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
    }));
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
    get().saveHistory();
  },

  saveHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const newHistoryNodes = history.nodes.slice(0, historyIndex + 1);
    const newHistoryEdges = history.edges.slice(0, historyIndex + 1);
    set({
      history: {
        nodes: [...newHistoryNodes, [...nodes]],
        edges: [...newHistoryEdges, [...edges]],
      },
      historyIndex: historyIndex + 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        nodes: [...history.nodes[historyIndex - 1]],
        edges: [...history.edges[historyIndex - 1]],
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.nodes.length - 1) {
      set({
        nodes: [...history.nodes[historyIndex + 1]],
        edges: [...history.edges[historyIndex + 1]],
        historyIndex: historyIndex + 1,
      });
    }
  },

  startSimulation: () => set({ isSimulating: true, simulationLogs: [], simulationActiveNodeId: null }),
  stopSimulation: () => set({ isSimulating: false, simulationActiveNodeId: null }),
  setSimulationData: (logs, activeId) => set({ simulationLogs: logs, simulationActiveNodeId: activeId }),

  importWorkflow: (json) => {
    try {
      const data = JSON.parse(json);
      set({ nodes: data.nodes, edges: data.edges, selectedNodeId: null });
      get().saveHistory();
    } catch (e) {
      alert('Invalid Workflow JSON');
    }
  },
}));

// --- Custom Node Components ---

const NodeWrapper = ({ children, color, selected, status, icon: Icon }: any) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'group relative min-w-[200px] rounded-xl bg-white p-4 shadow-lg transition-all duration-200 border-l-4',
        selected ? 'ring-4 ring-blue-500/10 border-blue-500 border-l-blue-500' : color,
        status === 'executing' && 'ring-4 ring-indigo-400'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-5 h-5 flex items-center justify-center rounded bg-gray-50', selected ? 'bg-blue-50 text-blue-600' : 'text-gray-400')}>
          <Icon size={12} />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{status === 'executing' ? 'Running' : 'Node'}</span>
      </div>
      <h3 className="font-bold text-gray-800 text-xs">{children}</h3>
      {status && status !== 'idle' && (
        <div className="absolute -top-3 -right-3 flex gap-1 scale-110">
          {status === 'success' && <CheckCircle2 className="text-emerald-500 fill-white" size={24} />}
          {status === 'warning' && <AlertCircle className="text-amber-500 fill-white" size={24} />}
          {status === 'error' && <X className="text-rose-500 fill-white" size={24} />}
          {status === 'executing' && (
             <div className="bg-indigo-500 p-1.5 rounded-full text-white shadow-lg animate-bounce">
                <Zap size={12} className="animate-pulse" />
             </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const StartNode = ({ data, selected }: any) => (
  <NodeWrapper color="border-l-emerald-500" selected={selected} icon={CirclePlay} status={data.status}>
    {data.title}
    <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{data.description}</p>
    <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-gray-400 !border-white" />
  </NodeWrapper>
);

const TaskNode = ({ data, selected }: any) => (
  <NodeWrapper color="border-l-blue-500" selected={selected} icon={User} status={data.status}>
    {data.title}
    <div className="flex items-center gap-2 mt-2">
      <div className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
        {data.config.assignee || 'Unassigned'}
      </div>
      {data.config.priority && (
        <div className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold", 
          data.config.priority === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-600'
        )}>
          {data.config.priority}
        </div>
      )}
    </div>
    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-gray-400 !border-white" />
    <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-gray-400 !border-white" />
  </NodeWrapper>
);

const ApprovalNode = ({ data, selected }: any) => (
  <NodeWrapper color="border-l-orange-500" selected={selected} icon={Settings} status={data.status}>
    {data.title}
    <div className="flex items-center gap-2 mt-2">
      <div className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded font-bold">
        {data.config.role || 'Any Admin'}
      </div>
    </div>
    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-gray-400 !border-white" />
    <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-gray-400 !border-white" />
    <Handle type="source" position={Position.Bottom} id="escalation" className="!w-3 !h-3 !bg-rose-400 !border-white" />
  </NodeWrapper>
);

const AutomationNode = ({ data, selected }: any) => (
  <NodeWrapper color="border-l-purple-500" selected={selected} icon={Zap} status={data.status}>
    {data.title}
    <div className="text-[10px] mt-1 text-gray-400 font-mono font-bold">
      {data.config.action?.replace('_', ' ').toUpperCase() || 'NO ACTION'}
    </div>
    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-gray-400 !border-white" />
    <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-gray-400 !border-white" />
  </NodeWrapper>
);

const EndNode = ({ data, selected }: any) => (
  <NodeWrapper color="border-l-rose-500" selected={selected} icon={X} status={data.status}>
    {data.title || 'Workflow End'}
    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-gray-400 !border-white" />
  </NodeWrapper>
);

const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  automation: AutomationNode,
  end: EndNode,
};

// --- Panel Components ---

const TopBar = () => {
  const { nodes, edges, undo, redo, startSimulation, importWorkflow, setNodes } = useStore();
  const { fitView } = useReactFlow();

  const handleExport = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr-workflow-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => importWorkflow(event.target.result);
      reader.readAsText(file);
    };
    input.click();
  };

  const autoLayout = () => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'LR', nodesep: 70, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      g.setNode(node.id, { width: 220, height: 80 });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const newNodes = nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 110,
          y: nodeWithPosition.y - 40,
        },
      };
    });

    setNodes(newNodes);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-blue-100">
          <Settings size={18} />
        </div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">HR Workflow Designer</h1>
        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded tracking-wider">v2.4 Draft</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-4">
          <button onClick={undo} className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Undo
          </button>
          <button onClick={redo} className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 border-l border-gray-200 transition-colors">
            Redo
          </button>
        </div>

        <button onClick={autoLayout} className="px-4 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          Auto-layout
        </button>
        
        <div className="h-4 w-px bg-gray-200 mx-2" />

        <button onClick={handleImport} className="px-4 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          Import JSON
        </button>
        <button onClick={handleExport} className="px-4 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          Export JSON
        </button>

        <button
          onClick={startSimulation}
          className="ml-2 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          Test Workflow
        </button>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const onDragStart = (event: any, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories = [
    {
      title: 'General',
      items: [
        { type: 'start', label: 'Start Trigger', dot: 'bg-emerald-500' },
        { type: 'end', label: 'End Flow', dot: 'bg-rose-500' },
      ],
    },
    {
      title: 'Resources',
      items: [
        { type: 'task', label: 'Manual Task', icon: User, iconColor: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-100' },
        { type: 'approval', label: 'Approval Loop', icon: Settings, iconColor: 'text-orange-500' },
      ],
    },
    {
      title: 'Automation',
      items: [{ type: 'automation', label: 'Service Step', icon: Zap, iconColor: 'text-purple-500' }],
    },
  ];

  return (
    <aside className="w-[220px] bg-white border-r border-gray-200 flex flex-col z-10">
      <div className="p-4 flex-1 overflow-hidden">
        {categories.map((cat) => (
          <div key={cat.title} className="mb-6 last:mb-0">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{cat.title}</h3>
            <div className="space-y-2">
              {cat.items.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                  className={cn(
                    "flex items-center gap-3 p-2 border rounded-lg cursor-grab hover:bg-gray-50 transition-all",
                    item.borderColor || "border-gray-100",
                    item.bgColor || "bg-white"
                  )}
                >
                  {item.dot ? (
                    <div className={cn('w-2.5 h-2.5 rounded-full', item.dot)} />
                  ) : (
                    <div className={cn(item.iconColor)}>
                      {React.createElement(item.icon as any, { size: 16 })}
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-[10px] text-gray-400 italic">
          <Settings size={14} />
          Drag & drop components
        </div>
      </div>
    </aside>
  );
};

const ConfigPanel = () => {
  const { selectedNodeId, nodes, updateNodeData, deleteNode, selectNode } = useStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNodeId || !selectedNode) return (
    <aside className="w-[300px] bg-white border-l border-gray-200 flex flex-col items-center justify-center p-10 text-center z-10">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-6 border border-dashed border-gray-200">
        <Settings size={32} />
      </div>
      <h3 className="font-bold text-gray-800 mb-2 text-sm">Node Properties</h3>
      <p className="text-xs text-gray-400 font-medium leading-relaxed px-4">Select any step on your workflow canvas to fine-tune its logic.</p>
    </aside>
  );

  const setConfig = (field: string, val: any) => {
    updateNodeData(selectedNodeId, { config: { ...selectedNode.data.config, [field]: val } });
  };

  return (
    <aside className="w-[300px] bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden z-10 shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-bold text-sm text-gray-800">Node Properties</h2>
        <button onClick={() => selectNode(null)} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex-1 space-y-6">
        <section>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Basic Information</label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Node Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                value={selectedNode.data.title}
                onChange={(e) => updateNodeData(selectedNodeId, { title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs h-20 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                value={selectedNode.data.description}
                onChange={(e) => updateNodeData(selectedNodeId, { description: e.target.value })}
              />
            </div>
          </div>
        </section>

        {selectedNode.data.type === 'task' && (
          <section>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Assignment & SLA</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assignee</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 font-medium"
                  value={selectedNode.data.config.assignee || ''}
                  onChange={(e) => setConfig('assignee', e.target.value)}
                >
                  <option value="">Select Assignee</option>
                  <option value="Alice">Alice (Recruiter)</option>
                  <option value="Bob">Bob (Manager)</option>
                  <option value="Carol">Carol (IT Ops)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                  <div onClick={() => {
                    const priorities = ['Low', 'Medium', 'High'];
                    const current = selectedNode.data.config.priority || 'Medium';
                    const next = priorities[(priorities.indexOf(current) + 1) % 3];
                    setConfig('priority', next);
                  }} className="flex items-center gap-2 px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer">
                    <div className={cn("w-1.5 h-1.5 rounded-full", selectedNode.data.config.priority === 'High' ? 'bg-rose-500' : 'bg-blue-500')} />
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">{selectedNode.data.config.priority || 'MEDIUM'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                  <div className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-400 font-medium">Oct 12, 2023</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {selectedNode.data.type === 'approval' && (
          <section>
             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Approver Authority</label>
             <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 font-medium"
                value={selectedNode.data.config.role || ''}
                onChange={(e) => setConfig('role', e.target.value)}
              >
                <option value="">Select Authority</option>
                <option value="Manager">Department Lead</option>
                <option value="Director">Revenue Director</option>
                <option value="CEO">Executive Office</option>
              </select>
          </section>
        )}

        <section>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Management</label>
          <button onClick={() => deleteNode(selectedNodeId)} className="w-full py-2 border border-rose-200 text-rose-500 text-xs font-bold rounded-lg hover:bg-rose-50 transition-all mb-2">
            Delete Node
          </button>
        </section>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button onClick={() => selectNode(null)} className="w-full py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors">
          Save Configuration
        </button>
      </div>
    </aside>
  );
};

const SimulationPanel = () => {
  const { isSimulating, stopSimulation, simulationLogs, simulationActiveNodeId, nodes } = useStore();

  const successCount = simulationLogs.filter(l => l.status === 'success').length;
  const successRate = simulationLogs.length > 0 ? Math.round((successCount / simulationLogs.length) * 100) : 0;

  if (!isSimulating) return (
    <div className="h-12 bg-gray-900 text-white flex items-center justify-between px-6 z-30">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
          <span className="text-xs font-medium tracking-wide">Simulation: IDLE</span>
        </div>
        <div className="h-4 w-px bg-gray-700"></div>
        <div className="flex items-center gap-4 text-[10px] text-gray-400 uppercase font-bold">
          <span>Nodes: {nodes.length.toString().padStart(2, '0')}</span>
          <span>Errors: 00</span>
          <span>Success Rate: --%</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-mono text-gray-500">EXECUTION_LOG_V1.0</span>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 right-0 h-[340px] bg-white border-t border-gray-200 shadow-2xl z-[100] flex flex-col"
    >
      <div className="h-12 bg-gray-900 text-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium tracking-wide uppercase">Simulation: ACTIVE</span>
          </div>
          <div className="h-4 w-px bg-gray-700"></div>
          <div className="flex items-center gap-4 text-[10px] text-gray-300 uppercase font-bold">
            <span>Step: {simulationLogs.length.toString().padStart(2, '0')}</span>
            <span className="text-emerald-400 font-mono">OK</span>
          </div>
        </div>
        <button onClick={stopSimulation} className="text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="rotate-90" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 border-r border-gray-50 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Execution Trace</h4>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Live Feed</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-4 custom-scrollbar">
            <AnimatePresence>
              {simulationLogs.map((log) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log.id}
                  className={cn(
                    "p-3 rounded-lg border flex items-center justify-between",
                    log.status === 'success' ? 'bg-emerald-50/20 border-emerald-100' : 'bg-amber-50/20 border-amber-100',
                    simulationActiveNodeId === log.id && 'ring-2 ring-blue-500 border-blue-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                     <div className={cn("p-1.5 rounded", log.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')}>
                        {log.status === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                     </div>
                     <div>
                       <p className="text-xs font-bold text-gray-900">{log.name}</p>
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{log.type}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-[9px] font-black uppercase tracking-wider", log.status === 'success' ? 'text-emerald-500' : 'text-amber-500')}>
                      {log.status}
                    </p>
                    <p className="text-[9px] text-gray-400 font-mono">{log.duration}ms</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-80 p-6 bg-gray-50/30 flex flex-col">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Performance Trace</h4>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
               <div className="flex justify-between items-end mb-2">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Process Yield</p>
                 <span className="text-sm font-bold text-blue-600">{successRate}%</span>
               </div>
               <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${successRate}%` }}
                    className="h-full bg-blue-600" 
                 />
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               {[
                 { label: 'Latency', value: '0.4s', color: 'text-blue-500' },
                 { label: 'Warnings', value: '02', color: 'text-amber-500' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-3 rounded-xl border border-gray-100">
                   <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{stat.label}</p>
                   <p className={cn("text-sm font-bold", stat.color)}>{stat.value}</p>
                 </div>
               ))}
            </div>
            
            <button onClick={stopSimulation} className="mt-auto w-full py-2 bg-gray-900 text-white font-bold text-xs rounded-lg hover:bg-black transition-all">
              Term Simulation
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Flow Logic Component ---

const FlowDesigner = () => {
  const { 
    nodes, edges, onConnect, onNodesChange, onEdgesChange, setNodes, setEdges, updateNodeData, 
    isSimulating, setSimulationData, saveHistory, undo, redo, deleteNode, selectNode
  } = useStore();
  
  const reactFlowWrapper = useRef<any>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          title: `Action: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          description: 'Define the logic for this hiring stage...',
          type,
          config: {},
        },
      };

      setNodes([...nodes, newNode as any]);
      saveHistory();
    },
    [reactFlowInstance, nodes, setNodes, saveHistory]
  );

  // Workflow Simulation Execution
  useEffect(() => {
    let active = true;
    if (isSimulating) {
      const runSim = async () => {
        // Validation check
        const starts = nodes.filter(n => n.data.type === 'start');
        const ends = nodes.filter(n => n.data.type === 'end');
        
        if (starts.length !== 1 || ends.length !== 1) {
          alert('Design Error: Your workflow MUST have exactly 1 Start node and 1 End node for simulation.');
          useStore.getState().stopSimulation();
          return;
        }

        // Check for disconnected nodes (simple check)
        const connectedNodes = new Set();
        edges.forEach(e => { connectedNodes.add(e.source); connectedNodes.add(e.target); });
        if (nodes.length > 1 && connectedNodes.size < nodes.length) {
          // Warning but continue
          console.warn('Orphaned nodes detected');
        }

        const logs: any[] = [];
        // Sort nodes by position for a "natural" flow execution sequence
        const executableNodes = [...nodes].filter(n => n.position && n.position.x !== undefined).sort((a,b) => a.position.x - b.position.x);
        
        for (const node of executableNodes) {
          if (!active) break;
          
          useStore.getState().setSimulationData(logs.map(l => ({...l})), node.id);
          updateNodeData(node.id, { status: 'executing' });
          
          await new Promise(r => setTimeout(r, 1200));
          
          const status = Math.random() > 0.92 ? 'warning' : 'success';
          logs.push({
            id: node.id,
            name: node.data.title,
            status,
            duration: Math.floor(Math.random() * 600) + 200,
            type: node.data.type
          });
          
          updateNodeData(node.id, { status });
        }
        
        if (active) useStore.getState().setSimulationData(logs, null);
      };

      runSim();
    } else {
      nodes.forEach(n => updateNodeData(n.id, { status: 'idle' }));
    }
    return () => { active = false; };
  }, [isSimulating]);

  return (
    <div className="flex h-screen bg-[#f4f6f9] overflow-hidden font-sans antialiased text-gray-900 selection:bg-indigo-100 selection:text-indigo-600">
      <Sidebar />
      <div className="flex-1 flex flex-col relative" ref={reactFlowWrapper}>
        <TopBar />
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            deleteKeyCode={['Backspace', 'Delete']}
            onNodeClick={(_, node) => selectNode(node.id)}
            onPaneClick={() => selectNode(null)}
            snapToGrid={true}
            snapGrid={[15, 15]}
            fitView
            minZoom={0.2}
            maxZoom={2}
          >
            <Background 
               color="#cbd5e1" 
               gap={24} 
               size={1} 
               style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
            <Controls className="bg-white border-2 border-gray-100 shadow-2xl rounded-2xl overflow-hidden p-1 flex gap-1 mb-8 ml-4 !border-none" />
            <MiniMap 
              className="bg-white/80 backdrop-blur-md border-2 border-white shadow-2xl rounded-3xl overflow-hidden !m-8 !w-64 !h-44"
              nodeStrokeWidth={3}
              nodeColor={(node) => {
                switch (node.data.type) {
                  case 'start': return '#10b981';
                  case 'task': return '#3b82f6';
                  case 'approval': return '#f59e0b';
                  case 'automation': return '#6366f1';
                  case 'end': return '#f43f5e';
                  default: return '#eee';
                }
              }}
              maskColor="rgba(244, 246, 249, 0.4)"
              style={{ borderRadius: '24px' }}
            />
            <Panel position="bottom-center" className="mb-4">
              <div className="bg-white/90 backdrop-blur-md border border-white shadow-2xl px-6 py-3 rounded-2xl flex items-center gap-6">
                 <div className="flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logic Ready</span>
                 </div>
                 <div className="h-4 w-px bg-gray-200" />
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{nodes.length} Steps</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">/</span>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{edges.length} Links</span>
                 </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
        <AnimatePresence>
          <SimulationPanel />
        </AnimatePresence>
      </div>
      <ConfigPanel />
    </div>
  );
};

// --- Root Component ---

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowDesigner />
    </ReactFlowProvider>
  );
}
