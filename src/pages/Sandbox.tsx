import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Box, BarChart3, FlaskConical, Play, CheckCircle2, AlertCircle, XCircle, Code2, AlertTriangle } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { validateWorkflow, serializeWorkflow } from '../features/workflow/engine/SimulationEngine';
import { simulateWorkflow } from '../services/api';
import { cn } from '../utils/cn';
import type { SimulationLogEntry } from '../types';

type Tab = 'logs' | 'json' | 'validation';

const Sandbox: React.FC = () => {
  const { nodes, edges } = useWorkflowStore();
  const [tab, setTab]     = useState<Tab>('logs');
  const [running, setRunning]     = useState(false);
  const [logs, setLogs]           = useState<SimulationLogEntry[]>([]);
  const [errors, setErrors]       = useState<string[]>([]);
  const [warnings, setWarnings]   = useState<string[]>([]);
  const [hasRun, setHasRun]       = useState(false);

  const wfJson = JSON.stringify(serializeWorkflow(nodes, edges, 'Sandbox Preview'), null, 2);

  const handleRun = async () => {
    setRunning(true);
    setLogs([]);
    setErrors([]);
    setWarnings([]);
    setHasRun(true);

    // Client-side validation
    const validation = validateWorkflow(nodes, edges);
    setWarnings(validation.warnings);

    if (!validation.valid) {
      setErrors(validation.errors);
      setRunning(false);
      setTab('validation');
      return;
    }

    // API simulation
    const wf = serializeWorkflow(nodes, edges, 'Sandbox Run');
    const result = await simulateWorkflow(wf);
    setLogs(result.logs);
    if (result.errors.length > 0) setErrors(result.errors);
    setRunning(false);
    setTab('logs');
  };

  const successCount = logs.filter((l) => l.status === 'success').length;
  const successRate  = logs.length ? Math.round((successCount / logs.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-white">
      {/* Nav */}
      <header className="h-14 bg-slate-900 border-b border-slate-700/60 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-lg font-black text-white">FlowState</span>
        </div>
        <nav className="flex items-center gap-1">
          <Link to="/"          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"><Box size={13} /> Canvas</Link>
          <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"><BarChart3 size={13} /> Dashboard</Link>
          <Link to="/sandbox"   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/20 rounded-lg border border-indigo-500/30"><FlaskConical size={13} /> Sandbox</Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Simulation Sandbox</h1>
            <p className="text-slate-400 text-sm mt-1">
              Validate and simulate your current canvas workflow ({nodes.length} nodes, {edges.length} edges)
            </p>
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-900/30 disabled:opacity-50 transition-all"
          >
            {running ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play size={15} />
            )}
            {running ? 'Simulating…' : 'Run Simulation'}
          </button>
        </div>

        {/* Summary strip */}
        {hasRun && !running && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-3"
          >
            {[
              { label: 'Steps',        value: logs.length,              color: 'text-indigo-400' },
              { label: 'Success Rate', value: `${successRate}%`,        color: 'text-emerald-400' },
              { label: 'Errors',       value: errors.length,            color: 'text-rose-400' },
              { label: 'Warnings',     value: warnings.length,          color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/60 rounded-xl border border-slate-700/60 p-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                <p className={cn('text-xl font-black mt-0.5', s.color)}>{s.value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 overflow-hidden">
          <div className="flex border-b border-slate-700/60">
            {(['logs', 'json', 'validation'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors capitalize',
                  tab === t
                    ? 'text-indigo-300 border-b-2 border-indigo-500 bg-indigo-500/10'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {t === 'logs' && <span className="flex items-center gap-1.5"><Activity size={12} /> Execution Logs</span>}
                {t === 'json' && <span className="flex items-center gap-1.5"><Code2 size={12} /> JSON Preview</span>}
                {t === 'validation' && <span className="flex items-center gap-1.5"><AlertTriangle size={12} /> Validation</span>}
              </button>
            ))}
          </div>

          <div className="p-5">
            <AnimatePresence mode="wait">
              {/* Logs */}
              {tab === 'logs' && (
                <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {logs.length === 0 ? (
                    <div className="text-center py-16 text-slate-600">
                      <FlaskConical size={32} className="mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-bold">No logs yet — run a simulation</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log, i) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-xl border',
                            log.status === 'success'
                              ? 'bg-emerald-900/20 border-emerald-700/30'
                              : 'bg-amber-900/20 border-amber-700/30'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {log.status === 'success'
                              ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                              : <AlertCircle  size={15} className="text-amber-400  shrink-0" />
                            }
                            <div>
                              <p className="text-sm font-bold text-white">{log.name}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{log.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn('text-[10px] font-black uppercase', log.status === 'success' ? 'text-emerald-400' : 'text-amber-400')}>
                              {log.status}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500">{log.duration}ms</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* JSON */}
              {tab === 'json' && (
                <motion.div key="json" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <pre className="text-xs text-indigo-300 font-mono bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed">
                    {wfJson}
                  </pre>
                </motion.div>
              )}

              {/* Validation */}
              {tab === 'validation' && (
                <motion.div key="validation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {errors.length === 0 && warnings.length === 0 && (
                    <div className="text-center py-12 text-slate-600">
                      <p className="text-sm font-bold">Run a simulation to see validation results</p>
                    </div>
                  )}
                  {errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-rose-900/20 border border-rose-700/30">
                      <XCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-rose-300">{e}</p>
                    </div>
                  ))}
                  {warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-900/20 border border-amber-700/30">
                      <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-300">{w}</p>
                    </div>
                  ))}
                  {errors.length === 0 && warnings.length > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-900/20 border border-emerald-700/30">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <p className="text-sm text-emerald-300 font-bold">No errors — workflow is valid</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

// fix missing import
function Activity({ size, className }: { size: number; className?: string }) {
  return <BarChart3 size={size} className={className} />;
}

export default Sandbox;
