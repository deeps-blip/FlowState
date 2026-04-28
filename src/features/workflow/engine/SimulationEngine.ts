import type {
  WorkflowNode,
  WorkflowEdge,
  SimulationLogEntry,
  WorkflowDefinition,
} from '../../../types';

// ─── Cycle Detection (DFS) ─────────────────────────────────────────────────────

export function hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => adj.get(e.source)?.push(e.target));

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const neighbour of adj.get(nodeId) ?? []) {
      if (!visited.has(neighbour) && dfs(neighbour)) return true;
      if (inStack.has(neighbour)) return true;
    }
    inStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && dfs(node.id)) return true;
  }
  return false;
}

// ─── Disconnected-node Detection ───────────────────────────────────────────────

export function getDisconnectedNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  if (nodes.length <= 1) return [];
  const connected = new Set<string>();
  edges.forEach((e) => {
    connected.add(e.source);
    connected.add(e.target);
  });
  return nodes.filter((n) => !connected.has(n.id));
}

// ─── Validation ────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const starts = nodes.filter((n) => n.data.type === 'start');
  const ends   = nodes.filter((n) => n.data.type === 'end');

  if (starts.length === 0) errors.push('Workflow must have at least one Start node.');
  if (starts.length >  1) errors.push('Workflow should have exactly one Start node.');
  if (ends.length   === 0) errors.push('Workflow must have at least one End node.');

  if (hasCycle(nodes, edges)) errors.push('The workflow contains a cycle — execution would loop infinitely.');

  const disconnected = getDisconnectedNodes(nodes, edges);
  if (disconnected.length > 0) {
    warnings.push(
      `${disconnected.length} node(s) are not connected: ${disconnected.map((n) => n.data.title).join(', ')}.`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── Serialisation ──────────────────────────────────────────────────────────────

export function serializeWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  name = 'Untitled Workflow'
): WorkflowDefinition {
  return {
    id: `wf-${Date.now()}`,
    name,
    nodes,
    edges,
    createdAt: new Date().toISOString(),
  };
}

// ─── Topological Sort (for ordered execution) ─────────────────────────────────

export function topologicalSort(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  nodes.forEach((n) => { adj.set(n.id, []); inDegree.set(n.id, 0); });
  edges.forEach((e) => {
    adj.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  });

  const queue = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0);
  const result: WorkflowNode[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    for (const neighbourId of adj.get(node.id) ?? []) {
      const deg = (inDegree.get(neighbourId) ?? 1) - 1;
      inDegree.set(neighbourId, deg);
      if (deg === 0) {
        const n = nodes.find((n) => n.id === neighbourId);
        if (n) queue.push(n);
      }
    }
  }

  // Fallback: include any orphaned nodes at the end
  const inResult = new Set(result.map((n) => n.id));
  nodes.forEach((n) => { if (!inResult.has(n.id)) result.push(n); });

  return result;
}
