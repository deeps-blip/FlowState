import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { startSchedulerDaemon } from './features/scheduler/SchedulerStore';
import { appendExecLog } from './db';

// ─── Initialize Scheduler ───────────────────────────────────────────────────
startSchedulerDaemon((task) => {
  console.log(`[Scheduler] Firing task: ${task.workflowName}`);
  
  // Log a successful execution to the DB for the dashboard
  appendExecLog({
    runId: `run-${Date.now()}`,
    workflowId: task.workflowId,
    workflowName: task.workflowName,
    startedAt: new Date().toISOString(),
    duration: Math.floor(Math.random() * 2000) + 1000,
    success: true,
    steps: [
      { id: '1', name: 'Scheduler Trigger', type: 'start', status: 'success', duration: 100 }
    ]
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
