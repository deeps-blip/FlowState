import type { NodeConfig, NodeKind } from '../../../types';
import {
  CirclePlay,
  User,
  Settings,
  Zap,
  Split,
  XCircle,
  Webhook,
} from 'lucide-react';

// ─── Node Registry ─────────────────────────────────────────────────────────────
// Add a new node kind here and it is automatically available everywhere.

export const NODE_REGISTRY: Record<NodeKind, NodeConfig> = {
  start: {
    kind: 'start',
    label: 'Start Trigger',
    description: 'Entry point for the workflow',
    color: 'border-l-emerald-500',
    accentColor: 'text-emerald-500',
    defaultData: {
      title: 'Start',
      description: 'Triggered by an event',
      type: 'start',
      config: { event: '', metadata: [] },
    },
    fields: [
      { key: 'event', label: 'Trigger Event', type: 'text', placeholder: 'e.g. employee.hired' },
    ],
  },

  webhook: {
    kind: 'webhook',
    label: 'Webhook Trigger',
    description: 'Trigger from external app (Pro)',
    color: 'border-l-cyan-500',
    accentColor: 'text-cyan-500',
    defaultData: {
      title: 'Webhook',
      description: 'Listens for POST requests',
      type: 'webhook',
      config: { endpointUrl: '/api/hooks/...', authSecret: '' },
    },
    fields: [
      { key: 'endpointUrl', label: 'Endpoint URL', type: 'text', placeholder: '/api/hooks/xyz' },
      { key: 'authSecret', label: 'Auth Secret', type: 'text', placeholder: 'Secret token' },
    ],
  },

  task: {
    kind: 'task',
    label: 'Manual Task',
    description: 'Assigned to a user or role',
    color: 'border-l-blue-500',
    accentColor: 'text-blue-500',
    defaultData: {
      title: 'Manual Task',
      description: 'Describe what needs to be done',
      type: 'task',
      config: { assignee: '', priority: 'Medium', dueDate: '' },
    },
    fields: [
      {
        key: 'assignee',
        label: 'Assignee',
        type: 'select',
        options: [
          { value: 'alice', label: 'Alice (Recruiter)' },
          { value: 'bob', label: 'Bob (Manager)' },
          { value: 'carol', label: 'Carol (IT Ops)' },
          { value: 'dana', label: 'Dana (HR Director)' },
        ],
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'High', label: 'High' },
        ],
      },
      { key: 'dueDate', label: 'Due Date', type: 'date' },
    ],
  },

  approval: {
    kind: 'approval',
    label: 'Approval Gate',
    description: 'Requires sign-off before continuing',
    color: 'border-l-orange-500',
    accentColor: 'text-orange-500',
    defaultData: {
      title: 'Approval Gate',
      description: 'Awaiting authorisation',
      type: 'approval',
      config: { role: '', escalationDays: 3, notes: '' },
    },
    fields: [
      {
        key: 'role',
        label: 'Approver Role',
        type: 'select',
        options: [
          { value: 'Manager', label: 'Department Lead' },
          { value: 'Director', label: 'Revenue Director' },
          { value: 'CEO', label: 'Executive Office' },
        ],
      },
      { key: 'escalationDays', label: 'Escalation After (days)', type: 'number', placeholder: '3' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Approval criteria…' },
    ],
  },

  automation: {
    kind: 'automation',
    label: 'Automation Step',
    description: 'Runs an automated service action',
    color: 'border-l-purple-500',
    accentColor: 'text-purple-500',
    defaultData: {
      title: 'Automation Step',
      description: 'Automated service call',
      type: 'automation',
      config: { action: '', params: {} },
    },
    fields: [
      {
        key: 'action',
        label: 'Action',
        type: 'select',
        options: [
          { value: 'send_email', label: 'Send Email' },
          { value: 'generate_doc', label: 'Generate Document' },
          { value: 'notify_slack', label: 'Notify Slack' },
          { value: 'update_hris', label: 'Update HRIS Record' },
          { value: 'create_ticket', label: 'Create IT Ticket' },
        ],
      },
      { key: 'params', label: 'Parameters', type: 'kv' },
    ],
  },

  switch: {
    kind: 'switch',
    label: 'Condition (Switch)',
    description: 'Routes execution based on rules (Pro)',
    color: 'border-l-pink-500',
    accentColor: 'text-pink-500',
    defaultData: {
      title: 'Condition Gate',
      description: 'If / Else branching',
      type: 'switch',
      config: { conditionVariable: '', defaultPath: 'continue' },
    },
    fields: [
      { key: 'conditionVariable', label: 'Evaluate Variable', type: 'text', placeholder: 'e.g. employee.department' },
      { key: 'rules', label: 'Routing Rules', type: 'kv' },
      {
        key: 'defaultPath',
        label: 'Default Path',
        type: 'select',
        options: [
          { value: 'continue', label: 'Continue' },
          { value: 'stop', label: 'Stop Workflow' },
        ],
      },
    ],
  },

  end: {
    kind: 'end',
    label: 'End Node',
    description: 'Terminates the workflow',
    color: 'border-l-rose-500',
    accentColor: 'text-rose-500',
    defaultData: {
      title: 'End',
      description: 'Workflow complete',
      type: 'end',
      config: { outcome: 'success' },
    },
    fields: [
      {
        key: 'outcome',
        label: 'Outcome',
        type: 'select',
        options: [
          { value: 'success', label: 'Success' },
          { value: 'failure', label: 'Failure' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
      },
    ],
  },
};

export const NODE_ICONS: Record<NodeKind, React.ComponentType<{ size?: number; className?: string }>> = {
  start: CirclePlay,
  webhook: Webhook,
  task: User,
  approval: Settings,
  automation: Zap,
  switch: Split,
  end: XCircle,
};
