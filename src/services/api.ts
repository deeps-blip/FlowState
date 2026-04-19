import type { Automation, SimulationResponse, WorkflowDefinition } from '../types';

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_AUTOMATIONS: Automation[] = [
  { id: 'send_email',    label: 'Send Email',          params: ['to', 'subject', 'body'] },
  { id: 'generate_doc',  label: 'Generate Document',   params: ['template', 'recipient'] },
  { id: 'notify_slack',  label: 'Notify Slack',        params: ['channel', 'message'] },
  { id: 'update_hris',   label: 'Update HRIS Record',  params: ['employee_id', 'field', 'value'] },
  { id: 'create_ticket', label: 'Create IT Ticket',    params: ['title', 'priority'] },
];

// Simulate network latency
const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

// ─── API Layer ─────────────────────────────────────────────────────────────────

/** GET /automations — returns available automation actions */
export async function getAutomations(): Promise<Automation[]> {
  await delay(300);
  return MOCK_AUTOMATIONS;
}

/** POST /simulate — accepts a workflow and returns step-by-step execution logs */
export async function simulateWorkflow(
  workflow: WorkflowDefinition
): Promise<SimulationResponse> {
  await delay(500);

  const logs = workflow.nodes.map((node) => ({
    id: node.id,
    name: (node.data as any).title as string,
    type: (node.data as any).type,
    status: (Math.random() > 0.88 ? 'warning' : 'success') as 'success' | 'warning' | 'error',
    duration: Math.floor(Math.random() * 700) + 150,
    message: `Node "${(node.data as any).title}" executed`,
  }));

  const errors: string[] = [];
  const starts = workflow.nodes.filter((n) => (n.data as any).type === 'start');
  const ends   = workflow.nodes.filter((n) => (n.data as any).type === 'end');

  if (starts.length !== 1) errors.push('Workflow must have exactly one Start node.');
  if (ends.length   !== 1) errors.push('Workflow must have exactly one End node.');

  return {
    success: errors.length === 0,
    totalDuration: logs.reduce((acc, l) => acc + l.duration, 0),
    logs,
    errors,
  };
}
