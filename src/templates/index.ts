import type { WorkflowDefinition } from '../types';
import { MarkerType } from 'reactflow';

// ─── Shared edge style factory ─────────────────────────────────────────────────

const edge = (source: string, target: string, label = '') => ({
  id:        `e-${source}-${target}`,
  source,
  target,
  type:      'labeled',
  animated:  true,
  data:      { label },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1', width: 18, height: 18 },
  style:     { stroke: '#6366f1', strokeWidth: 2 },
});

// ─── 1. Hiring Pipeline ────────────────────────────────────────────────────────

export const HIRING_TEMPLATE: WorkflowDefinition = {
  id:        'tpl-hiring',
  name:      'Hiring Pipeline',
  createdAt: new Date().toISOString(),
  nodes: [
    {
      id: 'h-start', type: 'start',
      position: { x: 300, y: 40 },
      data: {
        title: 'New Application Received', type: 'start', status: 'idle',
        description: 'Triggered when a candidate applies',
        config: { event: 'candidate.applied', metadata: [] },
      },
    },
    {
      id: 'h-screen', type: 'task',
      position: { x: 300, y: 180 },
      data: {
        title: 'Screen CVs & Cover Letters', type: 'task', status: 'idle',
        description: 'Initial recruiter review',
        config: { assignee: 'alice', priority: 'High', dueDate: '' },
      },
    },
    {
      id: 'h-interview', type: 'task',
      position: { x: 300, y: 320 },
      data: {
        title: 'Conduct Interview', type: 'task', status: 'idle',
        description: 'Schedule and run candidate interviews',
        config: { assignee: 'bob', priority: 'High', dueDate: '' },
      },
    },
    {
      id: 'h-approval', type: 'approval',
      position: { x: 300, y: 460 },
      data: {
        title: 'Hiring Manager Approval', type: 'approval', status: 'idle',
        description: 'Approve or reject the candidate',
        config: { role: 'Manager', escalationDays: 2, notes: 'Review interview scores' },
      },
    },
    {
      id: 'h-offer', type: 'automation',
      position: { x: 300, y: 600 },
      data: {
        title: 'Send Offer Letter', type: 'automation', status: 'idle',
        description: 'Auto-generate and email offer',
        config: { action: 'generate_doc', params: { template: 'offer_letter' } },
      },
    },
    {
      id: 'h-notify', type: 'automation',
      position: { x: 300, y: 740 },
      data: {
        title: 'Notify Slack #hiring', type: 'automation', status: 'idle',
        description: 'Announce new hire on Slack',
        config: { action: 'notify_slack', params: { channel: '#hiring' } },
      },
    },
    {
      id: 'h-end', type: 'end',
      position: { x: 300, y: 880 },
      data: {
        title: 'Hired — Onboarding Begins', type: 'end', status: 'idle',
        description: 'Candidate successfully hired',
        config: { outcome: 'success' },
      },
    },
  ],
  edges: [
    edge('h-start',    'h-screen',    'Application received'),
    edge('h-screen',   'h-interview', 'Shortlisted'),
    edge('h-interview','h-approval',  'Interview done'),
    edge('h-approval', 'h-offer',     'Approved'),
    edge('h-offer',    'h-notify',    'Offer sent'),
    edge('h-notify',   'h-end',       'Complete'),
  ],
};

// ─── 2. Task Execution ────────────────────────────────────────────────────────

export const TASK_EXECUTION_TEMPLATE: WorkflowDefinition = {
  id:        'tpl-task',
  name:      'Task Execution',
  createdAt: new Date().toISOString(),
  nodes: [
    {
      id: 't-start', type: 'start',
      position: { x: 300, y: 40 },
      data: {
        title: 'Task Initiated', type: 'start', status: 'idle',
        description: 'Triggered when a task is created',
        config: { event: 'task.created', metadata: [] },
      },
    },
    {
      id: 't-assign', type: 'task',
      position: { x: 300, y: 180 },
      data: {
        title: 'Assign to Team Member', type: 'task', status: 'idle',
        description: 'Delegate and set priority',
        config: { assignee: 'carol', priority: 'Medium', dueDate: '' },
      },
    },
    {
      id: 't-notify', type: 'automation',
      position: { x: 300, y: 320 },
      data: {
        title: 'Notify Assignee', type: 'automation', status: 'idle',
        description: 'Send email notification',
        config: { action: 'send_email', params: { template: 'task_assigned' } },
      },
    },
    {
      id: 't-execute', type: 'task',
      position: { x: 300, y: 460 },
      data: {
        title: 'Execute Task', type: 'task', status: 'idle',
        description: 'Assignee completes the work',
        config: { assignee: 'carol', priority: 'Medium', dueDate: '' },
      },
    },
    {
      id: 't-review', type: 'approval',
      position: { x: 300, y: 600 },
      data: {
        title: 'Manager Review', type: 'approval', status: 'idle',
        description: 'Manager signs off on deliverable',
        config: { role: 'Manager', escalationDays: 1, notes: '' },
      },
    },
    {
      id: 't-update', type: 'automation',
      position: { x: 300, y: 740 },
      data: {
        title: 'Update HRIS Record', type: 'automation', status: 'idle',
        description: 'Close task in system of record',
        config: { action: 'update_hris', params: {} },
      },
    },
    {
      id: 't-end', type: 'end',
      position: { x: 300, y: 880 },
      data: {
        title: 'Task Completed', type: 'end', status: 'idle',
        description: 'Task successfully closed',
        config: { outcome: 'success' },
      },
    },
  ],
  edges: [
    edge('t-start',   't-assign',  'Task created'),
    edge('t-assign',  't-notify',  'Assigned'),
    edge('t-notify',  't-execute', 'Notified'),
    edge('t-execute', 't-review',  'Work done'),
    edge('t-review',  't-update',  'Approved'),
    edge('t-update',  't-end',     'Synced'),
  ],
};

// ─── 3. Company Milestone ─────────────────────────────────────────────────────

export const MILESTONE_TEMPLATE: WorkflowDefinition = {
  id:        'tpl-milestone',
  name:      'Company Milestone',
  createdAt: new Date().toISOString(),
  nodes: [
    {
      id: 'm-start', type: 'start',
      position: { x: 300, y: 40 },
      data: {
        title: 'Milestone Triggered', type: 'start', status: 'idle',
        description: 'A major company event is upcoming',
        config: { event: 'milestone.reached', metadata: [] },
      },
    },
    {
      id: 'm-plan', type: 'task',
      position: { x: 300, y: 180 },
      data: {
        title: 'Plan Milestone Event', type: 'task', status: 'idle',
        description: 'Coordinate details with leadership',
        config: { assignee: 'dana', priority: 'High', dueDate: '' },
      },
    },
    {
      id: 'm-approve', type: 'approval',
      position: { x: 300, y: 320 },
      data: {
        title: 'Executive Approval', type: 'approval', status: 'idle',
        description: 'CEO sign-off on announcement plan',
        config: { role: 'CEO', escalationDays: 1, notes: '' },
      },
    },
    {
      id: 'm-announce', type: 'automation',
      position: { x: 300, y: 460 },
      data: {
        title: 'Announce Company-Wide', type: 'automation', status: 'idle',
        description: 'Send all-hands email',
        config: { action: 'send_email', params: { template: 'milestone_announcement' } },
      },
    },
    {
      id: 'm-slack', type: 'automation',
      position: { x: 300, y: 600 },
      data: {
        title: 'Post to #general Slack', type: 'automation', status: 'idle',
        description: 'Notify team on Slack',
        config: { action: 'notify_slack', params: { channel: '#general' } },
      },
    },
    {
      id: 'm-ticket', type: 'automation',
      position: { x: 300, y: 740 },
      data: {
        title: 'Create Follow-up Tickets', type: 'automation', status: 'idle',
        description: 'Log action items in Jira',
        config: { action: 'create_ticket', params: { project: 'MILESTONE' } },
      },
    },
    {
      id: 'm-end', type: 'end',
      position: { x: 300, y: 880 },
      data: {
        title: 'Milestone Archived', type: 'end', status: 'idle',
        description: 'All actions complete',
        config: { outcome: 'success' },
      },
    },
  ],
  edges: [
    edge('m-start',    'm-plan',     'Event triggered'),
    edge('m-plan',     'm-approve',  'Plan ready'),
    edge('m-approve',  'm-announce', 'Approved'),
    edge('m-announce', 'm-slack',    'Email sent'),
    edge('m-slack',    'm-ticket',   'Notified'),
    edge('m-ticket',   'm-end',      'Tickets created'),
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const TEMPLATES = [
  {
    template:    HIRING_TEMPLATE,
    category:    'Hiring',
    description: 'End-to-end recruiting pipeline from application to offer letter.',
    color:       'from-emerald-500 to-teal-600',
    icon:        '🧑‍💼',
    nodeCount:   HIRING_TEMPLATE.nodes.length,
    edgeCount:   HIRING_TEMPLATE.edges.length,
  },
  {
    template:    TASK_EXECUTION_TEMPLATE,
    category:    'Operations',
    description: 'Structured task lifecycle with assignment, execution, and review.',
    color:       'from-indigo-500 to-blue-600',
    icon:        '✅',
    nodeCount:   TASK_EXECUTION_TEMPLATE.nodes.length,
    edgeCount:   TASK_EXECUTION_TEMPLATE.edges.length,
  },
  {
    template:    MILESTONE_TEMPLATE,
    category:    'Leadership',
    description: 'Company milestone announcement and follow-up action workflow.',
    color:       'from-purple-500 to-pink-600',
    icon:        '🏆',
    nodeCount:   MILESTONE_TEMPLATE.nodes.length,
    edgeCount:   MILESTONE_TEMPLATE.edges.length,
  },
];
