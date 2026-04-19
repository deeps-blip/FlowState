import React from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import type { NodeKind, NodeStatus } from '../../../types';
import { NODE_ICONS, NODE_REGISTRY } from './NodeRegistry';
import { cn } from '../../../utils/cn';
import { CheckCircle2, AlertCircle, X, Zap } from 'lucide-react';

// ─── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: NodeStatus }> = ({ status }) => {
  if (!status || status === 'idle') return null;
  return (
    <div className="absolute -top-3 -right-3 z-10">
      {status === 'success'   && <CheckCircle2 className="text-emerald-500 drop-shadow" size={22} />}
      {status === 'warning'   && <AlertCircle  className="text-amber-500  drop-shadow" size={22} />}
      {status === 'error'     && <X            className="text-rose-500   drop-shadow" size={22} />}
      {status === 'executing' && (
        <span className="flex items-center justify-center w-6 h-6 bg-indigo-500 rounded-full animate-pulse shadow-lg">
          <Zap size={12} className="text-white" />
        </span>
      )}
    </div>
  );
};

// ─── Generic Node Card ─────────────────────────────────────────────────────────

interface NodeCardProps {
  data: {
    title: string;
    description?: string;
    type: NodeKind;
    config: Record<string, unknown>;
    status?: NodeStatus;
  };
  selected: boolean;
}

export const FlowNodeCard: React.FC<NodeCardProps> = ({ data, selected }) => {
  const config  = NODE_REGISTRY[data.type];
  const Icon    = NODE_ICONS[data.type];
  const isStart = data.type === 'start';
  const isEnd   = data.type === 'end';

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={cn(
        'relative min-w-[210px] rounded-2xl border-l-4 bg-white shadow-md transition-all duration-200 select-none',
        config.color,
        selected
          ? 'ring-2 ring-indigo-400 shadow-indigo-100 shadow-lg'
          : 'hover:shadow-lg hover:-translate-y-px',
        data.status === 'executing' && 'ring-2 ring-indigo-400 shadow-indigo-200'
      )}
    >
      {/* Target handle */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-slate-300 !border-white !border-2"
        />
      )}

      <StatusBadge status={data.status ?? 'idle'} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('flex-shrink-0', config.accentColor)}>
            <Icon size={14} />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {config.label}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-bold text-slate-800 leading-snug truncate">{data.title}</p>

        {/* Subtitle / description */}
        {data.description && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{data.description}</p>
        )}

        {/* Task-specific chip */}
        {data.type === 'task' && data.config.assignee && (
          <span className="mt-2 inline-block text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
            {String(data.config.assignee)}
          </span>
        )}

        {/* Automation-specific chip */}
        {data.type === 'automation' && data.config.action && (
          <span className="mt-2 inline-block text-[10px] font-mono font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full uppercase">
            {String(data.config.action).replace(/_/g, ' ')}
          </span>
        )}

        {/* Approval role chip */}
        {data.type === 'approval' && data.config.role && (
          <span className="mt-2 inline-block text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
            {String(data.config.role)}
          </span>
        )}
      </div>

      {/* Source handle */}
      {!isEnd && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-slate-300 !border-white !border-2"
        />
      )}

      {/* Approval escalation handle */}
      {data.type === 'approval' && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="escalation"
          className="!w-3 !h-3 !bg-rose-400 !border-white !border-2"
        />
      )}
    </motion.div>
  );
};

// ─── React Flow node-type map ──────────────────────────────────────────────────

const makeNodeComponent = (kind: NodeKind) =>
  (props: { data: NodeCardProps['data']; selected: boolean }) =>
    <FlowNodeCard {...props} />;

export const nodeTypes = {
  start:      makeNodeComponent('start'),
  task:       makeNodeComponent('task'),
  approval:   makeNodeComponent('approval'),
  automation: makeNodeComponent('automation'),
  end:        makeNodeComponent('end'),
};
