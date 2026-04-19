import type { Node, Edge } from 'reactflow';

// ─── Node Types ────────────────────────────────────────────────────────────────

export type NodeKind = 'start' | 'task' | 'approval' | 'automation' | 'end';

export type NodeStatus = 'idle' | 'executing' | 'success' | 'warning' | 'error';

export interface NodeData {
  title: string;
  description: string;
  type: NodeKind;
  config: Record<string, unknown>;
  status?: NodeStatus;
}

export type WorkflowNode = Node<NodeData>;
export type WorkflowEdge = Edge;

// ─── Node Config / Registry ────────────────────────────────────────────────────

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'kv';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface NodeConfig {
  kind: NodeKind;
  label: string;
  description: string;
  color: string;         // Tailwind border-l-* class
  accentColor: string;   // Tailwind text-* class for icon
  defaultData: Omit<NodeData, 'config'> & { config: Record<string, unknown> };
  fields: FieldDef[];
}

// ─── Automations ───────────────────────────────────────────────────────────────

export interface Automation {
  id: string;
  label: string;
  params: string[];
}

// ─── Workflow Definition (serialised) ─────────────────────────────────────────

export interface WorkflowDefinition {
  id?: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt?: string;
}

// ─── Simulation ────────────────────────────────────────────────────────────────

export interface SimulationLogEntry {
  id: string;
  name: string;
  type: NodeKind;
  status: 'success' | 'warning' | 'error';
  duration: number;
  message?: string;
}

export interface SimulationResponse {
  success: boolean;
  totalDuration: number;
  logs: SimulationLogEntry[];
  errors: string[];
}

// ─── Analytics ─────────────────────────────────────────────────────────────────

export interface WorkflowStats {
  totalWorkflows: number;
  successRate: number;
  avgExecutionTime: number;
  nodeUsage: { type: NodeKind; count: number }[];
  errorFrequency: { date: string; errors: number }[];
  executionHistory: { date: string; executions: number; successes: number }[];
}
