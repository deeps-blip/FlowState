import { create } from 'zustand';
import {
  getScheduledTasks,
  saveScheduledTask,
  deleteScheduledTask,
  updateScheduledTask,
} from '../../db/index';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecurrenceKind = 'once' | 'daily' | 'weekly';

export interface ScheduledTask {
  id:           string;
  workflowId:   string;
  workflowName: string;
  scheduledAt:  string;   // ISO datetime string
  recurrence:   RecurrenceKind;
  status:       'pending' | 'running' | 'done' | 'missed';
  lastFiredAt?: string;
  createdAt:    string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface SchedulerStore {
  tasks:     ScheduledTask[];
  panelOpen: boolean;

  // Actions
  openPanel:   () => void;
  closePanel:  () => void;
  loadTasks:   () => void;
  addTask:     (task: Omit<ScheduledTask, 'id' | 'createdAt' | 'status'>) => void;
  removeTask:  (id: string) => void;
  markDone:    (id: string) => void;
  markMissed:  (id: string) => void;
}

export const useSchedulerStore = create<SchedulerStore>((set, get) => ({
  tasks:     [],
  panelOpen: false,

  openPanel:  () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),

  loadTasks: () => {
    set({ tasks: getScheduledTasks() });
  },

  addTask: (taskInput) => {
    const task: ScheduledTask = {
      ...taskInput,
      id:        `sched-${Date.now()}`,
      status:    'pending',
      createdAt: new Date().toISOString(),
    };
    saveScheduledTask(task);
    set((s) => ({ tasks: [task, ...s.tasks] }));
  },

  removeTask: (id) => {
    deleteScheduledTask(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  markDone: (id) => {
    updateScheduledTask(id, { status: 'done', lastFiredAt: new Date().toISOString() });
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status: 'done', lastFiredAt: new Date().toISOString() } : t
      ),
    }));
  },

  markMissed: (id) => {
    updateScheduledTask(id, { status: 'missed' });
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: 'missed' } : t)),
    }));
  },
}));

// ─── Scheduler Daemon ─────────────────────────────────────────────────────────
// Call once at app start. Polls every 30s, marks tasks done/missed.

export function startSchedulerDaemon(
  onFire: (task: ScheduledTask) => void
): () => void {
  const tick = () => {
    const { tasks, markDone, markMissed } = useSchedulerStore.getState();
    const now = Date.now();
    tasks.forEach((task) => {
      if (task.status !== 'pending') return;
      const scheduled = new Date(task.scheduledAt).getTime();
      if (scheduled <= now) {
        if (now - scheduled < 5 * 60 * 1000) {
          // Within 5 min grace window → fire
          markDone(task.id);
          onFire(task);
        } else {
          // Missed
          markMissed(task.id);
        }
      }
    });
  };

  tick(); // immediate check
  const interval = setInterval(tick, 30_000);
  return () => clearInterval(interval);
}
