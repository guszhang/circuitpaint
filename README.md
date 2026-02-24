# CircuitPaint

CircuitPaint is a lightweight circuit sketching playground built with the Next.js App Router and Konva. It focuses on fast interactions, consistent styling, and a workflow that is easy to extend with new symbols or tools. The public deployment will live at [https://www.circuitpaint.org](https://www.circuitpaint.org).

## Highlights

- **Two-toolbar layout** – Components (resistors, capacitors, inductors, diodes, ICs, etc.) live on the left, while routing and annotation tools (wires, buses, text, notes) sit on the right for quick access.
- **Konva-powered canvas** – Smooth pan/zoom, a performant grid, contextual HUD, and a context menu for clipboard or scene-level actions.
- **Modern React stack** – Next.js 15, React 19, TypeScript, CSS Modules, and a custom KaTeX renderer for inline math/labels without relying on third‑party React 18 packages.
- **Export-friendly scene model** – The canvas state is serialized/deserialized through `CanvasViewport`, making it straightforward to add SVG export or custom persistence later.
- **Polished details** – Global `user-select: none`, dedicated diode-based favicon, and shared geometry/zoom helpers keep the UI cohesive.

## Getting Started

### Requirements

- Node.js **18.18+** or **20+** (matching Next.js 15 engine requirements)
- npm (ships with Node) or another compatible package manager

### Installation & Scripts

```bash
npm install          # install dependencies
npm run dev          # start the dev server at http://localhost:3000
npm run build        # create an optimized production build
npm start            # serve the production build
npm run lint         # run Next.js lint (will prompt to set up ESLint if not configured)
```

## Project Layout

```
app/
  layout.tsx        Root layout + global metadata
  page.tsx          Main CircuitPaint UI
  icon.png          Light-blue diode favicon
components/
  CanvasViewport.tsx  Konva stage, grid, tools, serialization
  LeftToolbar.tsx      Component palette
  RightToolbar.tsx     Wiring/annotation palette
  MenuBar.tsx          Top menubar + dropdowns
  ContextMenu.tsx      Canvas context menu
  Latex.tsx            KaTeX renderer used for text entities
  symbols/             Individual SVG/Konva component icons
lib/
  geometry.ts        Coordinate helpers (screen ↔ world)
  tools.ts           Tool definitions & type guards
  zoom.ts            Discrete zoom levels + helpers
styles/globals.css   Global look-and-feel
```

## Canvas & Tooling Cheatsheet

- **Mouse wheel** – Discrete zoom steps centered on cursor (0.5× … 4×)
- **Right-click + drag** – Pan the stage
- **Right-click (tap-and-release)** – Context menu (copy/paste, grid toggle, etc.)
- **Toolbar click** – Pick drawing/component tools; active tool highlights in each toolbar
- **HUD** – Lower-left overlay shows zoom factor and world coordinates for quick reference

## Technology Stack

- **Next.js 15 / React 19** with the App Router
- **TypeScript** for type safety across geometry, tools, and Konva bindings
- **Konva / react-konva** for canvas rendering
- **KaTeX** via a bespoke React component for inline or block math labels
- **CSS Modules** for scoped component styles

## Contributing

Issues and pull requests are welcome. The codebase is intentionally modular—new symbols or tools should live under `components/` with supporting logic in `lib/`. If you add linting via the ESLint CLI, update `package.json`/`README.md` accordingly so `npm run lint` no longer prompts for configuration.

## License

GNU Affero General Public License v3

## Author

- Gus Cheng Zhang, The University of Manchester, UK (2026)
