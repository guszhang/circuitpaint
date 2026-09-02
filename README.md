# CircuitPaint

CircuitPaint is a lightweight schematic drawing app built with Next.js, React, TypeScript, and Konva.

## Highlights

- Two side toolbars: components on the left, drawing/annotation tools on the right.
- Long-press tool families with submenu indicators (small border triangles).
- Grid-based placement and snapping for component placement, drawing placement, wire drafting, and wire vertex editing.
- Wire styling controls for thickness, dash patterns, and optional arrow endings.
- Text and LaTeX labels with grid-snapped borders and adjustable border thickness.
- JSON open/save, SVG export, PNG download, and bitmap clipboard output.

## Update Log

### 0.1.9

- Added a shape family to the right toolbar with `circle`, `sum`, and `rectangle` tools.
- Added grid-snapped editing handles for circle/sum centres and radii, and rectangle top-left and bottom-right corners.
- Added border dragging, copy/paste, save/load, SVG export, and PNG export support for shapes.
- Added optional pointy arrow endings to wires, with an endpoint inset for accurate pointing at grid-snapped boxes.
- Added grid-snapped text borders with selectable border thickness and corrected vertical margins.
- Improved equation-label paste previews so rendered equations appear instead of raw `$...$` source.
- Improved bitmap clipboard compatibility and added `File -> Export as PNG`.

## Current Tool Set

- Component tools: resistor families, capacitor families, inductor families, diode families, switch/transistor families, logic/buffer/opamp families, source families, ground.
- Drawing tools: `joint`, `port`, `bridge`, `half-circle`, `wire`, `circle`, `sum`, `rectangle`, `text`, `voltage +`, `voltage -`, `current`.
- Right toolbar family examples:
- `joint` / `port` / `bridge` / `half-circle`
- `circle` / `sum` / `rectangle`
- `voltage +` / `voltage -`

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
- Shape edit mode:
- select a circle or sum, then drag its centre or radius handle to a grid point.
- select a rectangle, then drag its top-left or bottom-right handle to a grid point.
- drag any shape by its border to reposition it.
- Long-press on tools with triangle indicator: open alternative submenu.

## Bottom Bar Behavior

- When a single entity is selected (and no tool is active):
- color palette + color picker are shown.
- text selection adds border toggle, border thickness, and font size controls.
- wire selection adds thickness, dashes, and arrow-ending controls.
- When `wire` tool is active:
- wire thickness, dashes, and arrow-ending controls appear for new wire creation.

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
- `arrowEnd` (boolean)
- Shape drawings store their editable radius or corner dimensions in the drawing entry.

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
