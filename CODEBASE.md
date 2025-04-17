 # Codebase Overview

 This document provides an in-depth walkthrough of the **beaUX** codebase: how it’s structured, the tech stack, and where to find core pieces.

 ## Project Purpose
 - **Interactive brain‑mapping tool**: visualize and design your application’s component architecture on an interactive canvas, take notes, import/export diagrams, and scaffold code snippets.

 ## Tech Stack
 - **Bundler & compiler:** Vite + SWC (@vitejs/plugin-react-swc)
 - **Language:** TypeScript + React
 - **Styling:** Tailwind CSS + class‑variance‑authority + clsx
 - **UI primitives:** Radix UI (via custom wrappers in `src/components/ui`)
 - **Graph layout:** @dagrejs/dagre
 - **Diagram parsing:** mermaid
 - **State & data fetching:** React Query (@tanstack/react-query)
 - **Routing:** react‑router‑dom
 - **Forms & validation:** react-hook-form + zod
 - **Export:** html2canvas (PNG), JSON, Expo Snack preview
 - **Notifications:** sonner + custom Toaster
 - **AI helpers:** AIComponentGenerator components for code scaffolding

 ## Getting Started
 1. `npm install`
 2. `npm run dev` (starts on http://localhost:8080)
 3. `npm run build` / `npm run preview`
 4. `npm run lint`

 ## Directory Structure
 ```text
 .
 ├── public/            # static assets (icons, logos)
 ├── src/
 │   ├── components/    # reusable UI and domain components
 │   │   ├── ui/        # design‑system primitives (Button, Dialog, etc.)
 │   │   ├── DiagramEditor.tsx
 │   │   └── …
 │   ├── pages/         # route‑level pages (Home, NotFound)
 │   ├── hooks/         # custom React hooks (e.g. useMermaidToBeaUX)
 │   ├── lib/           # low‑level utilities (core helpers)
 │   ├── utils/         # helper functions & serializers
 │   ├── App.tsx        # application root (providers, router)
   │   └── main.tsx       # ReactDOM render
 ├── README.md
 ├── CODEBASE.md
 └── vite.config.ts
 ```

 ## Core Flow
 1. **main.tsx** → mounts `<App/>`.
 2. **App.tsx** → wraps providers (React Query, Tooltips, Toaster), sets up routes.
 3. **Home.tsx** → renders the main canvas view (`DiagramEditor` + side panels).
 4. **DiagramEditor.tsx** → interactive canvas: drag/drop nodes, zoom/pan, connect edges.
 5. **Hooks & utils** → e.g. `useMermaidToBeaUX.ts` handles Mermaid parsing and Dagre layout; persistence hooks save/load from localStorage.

 ## Further Exploration
 - **UI primitives:** inspect files under `src/components/ui/` to see Radix + Tailwind + CVA in action.
 - **Mermaid integration:** see `src/hooks/useMermaidToBeaUX.ts` for parsing and layout logic.
 - **Persistence:** examine `src/hooks/useLocalStorage.ts` (if present) or related hooks for saving/loading diagrams.