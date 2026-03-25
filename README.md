# CircuitPaint

CircuitPaint is a lightweight schematic drawing app built with Next.js, React, TypeScript, and Konva.

## Highlights

- Two side toolbars: components on the left, drawing/annotation tools on the right.
- Long-press tool families with submenu indicators (small border triangles).
- Grid-based placement and snapping for component placement, drawing placement, wire drafting, and wire vertex editing.
- Wire styling controls for thickness and dash patterns.
- Text and LaTeX labels with selection boxes sized to rendered content.
- JSON open/save workflow from the top menu and `Ctrl/Cmd+S` quick export.

## Current Tool Set

- Component tools: resistor families, capacitor families, inductor families, diode families, switch/transistor families, logic/buffer/opamp families, source families, ground.
- Drawing tools: `joint`, `port`, `wire`, `text`, `voltage +`, `voltage -`, `current`.
- Right toolbar family examples:
- `joint` <-> `port`
- `voltage +` <-> `voltage -`

## Interaction Cheatsheet

- Mouse wheel: zoom in/out around cursor.
- Right-click drag: pan canvas.
- Left click with active component/drawing tool: place snapped entity.
- Wire tool:
- click to add snapped vertices.
- preview is snapped before placing each vertex.
- `Esc` finalizes draft wire (if it has enough points) and exits active tool.
- Wire edit mode:
- select a wire, then drag blue vertices.
- vertex handles and final positions are grid-snapped while dragging.
- Long-press on tools with triangle indicator: open alternative submenu.

## Bottom Bar Behavior

- When a single entity is selected (and no tool is active):
- color palette + color picker are shown.
- text selection adds border toggle and font size controls.
- wire selection adds thickness menu (`1`, `2`, `3`, `5`) and dashes menu.
- When `wire` tool is active:
- wire thickness and dashes menus appear for new wire creation.

## Keyboard Shortcuts

- `W`: select wire tool.
- `R`: rotate active placement or selected components/drawings.
- `E`: mirror selected items horizontally.
- `G`: toggle grid visibility.
- `Esc`: cancel paste mode, finalize wire draft, and/or clear active tool (context-dependent).
- `Ctrl/Cmd+Z`: undo.
- `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y`: redo.
- `Ctrl/Cmd+C`: copy selection.
- `Ctrl/Cmd+X`: cut selection.
- `Ctrl/Cmd+V`: paste selection.
- `Delete`: delete selection.
- `Ctrl/Cmd+S`: quick JSON download.

## Help Window

- The Help popup is shown automatically on page load/reload.
- It can be reopened from `Help -> Help` in the top menu.

## File Format Notes

- Scene data is stored as JSON with `components`, `drawings`, and `wires`.
- Components support optional `flipped` for horizontal mirroring.
- Wires support optional style fields:
- `strokeColor`
- `strokeWidth`
- `dash` (number array)

## Getting Started

### Requirements

- Node.js 18.18+ or 20+.
- npm.

### Scripts

```bash
npm install
npm run dev
npm run build
npm start
npm run lint
```

## Project Layout

```text
app/
  layout.tsx
  page.tsx
  favicon.png
components/
  CanvasViewport.tsx
  MenuBar.tsx
  ContextMenu.tsx
  Latex.tsx
  tools/
    LeftToolbar.tsx
    RightToolbar.tsx
    ToolPanel.tsx
  symbols/
lib/
  geometry.ts
  tools.ts
  zoom.ts
styles/
  globals.css
```

## License

GNU Affero General Public License v3.0

## Author

Gus Cheng Zhang, The University of Manchester, UK
