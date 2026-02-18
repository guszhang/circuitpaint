# CircuitPaint

A fast circuit drawing software with SVG export functions built with Next.js and Konva.js.

## Features

### User Interface
- **Top Menu Bar**: File, Edit, Draw, Tool, and Help menus with dropdown options
- **Left Toolbar**: Component library (Resistor, Capacitor, Inductor, Diode, Transistor, IC, Ground, Power)
- **Right Toolbar**: Wiring and annotation tools (Wire, Bus, Label, Text, Note)
- **Canvas**: Interactive Konva.js drawing surface with blue dot-matrix grid

### Canvas Interactions
- **Zoom**: Use mouse wheel to zoom in/out with discrete levels [0.5x, 0.75x, 1x, 1.5x, 2x, 3x, 4x]
  - Zoom is centered around the mouse cursor position
- **Pan**: Right-click and drag to pan the canvas
- **Context Menu**: Right-click on canvas to open context menu (without dragging)
- **HUD Display**: Bottom-left overlay shows current zoom level and world coordinates

### Technical Features
- Built with Next.js 14 (App Router) and TypeScript
- Konva.js for high-performance canvas rendering
- CSS Modules for component styling
- No text selection for professional UI feel
- Efficient grid rendering (only visible dots are rendered)
- Clean separation of UI and canvas components

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
circuitpaint/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── MenuBar.tsx        # Top menu bar with dropdowns
│   ├── LeftToolbar.tsx    # Component library toolbar
│   ├── RightToolbar.tsx   # Wiring/annotation toolbar
│   ├── CanvasViewport.tsx # Konva canvas with grid and interactions
│   └── ContextMenu.tsx    # Right-click context menu
├── lib/                   # Utility functions
│   ├── geometry.ts        # Coordinate transformation utilities
│   └── zoom.ts            # Zoom level management
├── styles/                # Global and module styles
│   └── globals.css        # Global CSS with user-select: none
├── package.json           # Dependencies and scripts
├── next.config.js         # Next.js configuration
└── tsconfig.json          # TypeScript configuration
```

## Usage

### Canvas Controls
- **Mouse Wheel**: Zoom in/out around cursor
- **Right-Click + Drag**: Pan the canvas
- **Right-Click**: Open context menu (without dragging)
- **Left-Click on Tools**: Select component or wiring tool

### Menu Bar
- **File**: New, Open, Save, Save As, Export, Exit
- **Edit**: Undo, Redo, Cut, Copy, Paste, Delete
- **Draw**: Line, Rectangle, Circle, Text
- **Tool**: Select, Wire, Component, Label
- **Help**: Documentation, About

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Konva.js**: HTML5 canvas library via react-konva
- **CSS Modules**: Scoped component styling

## License

Apache License 2.0
