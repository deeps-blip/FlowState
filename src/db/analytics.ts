import { getExecLogs, getFlows } from './index';
import type { WorkflowStats } from '../types';

// ─── Live Analytics (computed from real DB data) ───────────────────────────────
// Zero hardcoded values. All numbers derived from localStorage records.

export function useLiveStats(): WorkflowStats & { hasData: boolean } {
  const logs   = getExecLogs();
  const flows  = getFlows();

  const hasData = logs.length > 0 || flows.length > 0;

  // ── Total workflows ────────────────────────────────────────────────────────
  const totalWorkflows = flows.length;

  // ── Success rate (last 30 days) ────────────────────────────────────────────
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = logs.filter((l) => new Date(l.startedAt).getTime() > cutoff);
  const successCount = recent.filter((l) => l.success).length;
  const successRate =
    recent.length > 0 ? Math.round((successCount / recent.length) * 1000) / 10 : 0;

  // ── Avg execution time ────────────────────────────────────────────────────
  const avgExecutionTime =
    recent.length > 0
      ? Math.round((recent.reduce((s, l) => s + l.duration, 0) / recent.length / 100)) / 10
      : 0;

  // ── Node usage (from stored flows) ────────────────────────────────────────
  const nodeCountMap: Record<string, number> = {};
  flows.forEach((wf) => {
    wf.nodes.forEach((n) => {
      const t = (n.data as any)?.type ?? 'unknown';
      nodeCountMap[t] = (nodeCountMap[t] ?? 0) + 1;
    });
  });

  const nodeUsage = (
    ['start', 'task', 'approval', 'automation', 'end'] as const
  ).map((type) => ({ type, count: nodeCountMap[type] ?? 0 }));

  // ── Error frequency (last 7 days by day label) ────────────────────────────
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const errorMap: Record<string, number> = {};
  days.forEach((d) => (errorMap[d] = 0));

  logs
    .filter((l) => new Date(l.startedAt).getTime() > sevenDaysAgo && !l.success)
    .forEach((l) => {
      const day = days[new Date(l.startedAt).getDay()];
      errorMap[day] = (errorMap[day] ?? 0) + 1;
    });

  // Ordered Mon–Sun
  const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const errorFrequency = orderedDays.map((date) => ({ date, errors: errorMap[date] ?? 0 }));

  // ── Execution history (last 7 days) ────────────────────────────────────────
  const historyMap: Record<string, { executions: number; successes: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    historyMap[label] = { executions: 0, successes: 0 };
  }

  logs
    .filter((l) => new Date(l.startedAt).getTime() > sevenDaysAgo)
    .forEach((l) => {
      const label = new Date(l.startedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (historyMap[label]) {
        historyMap[label].executions += 1;
        if (l.success) historyMap[label].successes += 1;
      }
    });

  const executionHistory = Object.entries(historyMap).map(([date, v]) => ({ date, ...v }));

  return {
    totalWorkflows,
    successRate,
    avgExecutionTime,
    nodeUsage,
    errorFrequency,
    executionHistory,
    hasData,
  };
}
