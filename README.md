
# ⚡ FlowState — Workflow Automation Designer

**A production-grade, modular visual workflow builder**  
inspired by Zapier · Retool · n8n

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![React Flow](https://img.shields.io/badge/React_Flow-11-FF0072?style=for-the-badge)](https://reactflow.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5-brown?style=for-the-badge)](https://zustand-demo.pmnd.rs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## 🗺️ Overview

FlowState is a **lightweight workflow automation platform** — not just a demo UI.  
Design complex multi-step workflows visually, simulate their execution step-by-step, and analyse performance from an analytics dashboard — all in the browser.

| Page | Route | Purpose |
|---|---|---|
| 🏗️ **Canvas** | `/` | Drag-and-drop workflow builder |
| 📊 **Dashboard** | `/dashboard` | Real-time analytics & charts |
| 🧪 **Sandbox** | `/sandbox` | Simulate & validate workflows |

---

## ✨ Features

### 🖼️ Workflow Canvas
- **Drag-and-drop** node creation from the sidebar palette
- **Edge validation** — cannot connect into a Start node; prevents invalid links
- **Node selection** → opens live config panel on the right
- **Keyboard deletion** (Backspace / Delete)
- **Zoom, pan, mini-map** powered by React Flow
- **Snap-to-grid** (16 × 16 px)

### 🧩 Config-Driven Node System
A central **NodeRegistry** drives all node behaviour — adding a new node type is a single record entry:

| Node | Colour | Purpose |
|---|---|---|
| `StartNode` | 🟢 Emerald | Entry point / trigger |
| `TaskNode` | 🔵 Indigo | Manual, assignable action |
| `ApprovalNode` | 🟠 Orange | Approval gate with escalation |
| `AutomationNode` | 🟣 Purple | Automated service call |
| `EndNode` | 🔴 Rose | Workflow termination |

### 📝 Dynamic Form Engine
Renders type-safe, controlled forms from a **JSON field schema**:
- `text`, `number`, `date`, `textarea`
- `select` with predefined options
- `key–value` pairs (dynamic parameters)

### 🔬 Simulation Engine
- **Topological sort** execution order
- **Cycle detection** (DFS)
- **Disconnected node** warnings
- Per-node status badges: `idle → executing → success / warning`
- Expandable log panel at the bottom of the canvas

### 🧪 Sandbox Page
- Run standalone simulations against the current canvas
- Three tabs: **Execution Logs · JSON Preview · Validation**
- Summary strip: success rate, step count, errors, warnings

### 📊 Analytics Dashboard
- KPI cards: total workflows, success rate, avg execution time, error count
- **Area chart** — execution history over time
- **Pie chart** — node type distribution
- **Bar chart** — error frequency by day of week

### 🕹️ Canvas Toolbar
- **Undo / Redo** (Zustand manual history stack)
- **Auto-layout** (Dagre LR layout engine)
- **Export JSON** — downloads a full `WorkflowDefinition` file
- **Import JSON** — restores a saved workflow from disk

---

## 🏗️ Architecture

```
src/
├── App.tsx                          # Root router (BrowserRouter + Routes)
├── index.css                        # Global styles, Inter font, dark theme
│
├── pages/                           # Page-level components
│   ├── Home.tsx                     # / → WorkflowCanvas
│   ├── Dashboard.tsx                # /dashboard → Analytics
│   ├── Sandbox.tsx                  # /sandbox → Simulation Sandbox
│   └── NotFound.tsx                 # * → 404
│
├── features/
│   └── workflow/
│       ├── canvas/
│       │   └── WorkflowCanvas.tsx   # Full canvas layout (TopBar, Palette, Canvas, ConfigPanel, StatusBar)
│       ├── nodes/
│       │   ├── NodeRegistry.ts      # Config-driven node definitions (single source of truth)
│       │   └── NodeComponents.tsx   # Generic FlowNodeCard + nodeTypes map for React Flow
│       ├── forms/
│       │   └── DynamicForm.tsx      # Schema-driven form engine (text, number, date, select, kv)
│       └── engine/
│           └── SimulationEngine.ts  # Validation, cycle detection, topological sort, serialisation
│
├── services/
│   └── api.ts                       # Mock API layer (GET /automations, POST /simulate)
│
├── store/
│   └── workflowStore.ts             # Zustand store — nodes, edges, history, simulation state
│
├── types/
│   └── index.ts                     # Centralised TypeScript types
│
└── utils/
    └── cn.ts                        # clsx + tailwind-merge utility
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9

### Install & Run

```bash
# 1. Clone the repository
git clone https://github.com/your-username/hr-workflow-designer.git
cd hr-workflow-designer

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **[http://localhost:3000](http://localhost:3000)**.

### Other Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production bundle |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) |

---

## 📦 Key Dependencies

| Package | Version | Role |
|---|---|---|
| `react` + `react-dom` | 19 | UI rendering |
| `reactflow` | 11 | Graph canvas engine |
| `zustand` | 5 | Global state management |
| `react-router-dom` | 6 | Client-side routing |
| `recharts` | latest | Analytics charts |
| `dagre` | 0.8 | Auto-layout algorithm |
| `framer-motion` | 12 | Animations & transitions |
| `lucide-react` | latest | Icon library |
| `clsx` + `tailwind-merge` | latest | Conditional class utilities |
| `tailwindcss` | v4 | Utility-first CSS framework |

---

## 🎨 Design System

- **Font**: [Inter](https://fonts.google.com/specimen/Inter) — loaded from Google Fonts
- **Palette**: Slate-950 background, Indigo/Purple accent, semantic node colours
- **Theme**: Dark mode only
- **Animations**: Spring-physics transitions via Framer Motion
- **Node colours**: Emerald (Start) · Indigo (Task) · Amber (Approval) · Purple (Automation) · Rose (End)

---

## 🔌 Extending the Platform

### Adding a New Node Type

1. **Register** in `src/features/workflow/nodes/NodeRegistry.ts`:

```ts
newKind: {
  kind: 'newKind',
  label: 'My New Node',
  description: 'What it does',
  color: 'border-l-teal-500',
  accentColor: 'text-teal-500',
  defaultData: { title: 'New Node', description: '…', type: 'newKind', config: {} },
  fields: [
    { key: 'param', label: 'My Param', type: 'text' },
  ],
},
```

2. **Add the icon** to `NODE_ICONS` in the same file.
3. **Add to the `NodeKind` union** in `src/types/index.ts`.

That's it — the card, config panel, form, and simulation engine all pick it up automatically.

### Swapping the Mock API

Replace the functions in `src/services/api.ts` with real `fetch` / `axios` calls.  
No other files need to change.

---

## 🗺️ Roadmap

- [ ] Real backend API (Express / FastAPI)
- [ ] Persistent workflow storage (IndexedDB / remote DB)
- [ ] Conditional branching edges
- [ ] Node template library
- [ ] Multi-user collaboration (CRDT / WebSockets)
- [ ] Role-based access control
- [ ] Workflow versioning & diff view
- [ ] Export to BPMN / JSON Schema

---

## 📄 License

MIT © 2024 FlowState Contributors
