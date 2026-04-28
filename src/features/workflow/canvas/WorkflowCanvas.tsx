import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import dagre from 'dagre';

import { useWorkflowStore } from '../../../store/workflowStore';
import { nodeTypes } from '../nodes/NodeComponents';
import LabeledEdge from './LabeledEdge';
import ValidationPanel from './ValidationPanel';
import { NODE_REGISTRY, NODE_ICONS } from '../nodes/NodeRegistry';
import { validateWorkflow, serializeWorkflow, topologicalSort } from '../engine/SimulationEngine';
import { simulateWorkflow } from '../../../services/api';
import { appendExecLog } from '../../../db';
import { DynamicForm } from '../forms/DynamicForm';
import { useSchedulerStore } from '../../scheduler/SchedulerStore';
import { SchedulerPanel } from '../../scheduler/SchedulerPanel';
import { cn } from '../../../utils/cn';
import type { NodeKind, WorkflowNode } from '../../../types';

import {
  Settings,
  X,
  Undo2,
  Redo2,
  Layout,
  Download,
  Upload,
  Play,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Zap,
  BarChart3,
  Box,
  FlaskConical,
  LayoutGrid,
  Webhook,
  Calendar,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Edge Types ────────────────────────────────────────────────────────────────

const edgeTypes = { labeled: LabeledEdge };

// ─── Top Bar ───────────────────────────────────────────────────────────────────

const TopBar: React.FC = () => {
  const { nodes, edges, undo, redo, startSimulation, importWorkflow, setNodes, historyIndex, history } =
    useWorkflowStore();
  const { openPanel: openScheduler } = useSchedulerStore();
  const { fitView } = useReactFlow();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleExport = () => {
    const wf = serializeWorkflow(nodes, edges, 'FlowState Workflow');
    const blob = new Blob([JSON.stringify(wf, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowstate-${Date.now()}.json`;
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => importWorkflow(ev.target?.result as string);
      reader.readAsText(file);
    };
    input.click();
  };

  const handleAutoLayout = () => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 150, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));
    nodes.forEach((n) => g.setNode(n.id, { width: 220, height: 80 }));
    edges.forEach((e) => g.setEdge(e.source, e.target));
    dagre.layout(g);
    const laid = nodes.map((n) => {
      const p = g.node(n.id);
      return { ...n, position: { x: p.x - 110, y: p.y - 40 } };
    });
    setNodes(laid);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700/60 flex items-center justify-between px-5 z-10 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="text-lg font-black text-white tracking-tight">FlowState</span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-1">
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/20 rounded-lg border border-indigo-500/30"
        >
          <Box size={13} /> Canvas
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <BarChart3 size={13} /> Dashboard
        </Link>
        <Link
          to="/repository"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <LayoutGrid size={13} /> Repository
        </Link>
        <Link
          to="/templates"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <Workflow size={13} /> Templates
        </Link>
        <Link
          to="/integrations"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <Webhook size={13} /> Integrations
        </Link>
        <Link
          to="/sandbox"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <FlaskConical size={13} /> Sandbox
        </Link>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all hover:scale-105 group"
          title="Ask Gemini"
        >
          <Sparkles size={13} className="text-blue-400 group-hover:animate-pulse" /> Ask Gemini
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1" />

        <div className="flex items-center bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
          <button
            disabled={!canUndo}
            onClick={undo}
            className="px-3 py-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <Undo2 size={14} />
          </button>
          <div className="w-px h-4 bg-slate-700" />
          <button
            disabled={!canRedo}
            onClick={redo}
            className="px-3 py-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <Redo2 size={14} />
          </button>
        </div>

        <button
          onClick={handleAutoLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Layout size={13} /> Auto-layout
        </button>

        <button
          onClick={handleImport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Upload size={13} /> Import
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Download size={13} /> Export
        </button>

        <button
          onClick={openScheduler}
          className="flex items-center gap-1.5 ml-1 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Calendar size={13} /> Scheduler
        </button>

        <button
          onClick={startSimulation}
          className="flex items-center gap-1.5 ml-2 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-900/30 transition-all"
        >
          <Play size={13} /> Run Simulation
        </button>
      </div>
    </header>
  );
};

// ─── Node Palette Sidebar ──────────────────────────────────────────────────────

const NodePalette: React.FC = () => {
  const onDragStart = (e: React.DragEvent, type: NodeKind) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const categories: { title: string; kinds: NodeKind[] }[] = [
    { title: 'Flow Control', kinds: ['start', 'webhook', 'switch', 'end'] },
    { title: 'Steps', kinds: ['task', 'approval'] },
    { title: 'Automation', kinds: ['automation'] },
  ];

  return (
    <aside className="w-[220px] bg-slate-900 border-r border-slate-700/60 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-700/60">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Node Palette</h2>
        <p className="text-[10px] text-slate-600 mt-0.5">Drag onto the canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {categories.map((cat) => (
          <div key={cat.title}>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
              {cat.title}
            </h3>
            <div className="space-y-2">
              {cat.kinds.map((kind) => {
                const cfg  = NODE_REGISTRY[kind];
                const Icon = NODE_ICONS[kind];
                return (
                  <div
                    key={kind}
                    draggable
                    onDragStart={(e) => onDragStart(e, kind)}
                    className={cn(
                      'flex items-center gap-3 p-2.5 bg-slate-800 border border-slate-700/60 rounded-xl cursor-grab',
                      'hover:bg-slate-700 hover:border-indigo-500/40 hover:shadow-md hover:shadow-indigo-900/20',
                      'active:cursor-grabbing transition-all duration-150'
                    )}
                  >
                    <span className={cn('flex-shrink-0', cfg.accentColor)}>
                      <Icon size={15} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{cfg.label}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">{cfg.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

// ─── Config Panel ──────────────────────────────────────────────────────────────

const ConfigPanel: React.FC = () => {
  const { selectedNodeId, nodes, updateNodeData, deleteNode, selectNode } = useWorkflowStore();
  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <aside className="w-[280px] bg-slate-900 border-l border-slate-700/60 flex flex-col items-center justify-center p-8 text-center shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-dashed border-slate-700 flex items-center justify-center mb-4">
          <Settings size={24} className="text-slate-600" />
        </div>
        <p className="text-sm font-bold text-slate-400">Node Properties</p>
        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
          Click any node on the canvas to configure it
        </p>
      </aside>
    );
  }

  const cfg = NODE_REGISTRY[node.data.type];

  const handleFieldChange = (key: string, value: unknown) => {
    updateNodeData(node.id, { config: { ...node.data.config, [key]: value } });
  };

  return (
    <aside className="w-[280px] bg-slate-900 border-l border-slate-700/60 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Node Properties</h2>
          <p className={cn('text-[10px] font-bold uppercase tracking-widest mt-0.5', cfg.accentColor)}>
            {cfg.label}
          </p>
        </div>
        <button
          onClick={() => selectNode(null)}
          aria-label="Close node properties panel"
          title="Close"
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic info */}
        <section>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            Basic Info
          </label>
          <div className="space-y-3">
            <div>
              <label htmlFor="node-title" className="block text-[11px] text-slate-400 mb-1.5">Title</label>
              <input
                id="node-title"
                type="text"
                aria-label="Node title"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                value={node.data.title}
                onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="node-desc" className="block text-[11px] text-slate-400 mb-1.5">Description</label>
              <textarea
                id="node-desc"
                rows={2}
                aria-label="Node description"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium"
                value={node.data.description}
                onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Dynamic fields */}
        {cfg.fields.length > 0 && (
          <section>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Configuration
            </label>
            <div className="[&_label]:text-slate-400 [&_input]:bg-slate-800 [&_input]:border-slate-700 [&_input]:text-white [&_select]:bg-slate-800 [&_select]:border-slate-700 [&_select]:text-white [&_textarea]:bg-slate-800 [&_textarea]:border-slate-700 [&_textarea]:text-white [&_input]:focus:ring-indigo-500 [&_select]:focus:ring-indigo-500">
              <DynamicForm
                fields={cfg.fields}
                values={node.data.config}
                onChange={handleFieldChange}
              />
            </div>
          </section>
        )}

        {/* Danger zone */}
        <section>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            Danger Zone
          </label>
          <button
            onClick={() => deleteNode(node.id)}
            className="w-full py-2 border border-rose-500/40 text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            Delete Node
          </button>
        </section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/60">
        <button
          onClick={() => selectNode(null)}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    </aside>
  );
};

// ─── Simulation / Status Bar ───────────────────────────────────────────────────

const StatusBar: React.FC = () => {
  const { nodes, edges, isSimulating, simulationLogs, stopSimulation, simulationActiveNodeId } =
    useWorkflowStore();

  const [expanded, setExpanded] = useState(false);

  useEffect(() => { if (isSimulating) setExpanded(true); }, [isSimulating]);

  const successCount  = simulationLogs.filter((l) => l.status === 'success').length;
  const successRate   = simulationLogs.length ? Math.round((successCount / simulationLogs.length) * 100) : 0;
  const totalDuration = simulationLogs.reduce((a, l) => a + l.duration, 0);

  return (
    <div className="relative z-30">
      {/* Collapsed bar */}
      <div className="h-10 bg-slate-950 border-t border-slate-700/60 flex items-center justify-between px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              )}
            />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isSimulating ? 'Simulating…' : 'Idle'}
            </span>
          </div>
          <span className="text-[11px] text-slate-600">
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>

        {simulationLogs.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {expanded ? 'Hide' : 'Show'} logs
            <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* Expanded logs panel */}
      <AnimatePresence>
        {expanded && simulationLogs.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 300, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="absolute bottom-full left-0 right-0 bg-slate-950 border-t border-slate-700/60 shadow-2xl overflow-hidden flex"
          >
            {/* Log list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                Execution Trace
              </h4>
              {simulationLogs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl border transition-all',
                    log.status === 'success'
                      ? 'bg-emerald-900/20 border-emerald-700/30'
                      : 'bg-amber-900/20 border-amber-700/30',
                    simulationActiveNodeId === log.id && 'ring-1 ring-indigo-500'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {log.status === 'success' ? (
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-amber-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-200">{log.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{log.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-[10px] font-black uppercase', log.status === 'success' ? 'text-emerald-400' : 'text-amber-400')}>
                      {log.status}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500">{log.duration}ms</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats sidebar */}
            <div className="w-56 border-l border-slate-700/60 p-4 flex flex-col gap-3">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Summary</h4>
              {[
                { label: 'Success Rate', value: `${successRate}%`, color: 'text-emerald-400' },
                { label: 'Total Duration', value: `${(totalDuration / 1000).toFixed(1)}s`, color: 'text-indigo-400' },
                { label: 'Steps', value: String(simulationLogs.length), color: 'text-slate-300' },
              ].map((s) => (
                <div key={s.label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</p>
                  <p className={cn('text-lg font-black mt-0.5', s.color)}>{s.value}</p>
                </div>
              ))}

              <button
                onClick={() => { stopSimulation(); setExpanded(false); }}
                className="mt-auto w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
              >
                Close Simulation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Canvas (inner — needs ReactFlow context) ──────────────────────────────────

const CanvasInner: React.FC = () => {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, selectNode, saveHistory,
    isSimulating, setSimulationData, stopSimulation, updateNodeData,
    validationErrors, validationWarnings, setValidationResult, clearValidation,
  } = useWorkflowStore();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReturnType<typeof useReactFlow> | null>(null);

  // ── Drag and Drop ────────────────────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData('application/reactflow') as NodeKind;
      if (!kind || !rfInstance) return;

      const position = (rfInstance as any).screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const cfg = NODE_REGISTRY[kind];
      const newNode: WorkflowNode = {
        id: `${kind}-${Date.now()}`,
        type: kind,
        position,
        data: { ...cfg.defaultData, status: 'idle' },
      };
      addNode(newNode);
    },
    [rfInstance, addNode]
  );

  // ── Simulation Runner ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSimulating) {
      nodes.forEach((n) => updateNodeData(n.id, { status: 'idle' }));
      return;
    }

    let active = true;
    const run = async () => {
      const validation = validateWorkflow(nodes, edges);
      if (!validation.valid) {
        // Show errors inline on canvas, not alert()
        setValidationResult(validation.errors, validation.warnings);
        stopSimulation();
        return;
      }

      // Also surface warnings even on valid workflows
      if (validation.warnings.length > 0) {
        setValidationResult([], validation.warnings);
      }

      const ordered = topologicalSort(nodes, edges);
      const logs: import('../../../types').SimulationLogEntry[] = [];

      for (const node of ordered) {
        if (!active) break;
        setSimulationData([...logs], node.id);
        updateNodeData(node.id, { status: 'executing' });
        await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));

        const status = Math.random() > 0.9 ? 'warning' : 'success';
        const entry: import('../../../types').SimulationLogEntry = {
          id: node.id,
          name: node.data.title,
          type: node.data.type,
          status,
          duration: Math.floor(Math.random() * 600) + 200,
          message: `Executed "${node.data.title}"`,
        };
        logs.push(entry);
        updateNodeData(node.id, { status });
      }

      if (active) {
        setSimulationData(logs, null);
        
        // Log to persistent DB for analytics
        appendExecLog({
          runId: `run-${Date.now()}`,
          workflowId: 'canvas-run',
          workflowName: 'Canvas Active Flow',
          startedAt: new Date().toISOString(),
          duration: logs.reduce((a, l) => a + l.duration, 0),
          steps: logs,
          success: !logs.some(l => l.status === 'error'),
        });
      }
    };

    run();
    return () => { active = false; };
  }, [isSimulating]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasValidationIssues = validationErrors.length > 0 || validationWarnings.length > 0;

  return (
    <div className="flex-1 relative" ref={wrapperRef}>
      {/* Validation panel — inline, no alert() */}
      <ValidationPanel
        result={hasValidationIssues ? { valid: validationErrors.length === 0, errors: validationErrors, warnings: validationWarnings } : null}
        onDismiss={clearValidation}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(i) => setRfInstance(i as any)}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={['Backspace', 'Delete']}
        onNodeClick={(_, n) => selectNode(n.id)}
        onPaneClick={() => selectNode(null)}
        snapToGrid
        snapGrid={[16, 16]}
        fitView
        minZoom={0.1}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'labeled',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1', width: 18, height: 18 },
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#334155"
        />
        <Controls
          className="!bg-slate-800 !border-slate-700 !rounded-xl !shadow-xl [&_button]:!bg-slate-800 [&_button]:!border-slate-700 [&_button:hover]:!bg-slate-700 [&_button]:!text-slate-300"
        />
        <MiniMap
          nodeColor={(n) => {
            const m: Record<string, string> = {
              start: '#10b981', task: '#6366f1',
              approval: '#f59e0b', automation: '#a855f7', end: '#f43f5e',
            };
            return m[(n.data as any)?.type] ?? '#475569';
          }}
          maskColor="rgba(15,23,42,0.6)"
          className="!bg-slate-800 !border-slate-700 !rounded-xl !shadow-xl"
        />

        {/* Canvas counter pill */}
        <Panel position="bottom-center">
          <div className="mb-4 flex items-center gap-3 bg-slate-800/90 backdrop-blur border border-slate-700/60 rounded-full px-4 py-2 shadow-xl text-[11px] font-bold text-slate-400">
            <span className="text-indigo-400">{nodes.length} nodes</span>
            <div className="w-px h-3 bg-slate-700" />
            <span className="text-purple-400">{edges.length} connections</span>
            {edges.length > 0 && (
              <>
                <div className="w-px h-3 bg-slate-700" />
                <span className="text-slate-500 text-[10px]">click an arrow to name it</span>
              </>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// ─── WorkflowCanvas (exported) ─────────────────────────────────────────────────

const WorkflowCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-slate-950 font-sans antialiased">
        <TopBar />
        <div className="flex flex-1 min-h-0 relative">
          <NodePalette />
          <CanvasInner />
          <ConfigPanel />
          <div className="absolute right-0 top-0 bottom-0 pointer-events-none z-[100]">
            <div className="pointer-events-auto h-full">
              <SchedulerPanel />
            </div>
          </div>
        </div>
        <StatusBar />
      </div>
    </ReactFlowProvider>
  );
};

export default WorkflowCanvas;
