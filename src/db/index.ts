import type { WorkflowDefinition, SimulationLogEntry } from '../types';
import type { ScheduledTask } from '../features/scheduler/SchedulerStore';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  FLOWS:         'flowstate:flows',
  EXEC_LOGS:     'flowstate:exec_logs',
  SCHEDULED:     'flowstate:scheduled_tasks',
  INTEGRATIONS:  'flowstate:integrations',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage quota exceeded — silently ignore */
  }
}

// ─── Execution Log Entry (extended) ──────────────────────────────────────────

export interface ExecLogRecord {
  runId:      string;
  workflowId: string;
  workflowName: string;
  startedAt:  string;
  duration:   number;   // total ms
  steps:      SimulationLogEntry[];
  success:    boolean;
}

// ─── Integration record ───────────────────────────────────────────────────────

export interface IntegrationRecord {
  id:          string;
  name:        string;
  enabled:     boolean;
  lastTriggered?: string;
}

// ─── Flows ────────────────────────────────────────────────────────────────────

export function getFlows(): WorkflowDefinition[] {
  return read<WorkflowDefinition[]>(KEYS.FLOWS, []);
}

export function getFlow(id: string): WorkflowDefinition | undefined {
  return getFlows().find((f) => f.id === id);
}

export function saveFlow(flow: WorkflowDefinition): void {
  const flows = getFlows().filter((f) => f.id !== flow.id);
  const record: WorkflowDefinition = {
    ...flow,
    id: flow.id ?? `wf-${Date.now()}`,
    createdAt: flow.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  write(KEYS.FLOWS, [record, ...flows]);
}

export function deleteFlow(id: string): void {
  write(KEYS.FLOWS, getFlows().filter((f) => f.id !== id));
}

export function duplicateFlow(id: string): WorkflowDefinition | null {
  const original = getFlow(id);
  if (!original) return null;
  const copy: WorkflowDefinition = {
    ...original,
    id:        `wf-${Date.now()}`,
    name:      `${original.name} (copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveFlow(copy);
  return copy;
}

// ─── Execution Logs ───────────────────────────────────────────────────────────

export function getExecLogs(): ExecLogRecord[] {
  return read<ExecLogRecord[]>(KEYS.EXEC_LOGS, []);
}

export function appendExecLog(log: ExecLogRecord): void {
  const existing = getExecLogs();
  // Keep last 500 records
  write(KEYS.EXEC_LOGS, [log, ...existing].slice(0, 500));
}

// ─── Scheduled Tasks ──────────────────────────────────────────────────────────

export function getScheduledTasks(): ScheduledTask[] {
  return read<ScheduledTask[]>(KEYS.SCHEDULED, []);
}

export function saveScheduledTask(task: ScheduledTask): void {
  const tasks = getScheduledTasks().filter((t) => t.id !== task.id);
  write(KEYS.SCHEDULED, [task, ...tasks]);
}

export function deleteScheduledTask(id: string): void {
  write(KEYS.SCHEDULED, getScheduledTasks().filter((t) => t.id !== id));
}

export function updateScheduledTask(id: string, patch: Partial<ScheduledTask>): void {
  write(
    KEYS.SCHEDULED,
    getScheduledTasks().map((t) => (t.id === id ? { ...t, ...patch } : t))
  );
}

// ─── Integrations ─────────────────────────────────────────────────────────────

const DEFAULT_INTEGRATIONS: IntegrationRecord[] = [
  { id: 'slack',      name: 'Slack',        enabled: false },
  { id: 'email',      name: 'Email / SMTP',  enabled: true  },
  { id: 'hris',       name: 'HRIS System',   enabled: false },
  { id: 'jira',       name: 'Jira',          enabled: false },
  { id: 'meet',       name: 'Google Meet',   enabled: false },
  { id: 'webhook',    name: 'Custom Webhook',enabled: false },
];

export function getIntegrations(): IntegrationRecord[] {
  const stored = read<IntegrationRecord[]>(KEYS.INTEGRATIONS, []);
  if (stored.length === 0) {
    write(KEYS.INTEGRATIONS, DEFAULT_INTEGRATIONS);
    return DEFAULT_INTEGRATIONS;
  }
  return stored;
}

export function toggleIntegration(id: string): void {
  write(
    KEYS.INTEGRATIONS,
    getIntegrations().map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i))
  );
}

export function touchIntegration(id: string): void {
  write(
    KEYS.INTEGRATIONS,
    getIntegrations().map((i) =>
      i.id === id ? { ...i, lastTriggered: new Date().toISOString() } : i
    )
  );
}
