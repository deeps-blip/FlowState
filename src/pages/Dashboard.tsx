import React from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Zap, BarChart3, Box, FlaskConical, TrendingUp, Activity, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { WorkflowStats } from '../types';

// ─── Mock Analytics Data ───────────────────────────────────────────────────────

const stats: WorkflowStats = {
  totalWorkflows: 47,
  successRate: 91.4,
  avgExecutionTime: 3.8,
  nodeUsage: [
    { type: 'start',      count: 47 },
    { type: 'task',       count: 182 },
    { type: 'approval',   count: 94 },
    { type: 'automation', count: 215 },
    { type: 'end',        count: 47 },
  ],
  errorFrequency: [
    { date: 'Mon', errors: 2 },
    { date: 'Tue', errors: 5 },
    { date: 'Wed', errors: 1 },
    { date: 'Thu', errors: 4 },
    { date: 'Fri', errors: 3 },
    { date: 'Sat', errors: 0 },
    { date: 'Sun', errors: 1 },
  ],
  executionHistory: [
    { date: 'Apr 13', executions: 12, successes: 11 },
    { date: 'Apr 14', executions: 18, successes: 16 },
    { date: 'Apr 15', executions: 9,  successes: 9  },
    { date: 'Apr 16', executions: 24, successes: 22 },
    { date: 'Apr 17', executions: 21, successes: 19 },
    { date: 'Apr 18', executions: 30, successes: 28 },
    { date: 'Apr 19', executions: 15, successes: 14 },
  ],
};

const NODE_COLORS: Record<string, string> = {
  start:      '#10b981',
  task:       '#6366f1',
  approval:   '#f59e0b',
  automation: '#a855f7',
  end:        '#f43f5e',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}> = ({ label, value, sub, icon, accent }) => (
  <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-5 flex items-start gap-4">
    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', accent)}>
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-white mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Dashboard ─────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
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
          <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/20 rounded-lg border border-indigo-500/30"><BarChart3 size={13} /> Dashboard</Link>
          <Link to="/sandbox"   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"><FlaskConical size={13} /> Sandbox</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time insights from your workflow executions</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Workflows"
            value={stats.totalWorkflows}
            sub="across all templates"
            icon={<Activity size={18} className="text-indigo-300" />}
            accent="bg-indigo-500/20"
          />
          <StatCard
            label="Success Rate"
            value={`${stats.successRate}%`}
            sub="last 30 days"
            icon={<TrendingUp size={18} className="text-emerald-300" />}
            accent="bg-emerald-500/20"
          />
          <StatCard
            label="Avg Execution"
            value={`${stats.avgExecutionTime}s`}
            sub="per workflow"
            icon={<Clock size={18} className="text-amber-300" />}
            accent="bg-amber-500/20"
          />
          <StatCard
            label="Errors This Week"
            value={stats.errorFrequency.reduce((a, e) => a + e.errors, 0)}
            sub="down 12% from last week"
            icon={<AlertTriangle size={18} className="text-rose-300" />}
            accent="bg-rose-500/20"
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Execution history area chart */}
          <div className="lg:col-span-2 bg-slate-800/60 rounded-2xl border border-slate-700/60 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Execution History</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.executionHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradExec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gradSucc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis                tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="executions" stroke="#6366f1" fill="url(#gradExec)" strokeWidth={2} dot={false} name="Executions" />
                <Area type="monotone" dataKey="successes"  stroke="#10b981" fill="url(#gradSucc)" strokeWidth={2} dot={false} name="Successes" />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Node usage pie */}
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Node Usage</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={stats.nodeUsage}
                  dataKey="count"
                  nameKey="type"
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={75}
                  paddingAngle={3}
                >
                  {stats.nodeUsage.map((entry) => (
                    <Cell key={entry.type} fill={NODE_COLORS[entry.type] ?? '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {stats.nodeUsage.map((n) => (
                <div key={n.type} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full node-color-dot"
                      data-color={NODE_COLORS[n.type]}
                      ref={(el) => { if (el) el.style.background = NODE_COLORS[n.type] ?? '#6366f1'; }}
                    />
                    <span className="text-slate-400 capitalize">{n.type}</span>
                  </div>
                  <span className="font-bold text-white">{n.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error frequency bar chart */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Error Frequency — This Week</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.errorFrequency} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis                tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="errors" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Errors" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
