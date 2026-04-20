import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Box, BarChart3, FlaskConical, LayoutGrid, Search, Trash2, Copy, ExternalLink, Calendar, Layers, Workflow, Plus } from 'lucide-react';
import { getFlows, deleteFlow, duplicateFlow } from '../db';
import { useWorkflowStore } from '../store/workflowStore';
import { cn } from '../utils/cn';
import type { WorkflowDefinition } from '../types';

const Repository: React.FC = () => {
  const navigate = useNavigate();
  const { importWorkflow } = useWorkflowStore();
  const [flows, setFlows] = useState<WorkflowDefinition[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setFlows(getFlows());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      deleteFlow(id);
      setFlows(getFlows());
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateFlow(id);
    setFlows(getFlows());
  };

  const handleLoad = (flow: WorkflowDefinition) => {
    importWorkflow(JSON.stringify(flow));
    navigate('/');
  };

  const filteredFlows = flows.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-white">
      {/* Nav */}
      <header className="h-14 bg-slate-900 border-b border-slate-700/60 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <Link to="/" className="text-lg font-black text-white hover:opacity-80 transition-opacity">FlowState</Link>
        </div>
        <nav className="flex items-center gap-1">
          <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"><Box size={13} /> Canvas</Link>
          <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"><BarChart3 size={13} /> Dashboard</Link>
          <Link to="/repository" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/20 rounded-lg border border-indigo-500/30"><LayoutGrid size={13} /> Repository</Link>
          <Link to="/sandbox" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"><FlaskConical size={13} /> Sandbox</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight">Workflow Repository</h1>
            <p className="text-slate-400 text-sm">Manage and access all your saved workflow structures.</p>
          </div>
          <Link 
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus size={16} /> Create New Flow
          </Link>
        </div>

        <div className="flex items-center gap-4 bg-slate-900 border border-slate-700/60 rounded-2xl p-4">
          <Search size={18} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="Search saved flows..." 
            className="bg-transparent border-none focus:ring-0 text-sm text-white w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredFlows.length === 0 ? (
              <div className="col-span-full py-20 text-center space-y-4">
                <LayoutGrid size={48} className="mx-auto text-slate-700" />
                <p className="text-slate-500 font-medium">No workflows found. Search better or create one!</p>
              </div>
            ) : (
              filteredFlows.map((flow) => (
                <motion.div
                  key={flow.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-6 space-y-6 hover:bg-slate-900 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{flow.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <Calendar size={12} /> {new Date(flow.updatedAt || flow.createdAt || '').toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleDuplicate(flow.id!)}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        title="Duplicate"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(flow.id!)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nodes</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Layers size={14} className="text-indigo-400" />
                        <span className="text-sm font-bold">{flow.nodes.length}</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Links</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Workflow size={14} className="text-purple-400" />
                        <span className="text-sm font-bold">{flow.edges.length}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLoad(flow)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white font-bold rounded-xl transition-all"
                  >
                    Open in Canvas <ExternalLink size={14} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Repository;
