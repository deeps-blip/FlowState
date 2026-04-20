import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Box, BarChart3, FlaskConical, LayoutGrid, ArrowRight, Layers, Workflow } from 'lucide-react';
import { TEMPLATES } from '../templates';
import { useWorkflowStore } from '../store/workflowStore';
import { cn } from '../utils/cn';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { importWorkflow } = useWorkflowStore();

  const handleLoadTemplate = (templateJson: string) => {
    importWorkflow(templateJson);
    navigate('/');
  };

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
          <Link to="/templates" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/20 rounded-lg border border-indigo-500/30"><LayoutGrid size={13} /> Templates</Link>
          <Link to="/sandbox" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"><FlaskConical size={13} /> Sandbox</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest"
          >
            Pre-built solutions
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black tracking-tight"
          >
            Workflow Templates
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg"
          >
            Start faster with our curated collection of HR and operational workflows. Fully customizable and ready to deploy.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TEMPLATES.map((tpl, idx) => (
            <motion.div
              key={tpl.template.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="group relative bg-slate-900 border border-slate-700/60 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              <div className={cn("h-32 bg-gradient-to-br flex items-center justify-center text-5xl", tpl.color)}>
                {tpl.icon}
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    {tpl.category}
                  </span>
                  <div className="flex items-center gap-3 text-slate-500 text-xs">
                    <span className="flex items-center gap-1"><Layers size={12} /> {tpl.nodeCount} nodes</span>
                    <span className="flex items-center gap-1"><Workflow size={12} /> {tpl.edgeCount} links</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold">{tpl.template.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {tpl.description}
                </p>
                <button
                  onClick={() => handleLoadTemplate(JSON.stringify(tpl.template))}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 group-hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all"
                >
                  Load Template <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Templates;
