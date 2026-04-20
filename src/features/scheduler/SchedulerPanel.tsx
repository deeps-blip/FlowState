import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, RotateCcw, Plus, Trash2, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { useSchedulerStore, type RecurrenceKind } from './SchedulerStore';
import { getFlows } from '../../db';
import { cn } from '../../utils/cn';
import type { WorkflowDefinition } from '../../types';

export const SchedulerPanel: React.FC = () => {
  const { panelOpen, closePanel, tasks, loadTasks, addTask, removeTask } = useSchedulerStore();
  const [flows, setFlows] = useState<WorkflowDefinition[]>([]);
  
  // Form state
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceKind>('once');

  useEffect(() => {
    if (panelOpen) {
      loadTasks();
      setFlows(getFlows());
    }
  }, [panelOpen, loadTasks]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const flow = flows.find(f => f.id === selectedFlowId);
    if (!flow || !scheduledAt) return;

    addTask({
      workflowId: flow.id!,
      workflowName: flow.name,
      scheduledAt: new Date(scheduledAt).toISOString(),
      recurrence,
    });

    // Reset form
    setSelectedFlowId('');
    setScheduledAt('');
    setRecurrence('once');
  };

  return (
    <AnimatePresence>
      {panelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] bg-slate-900 border-l border-slate-700/60 shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700/60 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Task Scheduler</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Automated Runs</p>
              </div>
              <button onClick={closePanel} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all" title="Close Panel">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Add Task Form */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Schedule New Run</h3>
                <form onSubmit={handleAdd} className="space-y-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-bold">Select Workflow</label>
                    <select
                      required
                      title="Select Workflow"
                      value={selectedFlowId}
                      onChange={(e) => setSelectedFlowId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Choose a flow...</option>
                      {flows.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-400 font-bold">Date & Time</label>
                      <input
                        required
                        type="datetime-local"
                        title="Scheduled Date and Time"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-400 font-bold">Recurrence</label>
                      <select
                        title="Recurrence Rule"
                        value={recurrence}
                        onChange={(e) => setRecurrence(e.target.value as RecurrenceKind)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="once">Run once</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add to Schedule
                  </button>
                </form>
              </section>

              {/* Tasks List */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Upcoming & Past Runs</h3>
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="py-12 text-center space-y-2 grayscale opacity-40">
                      <Calendar size={32} className="mx-auto" />
                      <p className="text-sm font-medium">No scheduled tasks</p>
                    </div>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex items-start justify-between group">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {task.status === 'done' ? <CheckCircle2 size={14} className="text-emerald-400" /> :
                             task.status === 'missed' ? <AlertCircle size={14} className="text-rose-400" /> :
                             <Clock size={14} className="text-indigo-400" />}
                            <span className="text-sm font-bold">{task.workflowName}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              <Calendar size={12} /> {new Date(task.scheduledAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              <Clock size={12} /> {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-indigo-400/70 font-bold uppercase tracking-wider bg-indigo-500/10 px-1.5 py-0.5 rounded-lg border border-indigo-500/20">
                              <RotateCcw size={10} /> {task.recurrence}
                            </div>
                          </div>

                          {task.status === 'done' && (
                            <p className="text-[9px] text-emerald-500/70 font-bold">Last run: {new Date(task.lastFiredAt!).toLocaleString()}</p>
                          )}
                        </div>

                        <button 
                          onClick={() => removeTask(task.id)}
                          title="Remove Task"
                          className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Footer Tip */}
            <div className="p-6 bg-slate-800/60 border-t border-slate-700/60">
              <div className="flex gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                <Play size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-300 leading-relaxed font-medium">
                  <strong>Tip:</strong> The scheduler runs in the background while this tab is open. Missed tasks will be marked if the app was closed.
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
