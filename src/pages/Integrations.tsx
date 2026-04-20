import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Box, BarChart3, FlaskConical, LayoutGrid, CheckCircle2, Clock, Settings2, Power, ExternalLink, Mail, MessageSquare, Database, Briefcase, Webhook as WebhookIcon } from 'lucide-react';
import { getIntegrations, toggleIntegration } from '../db';
import { cn } from '../utils/cn';
import type { IntegrationRecord } from '../types';

const IntegrationCard: React.FC<{
  integration: IntegrationRecord;
  onToggle: (id: string) => void;
}> = ({ integration, onToggle }) => {
  const Icon = {
    slack: MessageSquare,
    email: Mail,
    hris: Database,
    jira: Briefcase,
    meet: Zap,
    webhook: WebhookIcon,
  }[integration.id] || Zap;

  return (
    <div className={cn(
      "bg-slate-900 border rounded-3xl p-6 space-y-6 transition-all group",
      integration.enabled ? "border-indigo-500/30 shadow-2xl shadow-indigo-500/5" : "border-slate-700/60 opacity-60"
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
          integration.enabled ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500"
        )}>
          <Icon size={24} />
        </div>
        <button
          onClick={() => onToggle(integration.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            integration.enabled 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "bg-slate-800 text-slate-500 border border-slate-700/60"
          )}
        >
          <Power size={12} />
          {integration.enabled ? 'Active' : 'Disabled'}
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-bold">{integration.name}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Connect your workflow steps with {integration.name} services to automate actions.
        </p>
      </div>

      {integration.enabled && (
        <div className="pt-4 border-t border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <Clock size={12} />
            Last triggered: {integration.lastTriggered ? new Date(integration.lastTriggered).toLocaleTimeString() : 'Never'}
          </div>
          <button 
            title="Configure Integration"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Settings2 size={16} />
          </button>
        </div>
      )}

      {!integration.enabled && (
        <button 
          onClick={() => onToggle(integration.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
        >
          Connect Now <ExternalLink size={14} />
        </button>
      )}
    </div>
  );
};

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);

  useEffect(() => {
    setIntegrations(getIntegrations());
  }, []);

  const handleToggle = (id: string) => {
    toggleIntegration(id);
    setIntegrations(getIntegrations());
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
          <Link to="/integrations" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/20 rounded-lg border border-indigo-500/30"><WebhookIcon size={13} /> Integrations</Link>
          <Link to="/sandbox" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"><FlaskConical size={13} /> Sandbox</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-indigo-600 rounded-[32px] p-10 overflow-hidden relative group">
          <div className="relative z-10 space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest">
              Automation Hub
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">Integrations & Connectors</h1>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Power up your workflows by connecting with third-party tools. Automatically send messages, create tickets, and sync records.
            </p>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-center space-y-1">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Connected</p>
              <p className="text-3xl font-black text-white">{integrations.filter(i => i.enabled).length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-center space-y-1">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Available</p>
              <p className="text-3xl font-black text-white">{integrations.length}</p>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {integrations.map((integration, idx) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <IntegrationCard 
                integration={integration} 
                onToggle={handleToggle}
              />
            </motion.div>
          ))}
        </div>

        <div className="bg-slate-900/50 border border-dashed border-slate-700/60 rounded-[32px] p-12 text-center space-y-4">
          <h2 className="text-2xl font-black">Need a custom connector?</h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Use our Webhook integration to connect with any REST API or legacy system not listed here.
          </p>
          <button className="flex items-center gap-2 mx-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all">
            <WebhookIcon size={18} /> Configure Custom Webhook
          </button>
        </div>
      </main>
    </div>
  );
};

export default Integrations;
