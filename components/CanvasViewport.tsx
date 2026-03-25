'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Shape, Rect, Line, Circle, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import Latex from './Latex';
import { Camera, Point, screenToWorld } from '../lib/geometry';
import { getNextZoomLevel, clampZoom } from '../lib/zoom';
import {
  isComponentTool,
  isDrawingTool,
  type ComponentToolId,
  type ToolId,
} from '../lib/tools';
import { DOT_RADIUS, GRID_SPACING, snapToGrid } from './canvas/grid';
import {
  type ClipboardData,
  type CanvasFile,
  type ComponentEntity,
  type DrawingEntity,
  type NonWireDrawingToolId,
  type Rotation,
  type SceneData,
  type WireEntity,
} from './canvas/types';
import { useInteractionTriage } from './canvas/useInteractionTriage';
import styles from './CanvasViewport.module.css';
import { getComponentSymbolComponent, getDrawingSymbolComponent } from './symbols/toolSymbols';
import {
  LABEL_FONT_SIZE,
  LABEL_FONT_FAMILY,
  LABEL_PADDING_X,
  LABEL_PADDING_Y,
  MAX_TEXT_FONT_SIZE,
  MIN_TEXT_FONT_SIZE,
  getTextSymbolFontSize,
  hasLatexSyntax,
  measureRenderedText,
} from './symbols/textMetrics';

interface CanvasViewportProps {
  onContextMenu: (x: number, y: number) => void;
  selectedTool?: ToolId | '';
  onToolComplete?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  onViewportControlsChange?: (controls: CanvasViewportControls) => void;
}

export interface CanvasViewportControls {
  setZoomLevel: (zoom: number) => void;
  undo: () => void;
  redo: () => void;
  copySelection: () => void;
  cutSelection: () => void;
  pasteSelection: () => void;
  deleteSelection: () => void;
  serializeScene: () => CanvasFile;
  loadScene: (file: CanvasFile) => void;
}

const DRAG_THRESHOLD = 5;
const CANVAS_FILE_VERSION = 1;
const rotateBy90 = (rotation: Rotation) => ((rotation + 90) % 360) as Rotation;
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const DEFAULT_STROKE_COLOR = '#000000';
const DEFAULT_WIRE_STROKE_WIDTH = 1;
const WIRE_STROKE_WIDTH_OPTIONS = [1, 2, 3, 5] as const;
const WIRE_DASH_OPTIONS = [
  { id: 'solid', label: 'Solid', dash: [] as number[] },
  { id: 'short', label: 'Short', dash: [6, 4] as number[] },
  { id: 'medium', label: 'Medium', dash: [10, 6] as number[] },
  { id: 'dot', label: 'Dot', dash: [2, 4] as number[] },
] as const;
const QUICK_COLOR_PALETTE = ['#000000', '#4f80ff', '#e53935', '#fb8c00', '#43a047', '#8e24aa'];
const ZOOM_BASELINE = 2;

function normalizeColorForInput(color: string | undefined) {
  if (!color) {
    return DEFAULT_STROKE_COLOR;
  }
  if (/^#[\da-f]{3}$/i.test(color) || /^#[\da-f]{6}$/i.test(color)) {
    return color;
  }
  if (color.toLowerCase() === 'black') {
    return DEFAULT_STROKE_COLOR;
  }
  return DEFAULT_STROKE_COLOR;
}

function normalizeWireStrokeWidth(value: number | undefined) {
  if (!value || !Number.isFinite(value)) {
    return DEFAULT_WIRE_STROKE_WIDTH;
  }
  return WIRE_STROKE_WIDTH_OPTIONS.includes(value as (typeof WIRE_STROKE_WIDTH_OPTIONS)[number])
    ? value
    : DEFAULT_WIRE_STROKE_WIDTH;
}

function isBridgeDrawingTool(toolId: NonWireDrawingToolId | DrawingEntity['toolId']) {
  return toolId === 'bridge' || toolId === 'half-circle';
}

function normalizeWireDash(value: number[] | undefined) {
  if (!Array.isArray(value) || value.length === 0) {
    return [] as number[];
  }
  return value.filter((item) => Number.isFinite(item) && item >= 0);
}

function areDashArraysEqual(a: number[], b: number[]) {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function getWireDashOptionId(value: number[]) {
  const matched = WIRE_DASH_OPTIONS.find((option) => areDashArraysEqual(option.dash, value));
  return matched?.id ?? 'solid';
}

function getDrawingDisplayText(drawing: DrawingEntity) {
  if (drawing.toolId === 'text') {
    return drawing.text?.trim() || 'Text';
  }
  return '';
}

function cloneScene(scene: SceneData): SceneData {
  return {
    components: scene.components.map((component) => ({ ...component })),
    drawings: scene.drawings.map((drawing) => ({ ...drawing })),
    wires: scene.wires.map((wire) => ({
      ...wire,
      dash: wire.dash ? [...wire.dash] : [],
      vertices: wire.vertices.map((point) => ({ ...point })),
    })),
  };
}

function getBoundsCenter(bounds: { minX: number; maxX: number; minY: number; maxY: number }) {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

function mirrorX(x: number, centerX: number) {
  return centerX * 2 - x;
}

function toCanvasFile(scene: SceneData): CanvasFile {
  const clone = cloneScene(scene);
  return {
    version: CANVAS_FILE_VERSION,
    components: clone.components,
    drawings: clone.drawings,
    wires: clone.wires,
  };
}

function fromCanvasFile(file: CanvasFile): SceneData {
  return {
    components: file.components.map((component) => ({ ...component, flipped: component.flipped === true })),
    drawings: file.drawings.map((drawing) => ({
      ...drawing,
      strokeWidth: isBridgeDrawingTool(drawing.toolId)
        ? normalizeWireStrokeWidth(drawing.strokeWidth)
        : drawing.strokeWidth,
    })),
    wires: file.wires.map((wire) => ({
      ...wire,
      strokeWidth: normalizeWireStrokeWidth(wire.strokeWidth),
      dash: normalizeWireDash(wire.dash),
      vertices: wire.vertices.map((point) => ({ ...point })),
    })),
  };
}

function getAbsoluteWirePoints(wire: WireEntity): Point[] {
  return wire.vertices.map((point) => ({
    x: wire.x + point.x,
    y: wire.y + point.y,
  }));
}

function makeWireFromAbsolutePoints(
  id: string,
  points: Point[],
  strokeColor = DEFAULT_STROKE_COLOR,
  strokeWidth = DEFAULT_WIRE_STROKE_WIDTH,
  dash: number[] = []
): WireEntity {
  const first = points[0] ?? { x: 0, y: 0 };
  return {
    id,
    x: first.x,
    y: first.y,
    vertices: points.map((point, index) =>
      index === 0 ? { x: 0, y: 0 } : { x: point.x - first.x, y: point.y - first.y }
    ),
    strokeColor,
    strokeWidth: normalizeWireStrokeWidth(strokeWidth),
    dash: normalizeWireDash(dash),
  };
}

function setWireVertexAbsolute(wire: WireEntity, vertexIndex: number, next: Point): WireEntity {
  if (vertexIndex <= 0) {
    const delta = { x: next.x - wire.x, y: next.y - wire.y };
    return {
      ...wire,
      x: next.x,
      y: next.y,
      vertices: wire.vertices.map((vertex, index) =>
        index === 0 ? { x: 0, y: 0 } : { x: vertex.x - delta.x, y: vertex.y - delta.y }
      ),
    };
  }

  return {
    ...wire,
    vertices: wire.vertices.map((vertex, index) =>
      index === vertexIndex ? { x: next.x - wire.x, y: next.y - wire.y } : vertex
    ),
  };
}

function getSnappedWorld(pointer: Point, camera: Camera): Point {
  const world = screenToWorld(pointer, camera);
  return { x: snapToGrid(world.x), y: snapToGrid(world.y) };
}

function getComponentBounds(component: ComponentEntity) {
  const isHorizontal = component.rotation % 180 === 0;
  const halfWidth = isHorizontal ? 26 : 14;
  const halfHeight = isHorizontal ? 14 : 26;
  return {
    minX: component.x - halfWidth,
    maxX: component.x + halfWidth,
    minY: component.y - halfHeight,
    maxY: component.y + halfHeight,
  };
}

function getDrawingBounds(drawing: DrawingEntity) {
  if (drawing.toolId === 'joint' || drawing.toolId === 'port') {
    return {
      minX: drawing.x - 4,
      maxX: drawing.x + 4,
      minY: drawing.y - 4,
      maxY: drawing.y + 4,
    };
  }

  if (drawing.toolId === 'text') {
    const text = getDrawingDisplayText(drawing);
    const metrics = measureRenderedText(text, getTextSymbolFontSize(drawing.fontSize));
    const width = Math.max(24, metrics.width + LABEL_PADDING_X * 2);
    const height = Math.max(16, metrics.height + LABEL_PADDING_Y * 2);
    return {
      minX: drawing.x - width / 2,
      maxX: drawing.x + width / 2,
      minY: drawing.y - height / 2,
      maxY: drawing.y + height / 2,
    };
  }

  return {
    minX: drawing.x - 20,
    maxX: drawing.x + 20,
    minY: drawing.y - 14,
    maxY: drawing.y + 14,
  };
}

function getWireBounds(wire: WireEntity) {
  const points = getAbsoluteWirePoints(wire);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs) - 3,
    maxX: Math.max(...xs) + 3,
    minY: Math.min(...ys) - 3,
    maxY: Math.max(...ys) + 3,
  };
}

function getSelectionBounds(
  scene: SceneData,
  selection: { componentIds: Set<string>; drawingIds: Set<string>; wireIds: Set<string> }
) {
  const boundsList = [
    ...scene.components
      .filter((component) => selection.componentIds.has(component.id))
      .map(getComponentBounds),
    ...scene.drawings.filter((drawing) => selection.drawingIds.has(drawing.id)).map(getDrawingBounds),
    ...scene.wires.filter((wire) => selection.wireIds.has(wire.id)).map(getWireBounds),
  ];

  if (boundsList.length === 0) {
    return null;
  }

  return boundsList.reduce(
    (acc, bounds) => ({
      minX: Math.min(acc.minX, bounds.minX),
      maxX: Math.max(acc.maxX, bounds.maxX),
      minY: Math.min(acc.minY, bounds.minY),
      maxY: Math.max(acc.maxY, bounds.maxY),
    }),
    boundsList[0]
  );
}

function intersects(
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  rect: { minX: number; maxX: number; minY: number; maxY: number }
) {
  return (
    bounds.maxX >= rect.minX &&
    bounds.minX <= rect.maxX &&
    bounds.maxY >= rect.minY &&
    bounds.minY <= rect.maxY
  );
}

function ComponentGlyph({
  toolId,
  x,
  y,
  rotation,
  flipped = false,
  isSelected,
  draggable = false,
  listening = true,
  strokeColor = 'black',
  opacity = 1,
  onMouseDown,
  dragBoundFunc,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  toolId: ComponentToolId;
  x: number;
  y: number;
  rotation: Rotation;
  flipped?: boolean;
  isSelected: boolean;
  draggable?: boolean;
  listening?: boolean;
  strokeColor?: string;
  opacity?: number;
  onMouseDown?: (e: KonvaEventObject<MouseEvent>) => void;
  dragBoundFunc?: (pos: { x: number; y: number }) => { x: number; y: number };
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
}) {
  const SymbolComponent = getComponentSymbolComponent(toolId);

  return (
    <Group x={x} y={y} rotation={rotation} scaleX={flipped ? -1 : 1}>
      <SymbolComponent
        x={0}
        y={0}
        rotation={0}
        isSelected={isSelected}
        draggable={draggable}
        listening={listening}
        strokeColor={strokeColor}
        opacity={opacity}
        onMouseDown={onMouseDown}
        dragBoundFunc={dragBoundFunc}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    </Group>
  );
}

function DrawingGlyph({
  drawing,
  isSelected,
  draggable = false,
  listening = true,
  strokeColor = 'black',
  opacity = 1,
  onMouseDown,
  onDoubleClick,
  dragBoundFunc,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  drawing: DrawingEntity;
  isSelected: boolean;
  draggable?: boolean;
  listening?: boolean;
  strokeColor?: string;
  opacity?: number;
  onMouseDown?: (e: KonvaEventObject<MouseEvent>) => void;
  onDoubleClick?: (e: KonvaEventObject<MouseEvent>) => void;
  dragBoundFunc?: (pos: { x: number; y: number }) => { x: number; y: number };
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
}) {
  const SymbolComponent = getDrawingSymbolComponent(drawing.toolId);

  return (
    <SymbolComponent
      x={drawing.x}
      y={drawing.y}
      rotation={drawing.rotation}
      isSelected={isSelected}
      text={drawing.toolId === 'text' ? getDrawingDisplayText(drawing) : undefined}
      strokeWidth={isBridgeDrawingTool(drawing.toolId) ? normalizeWireStrokeWidth(drawing.strokeWidth) : undefined}
      border={drawing.toolId === 'text' ? drawing.border === true : undefined}
      fontSize={drawing.toolId === 'text' ? getTextSymbolFontSize(drawing.fontSize) : undefined}
      draggable={draggable}
      listening={listening}
      strokeColor={strokeColor}
      opacity={opacity}
      dragBoundFunc={dragBoundFunc}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    />
  );
}

export default function CanvasViewport({
  onContextMenu,
  selectedTool,
  onToolComplete,
  showGrid = true,
  onToggleGrid,
  onViewportControlsChange,
}: CanvasViewportProps) {
  const [camera, setCamera] = useState<Camera>({ offsetX: 400, offsetY: 300, zoom: ZOOM_BASELINE });
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [cursor, setCursor] = useState('default');
  const [isPanning, setIsPanning] = useState(false);

  const [mouseWorldPos, setMouseWorldPos] = useState<Point>({ x: 0, y: 0 });
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [placementRotation, setPlacementRotation] = useState<Rotation>(0);
  const [placementFlipped, setPlacementFlipped] = useState(false);

  const [scene, setScene] = useState<SceneData>({
    components: [],
    drawings: [],
    wires: [],
  });
  const [wireStrokeWidth, setWireStrokeWidth] = useState<number>(DEFAULT_WIRE_STROKE_WIDTH);
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState<number>(DEFAULT_WIRE_STROKE_WIDTH);
  const [wireDash, setWireDash] = useState<number[]>([]);
  const [isWireWidthMenuOpen, setIsWireWidthMenuOpen] = useState(false);
  const [isWireDashMenuOpen, setIsWireDashMenuOpen] = useState(false);
  const [wireDraft, setWireDraft] = useState<Point[] | null>(null);
  const [isWirePointDragging, setIsWirePointDragging] = useState(false);

  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([]);
  const [selectedWireIds, setSelectedWireIds] = useState<string[]>([]);
  const selectedComponentIdsRef = useRef<string[]>([]);
  const selectedDrawingIdsRef = useRef<string[]>([]);
  const selectedWireIdsRef = useRef<string[]>([]);
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [isPasteMode, setIsPasteMode] = useState(false);

  const [selectionRect, setSelectionRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const selectionStartRef = useRef<Point | null>(null);
  const isSelectingRef = useRef(false);

  const panStartRef = useRef<Point | null>(null);
  const rightMouseDownPosRef = useRef<Point | null>(null);
  const cameraStartRef = useRef<Camera | null>(null);

  const dragHistoryCapturedRef = useRef(false);
  const dragSnapshotRef = useRef<{
    components: Map<string, Point>;
    drawings: Map<string, Point>;
    wires: Map<string, Point>;
  } | null>(null);
  const sceneRef = useRef<SceneData>(scene);
  const undoStackRef = useRef<SceneData[]>([]);
  const redoStackRef = useRef<SceneData[]>([]);

  const { components, drawings, wires } = scene;

  const activeComponentTool = selectedTool && isComponentTool(selectedTool) ? selectedTool : null;
  const activeDrawingTool = selectedTool && isDrawingTool(selectedTool) ? selectedTool : null;
  const wireDashOptionId = useMemo(() => getWireDashOptionId(wireDash), [wireDash]);
  const wireDashLabel = useMemo(
    () => WIRE_DASH_OPTIONS.find((option) => option.id === wireDashOptionId)?.label ?? 'Solid',
    [wireDashOptionId]
  );
  const wireHoverPoint = useMemo<Point | null>(() => {
    if (activeDrawingTool !== 'wire') {
      return null;
    }
    return {
      x: snapToGrid(mouseWorldPos.x),
      y: snapToGrid(mouseWorldPos.y),
    };
  }, [activeDrawingTool, mouseWorldPos]);

  const selectedComponentSet = useMemo(() => new Set(selectedComponentIds), [selectedComponentIds]);
  const selectedDrawingSet = useMemo(() => new Set(selectedDrawingIds), [selectedDrawingIds]);
  const selectedWireSet = useMemo(() => new Set(selectedWireIds), [selectedWireIds]);
  const textDrawings = useMemo(
    () => drawings.filter((drawing) => drawing.toolId === 'text'),
    [drawings]
  );
  const selectedCount =
    selectedComponentIds.length + selectedDrawingIds.length + selectedWireIds.length;
  const singleSelection = useMemo(() => {
    if (selectedCount !== 1) {
      return null;
    }
    if (selectedComponentIds.length === 1) {
      return { kind: 'component' as const, id: selectedComponentIds[0] };
    }
    if (selectedDrawingIds.length === 1) {
      return { kind: 'drawing' as const, id: selectedDrawingIds[0] };
    }
    if (selectedWireIds.length === 1) {
      return { kind: 'wire' as const, id: selectedWireIds[0] };
    }
    return null;
  }, [selectedComponentIds, selectedCount, selectedDrawingIds, selectedWireIds]);
  const selectedStrokeColor = useMemo(() => {
    if (!singleSelection) {
      return DEFAULT_STROKE_COLOR;
    }
    if (singleSelection.kind === 'component') {
      return (
        components.find((item) => item.id === singleSelection.id)?.strokeColor ?? DEFAULT_STROKE_COLOR
      );
    }
    if (singleSelection.kind === 'drawing') {
      return (
        drawings.find((item) => item.id === singleSelection.id)?.strokeColor ?? DEFAULT_STROKE_COLOR
      );
    }
    return wires.find((item) => item.id === singleSelection.id)?.strokeColor ?? DEFAULT_STROKE_COLOR;
  }, [components, drawings, singleSelection, wires]);
  const selectedStrokeColorInput = useMemo(
    () => normalizeColorForInput(selectedStrokeColor),
    [selectedStrokeColor]
  );
  const selectedTextDrawing = useMemo(() => {
    if (singleSelection?.kind !== 'drawing') {
      return null;
    }
    const drawing = drawings.find((item) => item.id === singleSelection.id);
    if (!drawing || drawing.toolId !== 'text') {
      return null;
    }
    return drawing;
  }, [drawings, singleSelection]);
  const selectedTextFontSize = selectedTextDrawing
    ? getTextSymbolFontSize(selectedTextDrawing.fontSize)
    : LABEL_FONT_SIZE;
  const selectedTextBorder = selectedTextDrawing?.border === true;
  const selectedWire = useMemo(() => {
    if (singleSelection?.kind !== 'wire') {
      return null;
    }
    return wires.find((item) => item.id === singleSelection.id) ?? null;
  }, [singleSelection, wires]);
  const selectedWireStrokeWidth = normalizeWireStrokeWidth(selectedWire?.strokeWidth);
  const selectedBridgeDrawing = useMemo(() => {
    if (singleSelection?.kind !== 'drawing') {
      return null;
    }
    const drawing = drawings.find((item) => item.id === singleSelection.id);
    if (!drawing || !isBridgeDrawingTool(drawing.toolId)) {
      return null;
    }
    return drawing;
  }, [drawings, singleSelection]);
  const selectedBridgeStrokeWidth = normalizeWireStrokeWidth(selectedBridgeDrawing?.strokeWidth);
  const selectedWireDash = useMemo(() => normalizeWireDash(selectedWire?.dash), [selectedWire?.dash]);
  const selectedWireDashOptionId = useMemo(
    () => getWireDashOptionId(selectedWireDash),
    [selectedWireDash]
  );
  const selectedWireDashLabel = useMemo(
    () => WIRE_DASH_OPTIONS.find((option) => option.id === selectedWireDashOptionId)?.label ?? 'Solid',
    [selectedWireDashOptionId]
  );

  useEffect(() => {
    selectedComponentIdsRef.current = selectedComponentIds;
  }, [selectedComponentIds]);

  useEffect(() => {
    selectedDrawingIdsRef.current = selectedDrawingIds;
  }, [selectedDrawingIds]);

  useEffect(() => {
    selectedWireIdsRef.current = selectedWireIds;
  }, [selectedWireIds]);

  const shouldShowGrid = showGrid !== false;

  const applySelection = useCallback(
    (selection: { componentIds: string[]; drawingIds: string[]; wireIds: string[] }) => {
      selectedComponentIdsRef.current = selection.componentIds;
      selectedDrawingIdsRef.current = selection.drawingIds;
      selectedWireIdsRef.current = selection.wireIds;
      setSelectedComponentIds(selection.componentIds);
      setSelectedDrawingIds(selection.drawingIds);
      setSelectedWireIds(selection.wireIds);
    },
    []
  );

  const clearSelection = useCallback(() => {
    applySelection({ componentIds: [], drawingIds: [], wireIds: [] });
  }, [applySelection]);

  const updateScene = useCallback(
    (updater: (prev: SceneData) => SceneData, recordHistory = true) => {
      setScene((prev) => {
        const next = updater(prev);
        if (next === prev) {
          return prev;
        }
        if (recordHistory) {
          undoStackRef.current.push(cloneScene(prev));
          redoStackRef.current = [];
        }
        sceneRef.current = next;
        return next;
      });
    },
    []
  );

  const applySelectedStrokeColor = useCallback(
    (strokeColor: string) => {
      if (!singleSelection) {
        return;
      }
      updateScene((prev) => {
        if (singleSelection.kind === 'component') {
          let changed = false;
          const componentsNext = prev.components.map((component) => {
            if (component.id !== singleSelection.id) {
              return component;
            }
            if ((component.strokeColor ?? DEFAULT_STROKE_COLOR) === strokeColor) {
              return component;
            }
            changed = true;
            return { ...component, strokeColor };
          });
          return changed ? { ...prev, components: componentsNext } : prev;
        }

        if (singleSelection.kind === 'drawing') {
          let changed = false;
          const drawingsNext = prev.drawings.map((drawing) => {
            if (drawing.id !== singleSelection.id) {
              return drawing;
            }
            if ((drawing.strokeColor ?? DEFAULT_STROKE_COLOR) === strokeColor) {
              return drawing;
            }
            changed = true;
            return { ...drawing, strokeColor };
          });
          return changed ? { ...prev, drawings: drawingsNext } : prev;
        }

        let changed = false;
        const wiresNext = prev.wires.map((wire) => {
          if (wire.id !== singleSelection.id) {
            return wire;
          }
          if ((wire.strokeColor ?? DEFAULT_STROKE_COLOR) === strokeColor) {
            return wire;
          }
          changed = true;
          return { ...wire, strokeColor };
        });
        return changed ? { ...prev, wires: wiresNext } : prev;
      });
    },
    [singleSelection, updateScene]
  );

  const applySelectedTextBorder = useCallback(
    (border: boolean) => {
      if (!selectedTextDrawing) {
        return;
      }
      updateScene((prev) => {
        let changed = false;
        const drawingsNext = prev.drawings.map((drawing) => {
          if (drawing.id !== selectedTextDrawing.id || drawing.toolId !== 'text') {
            return drawing;
          }
          if ((drawing.border ?? false) === border) {
            return drawing;
          }
          changed = true;
          return { ...drawing, border };
        });
        return changed ? { ...prev, drawings: drawingsNext } : prev;
      });
    },
    [selectedTextDrawing, updateScene]
  );

  const nudgeSelectedTextFontSize = useCallback(
    (delta: number) => {
      if (!selectedTextDrawing) {
        return;
      }
      const nextFontSize = Math.min(
        MAX_TEXT_FONT_SIZE,
        Math.max(MIN_TEXT_FONT_SIZE, getTextSymbolFontSize(selectedTextDrawing.fontSize) + delta)
      );
      updateScene((prev) => {
        let changed = false;
        const drawingsNext = prev.drawings.map((drawing) => {
          if (drawing.id !== selectedTextDrawing.id || drawing.toolId !== 'text') {
            return drawing;
          }
          if (getTextSymbolFontSize(drawing.fontSize) === nextFontSize) {
            return drawing;
          }
          changed = true;
          return { ...drawing, fontSize: nextFontSize };
        });
        return changed ? { ...prev, drawings: drawingsNext } : prev;
      });
    },
    [selectedTextDrawing, updateScene]
  );

  const applySelectedWireStrokeWidth = useCallback(
    (strokeWidth: number) => {
      if (!selectedWire) {
        return;
      }
      const nextStrokeWidth = normalizeWireStrokeWidth(strokeWidth);
      updateScene((prev) => {
        let changed = false;
        const wiresNext = prev.wires.map((wire) => {
          if (wire.id !== selectedWire.id) {
            return wire;
          }
          if (normalizeWireStrokeWidth(wire.strokeWidth) === nextStrokeWidth) {
            return wire;
          }
          changed = true;
          return { ...wire, strokeWidth: nextStrokeWidth };
        });
        return changed ? { ...prev, wires: wiresNext } : prev;
      });
    },
    [selectedWire, updateScene]
  );

  const applySelectedWireDash = useCallback(
    (dash: number[]) => {
      if (!selectedWire) {
        return;
      }
      const nextDash = normalizeWireDash(dash);
      updateScene((prev) => {
        let changed = false;
        const wiresNext = prev.wires.map((wire) => {
          if (wire.id !== selectedWire.id) {
            return wire;
          }
          const currentDash = normalizeWireDash(wire.dash);
          if (areDashArraysEqual(currentDash, nextDash)) {
            return wire;
          }
          changed = true;
          return { ...wire, dash: nextDash };
        });
        return changed ? { ...prev, wires: wiresNext } : prev;
      });
    },
    [selectedWire, updateScene]
  );

  const applySelectedBridgeStrokeWidth = useCallback(
    (strokeWidth: number) => {
      if (!selectedBridgeDrawing) {
        return;
      }
      const nextStrokeWidth = normalizeWireStrokeWidth(strokeWidth);
      updateScene((prev) => {
        let changed = false;
        const drawingsNext = prev.drawings.map((drawing) => {
          if (drawing.id !== selectedBridgeDrawing.id) {
            return drawing;
          }
          if (!isBridgeDrawingTool(drawing.toolId)) {
            return drawing;
          }
          if (normalizeWireStrokeWidth(drawing.strokeWidth) === nextStrokeWidth) {
            return drawing;
          }
          changed = true;
          return { ...drawing, strokeWidth: nextStrokeWidth };
        });
        return changed ? { ...prev, drawings: drawingsNext } : prev;
      });
    },
    [selectedBridgeDrawing, updateScene]
  );

  const captureDragHistory = useCallback(() => {
    if (dragHistoryCapturedRef.current) {
      return;
    }
    undoStackRef.current.push(cloneScene(sceneRef.current));
    redoStackRef.current = [];
    dragHistoryCapturedRef.current = true;
  }, []);

  const updateSelectionForEntity = useCallback(
    (kind: 'component' | 'drawing' | 'wire', id: string, modifiers: { toggle: boolean; additive: boolean }) => {
      const current = {
        componentIds: selectedComponentIdsRef.current,
        drawingIds: selectedDrawingIdsRef.current,
        wireIds: selectedWireIdsRef.current,
      };

      const updateList = (list: string[]) => {
        if (modifiers.toggle) {
          return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
        }
        if (modifiers.additive) {
          return list.includes(id) ? list : [...list, id];
        }
        return [id];
      };

      if (!modifiers.toggle && !modifiers.additive) {
        if (kind === 'component') {
          if (current.componentIds.includes(id)) {
            return;
          }
          applySelection({ componentIds: [id], drawingIds: [], wireIds: [] });
        } else if (kind === 'drawing') {
          if (current.drawingIds.includes(id)) {
            return;
          }
          applySelection({ componentIds: [], drawingIds: [id], wireIds: [] });
        } else {
          if (current.wireIds.includes(id)) {
            return;
          }
          applySelection({ componentIds: [], drawingIds: [], wireIds: [id] });
        }
        return;
      }

      if (kind === 'component') {
        applySelection({
          componentIds: updateList(current.componentIds),
          drawingIds: current.drawingIds,
          wireIds: current.wireIds,
        });
      } else if (kind === 'drawing') {
        applySelection({
          componentIds: current.componentIds,
          drawingIds: updateList(current.drawingIds),
          wireIds: current.wireIds,
        });
      } else {
        applySelection({
          componentIds: current.componentIds,
          drawingIds: current.drawingIds,
          wireIds: updateList(current.wireIds),
        });
      }
    },
    [applySelection]
  );

  const interactionTriage = useInteractionTriage({
    dragThreshold: DRAG_THRESHOLD,
    onEntityMouseDown: updateSelectionForEntity,
    onEntityDragStart: ({ startWorld }) => {
      captureDragHistory();
      const selection = {
        componentIds: selectedComponentIdsRef.current,
        drawingIds: selectedDrawingIdsRef.current,
        wireIds: selectedWireIdsRef.current,
      };

      const snapshot = {
        components: new Map<string, Point>(),
        drawings: new Map<string, Point>(),
        wires: new Map<string, Point>(),
      };

      sceneRef.current.components.forEach((component) => {
        if (selection.componentIds.includes(component.id)) {
          snapshot.components.set(component.id, { x: component.x, y: component.y });
        }
      });
      sceneRef.current.drawings.forEach((drawing) => {
        if (selection.drawingIds.includes(drawing.id)) {
          snapshot.drawings.set(drawing.id, { x: drawing.x, y: drawing.y });
        }
      });
      sceneRef.current.wires.forEach((wire) => {
        if (selection.wireIds.includes(wire.id)) {
          snapshot.wires.set(wire.id, { x: wire.x, y: wire.y });
        }
      });

      dragSnapshotRef.current = snapshot;
    },
    onEntityDragMove: ({ world, startWorld }) => {
      const snapshot = dragSnapshotRef.current;
      if (!snapshot) return;

      const snappedWorld = { x: snapToGrid(world.x), y: snapToGrid(world.y) };
      const snappedStart = { x: snapToGrid(startWorld.x), y: snapToGrid(startWorld.y) };
      const delta = {
        x: snappedWorld.x - snappedStart.x,
        y: snappedWorld.y - snappedStart.y,
      };

      updateScene((prev) => ({
        ...prev,
        components: prev.components.map((component) => {
          const start = snapshot.components.get(component.id);
          if (!start) return component;
          return { ...component, x: start.x + delta.x, y: start.y + delta.y };
        }),
        drawings: prev.drawings.map((drawing) => {
          const start = snapshot.drawings.get(drawing.id);
          if (!start) return drawing;
          return { ...drawing, x: start.x + delta.x, y: start.y + delta.y };
        }),
        wires: prev.wires.map((wire) => {
          const start = snapshot.wires.get(wire.id);
          if (!start) return wire;
          return { ...wire, x: start.x + delta.x, y: start.y + delta.y };
        }),
      }), false);
    },
    onEntityDragEnd: () => {
      dragSnapshotRef.current = null;
      dragHistoryCapturedRef.current = false;
    },
    onCanvasClick: (modifiers) => {
      if (modifiers.additive || modifiers.toggle) {
        return;
      }
      clearSelection();
    },
    onMarqueeStart: (start) => {
      isSelectingRef.current = true;
      selectionStartRef.current = start;
      setSelectionRect({ x: start.x, y: start.y, width: 0, height: 0, visible: true });
    },
    onMarqueeMove: (rect) => {
      setSelectionRect({ ...rect, visible: true });
    },
    onMarqueeEnd: (rect, modifiers) => {
      const topLeft = screenToWorld({ x: rect.x, y: rect.y }, camera);
      const bottomRight = screenToWorld(
        { x: rect.x + rect.width, y: rect.y + rect.height },
        camera
      );
      const worldRect = {
        minX: Math.min(topLeft.x, bottomRight.x),
        maxX: Math.max(topLeft.x, bottomRight.x),
        minY: Math.min(topLeft.y, bottomRight.y),
        maxY: Math.max(topLeft.y, bottomRight.y),
      };

      const matchedDrawingIds = drawings
        .filter((drawing) => intersects(getDrawingBounds(drawing), worldRect))
        .map((drawing) => drawing.id);
      const matchedWireIds = wires
        .filter((wire) => intersects(getWireBounds(wire), worldRect))
        .map((wire) => wire.id);
      const matchedComponentIds = components
        .filter((component) => intersects(getComponentBounds(component), worldRect))
        .map((component) => component.id);

      const current = {
        componentIds: selectedComponentIdsRef.current,
        drawingIds: selectedDrawingIdsRef.current,
        wireIds: selectedWireIdsRef.current,
      };

      const union = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));
      const toggle = (base: string[], items: string[]) => {
        const set = new Set(base);
        items.forEach((id) => {
          if (set.has(id)) {
            set.delete(id);
          } else {
            set.add(id);
          }
        });
        return Array.from(set);
      };

      let next = {
        componentIds: matchedComponentIds,
        drawingIds: matchedDrawingIds,
        wireIds: matchedWireIds,
      };

      if (modifiers.additive) {
        next = {
          componentIds: union(current.componentIds, matchedComponentIds),
          drawingIds: union(current.drawingIds, matchedDrawingIds),
          wireIds: union(current.wireIds, matchedWireIds),
        };
      } else if (modifiers.toggle) {
        next = {
          componentIds: toggle(current.componentIds, matchedComponentIds),
          drawingIds: toggle(current.drawingIds, matchedDrawingIds),
          wireIds: toggle(current.wireIds, matchedWireIds),
        };
      }

      applySelection(next);
      isSelectingRef.current = false;
      selectionStartRef.current = null;
      setSelectionRect((prev) => ({ ...prev, visible: false }));
    },
  });

  const handleEntityMouseDown = useCallback(
    (kind: 'component' | 'drawing' | 'wire', id: string) => {
      return (e: KonvaEventObject<MouseEvent>) => {
        if (selectedTool || isPasteMode) return;
        e.cancelBubble = true;
        const stage = e.target.getStage();
        const pointer = stage?.getPointerPosition();
        if (!pointer) return;
        const world = screenToWorld(pointer, camera);
        const modifiers = { toggle: e.evt.ctrlKey || e.evt.metaKey, additive: e.evt.shiftKey };
        interactionTriage.handleEntityMouseDown(kind, id, pointer, world, modifiers);
      };
    },
    [camera, interactionTriage, isPasteMode, selectedTool]
  );

  const handleTextDoubleClick = useCallback(
    (drawing: DrawingEntity) => {
      return (e: KonvaEventObject<MouseEvent>) => {
        if (selectedTool || isPasteMode || drawing.toolId !== 'text') {
          return;
        }
        e.cancelBubble = true;
        const current = drawing.text ?? '';
        const next = window.prompt('Edit text (use $...$ and LaTeX syntax for equations):', current);
        if (next === null || next === current) {
          return;
        }
        updateScene((prev) => ({
          ...prev,
          drawings: prev.drawings.map((item) =>
            item.id === drawing.id ? { ...item, text: next } : item
          ),
        }));
      };
    },
    [isPasteMode, selectedTool, updateScene]
  );

  const undo = useCallback(() => {
    const previous = undoStackRef.current.pop();
    if (!previous) {
      return;
    }
    redoStackRef.current.push(cloneScene(sceneRef.current));
    const nextScene = cloneScene(previous);
    sceneRef.current = nextScene;
    setScene(nextScene);
    dragHistoryCapturedRef.current = false;
    clearSelection();
    setWireDraft(null);
    setIsPasteMode(false);
  }, [clearSelection]);

  const redo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) {
      return;
    }
    undoStackRef.current.push(cloneScene(sceneRef.current));
    const nextScene = cloneScene(next);
    sceneRef.current = nextScene;
    setScene(nextScene);
    dragHistoryCapturedRef.current = false;
    clearSelection();
    setWireDraft(null);
    setIsPasteMode(false);
  }, [clearSelection]);

  const copySelection = useCallback(() => {
    const selectedComponents = components.filter((component) => selectedComponentSet.has(component.id));
    const selectedDrawings = drawings.filter((drawing) => selectedDrawingSet.has(drawing.id));
    const selectedWires = wires.filter((wire) => selectedWireSet.has(wire.id));
    if (
      selectedComponents.length === 0 &&
      selectedDrawings.length === 0 &&
      selectedWires.length === 0
    ) {
      return false;
    }

    const allX = [
      ...selectedComponents.map((component) => component.x),
      ...selectedDrawings.map((drawing) => drawing.x),
      ...selectedWires.flatMap((wire) => getAbsoluteWirePoints(wire).map((point) => point.x)),
    ];
    const allY = [
      ...selectedComponents.map((component) => component.y),
      ...selectedDrawings.map((drawing) => drawing.y),
      ...selectedWires.flatMap((wire) => getAbsoluteWirePoints(wire).map((point) => point.y)),
    ];

    const anchor = { x: Math.min(...allX), y: Math.min(...allY) };
    setClipboard({
      components: selectedComponents.map((component) => ({
        toolId: component.toolId,
        x: component.x - anchor.x,
        y: component.y - anchor.y,
        rotation: component.rotation,
        flipped: component.flipped === true,
        strokeColor: component.strokeColor,
      })),
      drawings: selectedDrawings.map((drawing) => ({
        toolId: drawing.toolId,
        x: drawing.x - anchor.x,
        y: drawing.y - anchor.y,
        rotation: drawing.rotation,
        text: drawing.text,
        strokeColor: drawing.strokeColor,
        strokeWidth: drawing.strokeWidth,
        border: drawing.border,
        fontSize: drawing.fontSize,
      })),
      wires: selectedWires.map((wire) => ({
        points: getAbsoluteWirePoints(wire).map((point) => ({
          x: point.x - anchor.x,
          y: point.y - anchor.y,
        })),
        strokeColor: wire.strokeColor,
        strokeWidth: wire.strokeWidth,
        dash: wire.dash ? [...wire.dash] : [],
      })),
    });
    return true;
  }, [components, drawings, selectedComponentSet, selectedDrawingSet, selectedWireSet, wires]);

  const pasteSelection = useCallback(() => {
    if (!clipboard) {
      return false;
    }
    if (selectedTool) {
      onToolComplete?.();
    }
    setWireDraft(null);
    setIsPasteMode(true);
    clearSelection();
    return true;
  }, [clearSelection, clipboard, onToolComplete, selectedTool]);

  const deleteSelection = useCallback(() => {
    if (
      selectedComponentIds.length === 0 &&
      selectedDrawingIds.length === 0 &&
      selectedWireIds.length === 0
    ) {
      return false;
    }
    updateScene((prev) => ({
      components: prev.components.filter((component) => !selectedComponentSet.has(component.id)),
      drawings: prev.drawings.filter((drawing) => !selectedDrawingSet.has(drawing.id)),
      wires: prev.wires.filter((wire) => !selectedWireSet.has(wire.id)),
    }));
    clearSelection();
    return true;
  }, [
    clearSelection,
    selectedComponentIds.length,
    selectedComponentSet,
    selectedDrawingIds.length,
    selectedDrawingSet,
    selectedWireIds.length,
    selectedWireSet,
    updateScene,
  ]);

  const cutSelection = useCallback(() => {
    const didCopy = copySelection();
    if (!didCopy) {
      return false;
    }
    deleteSelection();
    return true;
  }, [copySelection, deleteSelection]);

  const serializeScene = useCallback(() => {
    return toCanvasFile(sceneRef.current);
  }, []);

  const mirrorSelection = useCallback(() => {
    const selection = {
      componentIds: new Set(selectedComponentIdsRef.current),
      drawingIds: new Set(selectedDrawingIdsRef.current),
      wireIds: new Set(selectedWireIdsRef.current),
    };

    if (
      selection.componentIds.size === 0 &&
      selection.drawingIds.size === 0 &&
      selection.wireIds.size === 0
    ) {
      return false;
    }
    const bounds = getSelectionBounds(sceneRef.current, selection);
    if (!bounds) {
      return false;
    }
    const center = getBoundsCenter(bounds);

    updateScene((prev) => ({
      ...prev,
      components: prev.components.map((component) =>
        selection.componentIds.has(component.id)
          ? {
              ...component,
              x: mirrorX(component.x, center.x),
              flipped: component.flipped !== true,
            }
          : component
      ),
      drawings: prev.drawings.map((drawing) =>
        selection.drawingIds.has(drawing.id)
          ? { ...drawing, x: mirrorX(drawing.x, center.x) }
          : drawing
      ),
      wires: prev.wires.map((wire) => {
        if (!selection.wireIds.has(wire.id)) {
          return wire;
        }
        const mirroredPoints = getAbsoluteWirePoints(wire).map((point) => ({
          x: mirrorX(point.x, center.x),
          y: point.y,
        }));
        return makeWireFromAbsolutePoints(
          wire.id,
          mirroredPoints,
          wire.strokeColor ?? DEFAULT_STROKE_COLOR,
          normalizeWireStrokeWidth(wire.strokeWidth),
          normalizeWireDash(wire.dash)
        );
      }),
    }));
    return true;
  }, [updateScene]);

  const loadScene = useCallback(
    (file: CanvasFile) => {
      const nextScene = fromCanvasFile(file);
      undoStackRef.current = [];
      redoStackRef.current = [];
      dragHistoryCapturedRef.current = false;
      sceneRef.current = nextScene;
      setScene(nextScene);
      clearSelection();
      setClipboard(null);
      setIsPasteMode(false);
      setWireDraft(null);
      setIsWirePointDragging(false);
    },
    [clearSelection]
  );

  const setZoomLevel = useCallback((targetZoom: number) => {
    const clamped = clampZoom(targetZoom);
    setCamera((prev) => {
      const stage = stageRef.current;
      if (!stage) {
        return { ...prev, zoom: clamped };
      }

      const stageCenter = { x: stage.width() / 2, y: stage.height() / 2 };
      const worldCenter = {
        x: (stageCenter.x - prev.offsetX) / prev.zoom,
        y: (stageCenter.y - prev.offsetY) / prev.zoom,
      };

      return {
        offsetX: stageCenter.x - worldCenter.x * clamped,
        offsetY: stageCenter.y - worldCenter.y * clamped,
        zoom: clamped,
      };
    });
  }, []);

  const viewportControls = useMemo<CanvasViewportControls>(
    () => ({
      setZoomLevel,
      undo,
      redo,
      copySelection: () => {
        copySelection();
      },
      cutSelection: () => {
        cutSelection();
      },
      pasteSelection: () => {
        pasteSelection();
      },
      deleteSelection: () => {
        deleteSelection();
      },
      serializeScene,
      loadScene,
    }),
    [
      copySelection,
      cutSelection,
      deleteSelection,
      loadScene,
      pasteSelection,
      redo,
      serializeScene,
      setZoomLevel,
      undo,
    ]
  );

  useEffect(() => {
    if (onViewportControlsChange) {
      onViewportControlsChange(viewportControls);
    }
  }, [onViewportControlsChange, viewportControls]);

  useEffect(() => {
    const closeMenus = () => {
      setIsWireWidthMenuOpen(false);
      setIsWireDashMenuOpen(false);
    };
    window.addEventListener('pointerdown', closeMenus);
    return () => window.removeEventListener('pointerdown', closeMenus);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      setStageSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const renderGrid = useCallback(() => {
    const topLeft = screenToWorld({ x: 0, y: 0 }, camera);
    const bottomRight = screenToWorld({ x: stageSize.width, y: stageSize.height }, camera);

    const minX = Math.floor(topLeft.x / GRID_SPACING) - 1;
    const maxX = Math.ceil(bottomRight.x / GRID_SPACING) + 1;
    const minY = Math.floor(topLeft.y / GRID_SPACING) - 1;
    const maxY = Math.ceil(bottomRight.y / GRID_SPACING) + 1;

    return (
      <Shape
        sceneFunc={(context, shape) => {
          const dotRadius = DOT_RADIUS / camera.zoom;
          context.fillStyle = '#a0a0a0';

          for (let gx = minX; gx <= maxX; gx += 1) {
            for (let gy = minY; gy <= maxY; gy += 1) {
              context.beginPath();
              context.arc(gx * GRID_SPACING, gy * GRID_SPACING, dotRadius, 0, Math.PI * 2);
              context.fill();
            }
          }

          context.fillStrokeShape(shape);
        }}
        listening={false}
      />
    );
  }, [camera, stageSize]);

  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const oldScale = camera.zoom;
      const newScale = getNextZoomLevel(oldScale, e.evt.deltaY < 0);
      if (newScale === oldScale) return;

      const mousePointTo = {
        x: (pointer.x - camera.offsetX) / oldScale,
        y: (pointer.y - camera.offsetY) / oldScale,
      };

      setCamera({
        offsetX: pointer.x - mousePointTo.x * newScale,
        offsetY: pointer.y - mousePointTo.y * newScale,
        zoom: newScale,
      });
    },
    [camera]
  );

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      if (e.evt.button === 2) {
        e.evt.preventDefault();
        rightMouseDownPosRef.current = pointer;
        panStartRef.current = pointer;
        cameraStartRef.current = { ...camera };
        return;
      }

      if (e.evt.button !== 0) return;

      const targetClass = e.target.getClassName();
      const clickedOnCanvas = e.target === stage || targetClass === 'Layer';
      const modifiers = { toggle: e.evt.ctrlKey || e.evt.metaKey, additive: e.evt.shiftKey };

      if (selectedTool) {
        const snapped = getSnappedWorld(pointer, camera);

        if (activeComponentTool) {
          const componentId = makeId('component');
          updateScene((prev) => ({
            ...prev,
            components: [
              ...prev.components,
              {
                id: componentId,
                toolId: activeComponentTool,
                x: snapped.x,
                y: snapped.y,
                rotation: placementRotation,
                flipped: placementFlipped,
                strokeColor: DEFAULT_STROKE_COLOR,
              },
            ],
          }));
          applySelection({ componentIds: [componentId], drawingIds: [], wireIds: [] });
          return;
        }

        if (activeDrawingTool === 'wire') {
          clearSelection();
          setWireDraft((prev) => {
            if (!prev || prev.length === 0) {
              return [snapped];
            }
            const last = prev[prev.length - 1];
            if (last.x === snapped.x && last.y === snapped.y) {
              return prev;
            }
            return [...prev, snapped];
          });
          return;
        }

        if (activeDrawingTool) {
          const defaultText = activeDrawingTool === 'text' ? 'Text' : undefined;
          updateScene((prev) => ({
            ...prev,
            drawings: [
              ...prev.drawings,
              {
                id: makeId('drawing'),
                toolId: activeDrawingTool,
                x: snapped.x,
                y: snapped.y,
                rotation: placementRotation,
                text: defaultText,
                strokeColor: DEFAULT_STROKE_COLOR,
                strokeWidth: isBridgeDrawingTool(activeDrawingTool) ? drawingStrokeWidth : undefined,
                border: false,
                fontSize: LABEL_FONT_SIZE,
              },
            ],
          }));
          clearSelection();
          return;
        }
      }

      if (isPasteMode && clipboard) {
        const snapped = getSnappedWorld(pointer, camera);
        updateScene((prev) => ({
          components: [
            ...prev.components,
            ...clipboard.components.map((component) => ({
              ...component,
              id: makeId('component'),
              x: snapToGrid(component.x + snapped.x),
              y: snapToGrid(component.y + snapped.y),
            })),
          ],
          drawings: [
            ...prev.drawings,
            ...clipboard.drawings.map((drawing) => ({
              ...drawing,
              id: makeId('drawing'),
              x: snapToGrid(drawing.x + snapped.x),
              y: snapToGrid(drawing.y + snapped.y),
            })),
          ],
          wires: [
            ...prev.wires,
            ...clipboard.wires.map((wire) =>
              makeWireFromAbsolutePoints(
                makeId('wire'),
                wire.points.map((point) => ({
                  x: snapToGrid(point.x + snapped.x),
                  y: snapToGrid(point.y + snapped.y),
                })),
                wire.strokeColor ?? DEFAULT_STROKE_COLOR,
                wire.strokeWidth ?? DEFAULT_WIRE_STROKE_WIDTH,
                wire.dash ?? []
              )
            ),
          ],
        }));
        clearSelection();
        return;
      }

      if (!selectedTool && clickedOnCanvas && !isPasteMode) {
        interactionTriage.handleCanvasMouseDown(pointer, screenToWorld(pointer, camera), modifiers);
      }
    },
    [
      activeComponentTool,
      activeDrawingTool,
      camera,
      clipboard,
      clearSelection,
      interactionTriage,
      isPasteMode,
      placementRotation,
      selectedTool,
      updateScene,
    ]
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const world = screenToWorld(pointer, camera);
      setMouseWorldPos(world);

      if (selectedTool || isPasteMode) {
        setHoverPoint(getSnappedWorld(pointer, camera));
      }

      if (panStartRef.current && cameraStartRef.current && rightMouseDownPosRef.current) {
        const dx = pointer.x - panStartRef.current.x;
        const dy = pointer.y - panStartRef.current.y;

        const dist = Math.hypot(
          pointer.x - rightMouseDownPosRef.current.x,
          pointer.y - rightMouseDownPosRef.current.y
        );

        if (dist > DRAG_THRESHOLD) {
          if (!isPanning) {
            setIsPanning(true);
            setCursor('grabbing');
          }
          setCamera({
            ...camera,
            offsetX: cameraStartRef.current.offsetX + dx,
            offsetY: cameraStartRef.current.offsetY + dy,
          });
        }
      }

      if (!selectedTool && !isPasteMode) {
        interactionTriage.handlePointerMove(pointer, world);
      }
    },
    [camera, interactionTriage, isPanning, isPasteMode, selectedTool]
  );

  const handleMouseUp = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 2) {
        e.evt.preventDefault();

        const stage = e.target.getStage();
        const pointer = stage?.getPointerPosition();

        if (pointer && rightMouseDownPosRef.current) {
          const dist = Math.hypot(
            pointer.x - rightMouseDownPosRef.current.x,
            pointer.y - rightMouseDownPosRef.current.y
          );
          if (dist <= DRAG_THRESHOLD) {
            onContextMenu(pointer.x, pointer.y);
          }
        }

        setIsPanning(false);
        setCursor('default');
        panStartRef.current = null;
        rightMouseDownPosRef.current = null;
        cameraStartRef.current = null;
        return;
      }

      if (e.evt.button !== 0 || selectedTool || isPasteMode) {
        return;
      }

      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (pointer) {
        interactionTriage.handlePointerUp(pointer);
      }
    },
    [interactionTriage, isPasteMode, onContextMenu, selectedTool]
  );

  const handleWirePointDragStart = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      setIsWirePointDragging(true);
      captureDragHistory();
    },
    [captureDragHistory]
  );

  const handleWirePointDragMove = useCallback(
    (wireId: string, pointIndex: number) => {
      return (e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const parent = e.target.getParent();
        const baseX = parent?.x() ?? 0;
        const baseY = parent?.y() ?? 0;
        const { x, y } = e.target.position();
        const snappedX = snapToGrid(baseX + x);
        const snappedY = snapToGrid(baseY + y);
        e.target.position({ x: snappedX - baseX, y: snappedY - baseY });
        updateScene((prev) => ({
          ...prev,
          wires: prev.wires.map((wire) => {
            if (wire.id !== wireId) return wire;
            return setWireVertexAbsolute(wire, pointIndex, {
              x: snappedX,
              y: snappedY,
            });
          }),
        }), false);
      };
    },
    [updateScene]
  );

  const handleWirePointDragEnd = useCallback(
    (wireId: string, pointIndex: number) => {
      return (e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const { x, y } = e.target.position();
        updateScene((prev) => ({
          ...prev,
          wires: prev.wires.map((wire) => {
            if (wire.id !== wireId) return wire;
            return setWireVertexAbsolute(wire, pointIndex, {
              x: snapToGrid(wire.x + x),
              y: snapToGrid(wire.y + y),
            });
          }),
        }), false);
        dragHistoryCapturedRef.current = false;
        setIsWirePointDragging(false);
      };
    },
    [updateScene]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }

      const key = event.key.toLowerCase();
      const isModKey = event.metaKey || event.ctrlKey;

      if (key === 'g' && onToggleGrid) {
        event.preventDefault();
        onToggleGrid();
        return;
      }

      if (isModKey && key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (isModKey && key === 'z') {
        event.preventDefault();
        undo();
        return;
      }

      if (isModKey && key === 'y') {
        event.preventDefault();
        redo();
        return;
      }

      if (key === 'escape') {
        if (isPasteMode) {
          event.preventDefault();
          setIsPasteMode(false);
          return;
        }

        if (activeDrawingTool === 'wire') {
          event.preventDefault();
          if (wireDraft && wireDraft.length >= 2) {
            updateScene((prev) => ({
              ...prev,
              wires: [
                ...prev.wires,
                makeWireFromAbsolutePoints(
                  makeId('wire'),
                  wireDraft,
                  DEFAULT_STROKE_COLOR,
                  wireStrokeWidth,
                  wireDash
                ),
              ],
            }));
          }
          setWireDraft(null);
        }

        if (selectedTool) {
          event.preventDefault();
          onToolComplete?.();
        }
        return;
      }

      if (isModKey && key === 'x') {
        if (cutSelection()) {
          event.preventDefault();
        }
        return;
      }

      if (isModKey && key === 'c') {
        if (copySelection()) {
          event.preventDefault();
        }
        return;
      }

      if (isModKey && key === 'v') {
        if (pasteSelection()) {
          event.preventDefault();
        }
        return;
      }

      if (key === 'delete') {
        if (deleteSelection()) {
          event.preventDefault();
        }
        return;
      }

      if (key === 'r') {
        if (
          selectedComponentIdsRef.current.length > 0 ||
          selectedDrawingIdsRef.current.length > 0
        ) {
          event.preventDefault();
          updateScene((prev) => ({
            ...prev,
            components: prev.components.map((component) =>
              selectedComponentIdsRef.current.includes(component.id)
                ? { ...component, rotation: rotateBy90(component.rotation) }
                : component
            ),
            drawings: prev.drawings.map((drawing) =>
              selectedDrawingIdsRef.current.includes(drawing.id)
                ? { ...drawing, rotation: rotateBy90(drawing.rotation) }
                : drawing
            ),
          }));
          return;
        }

        if (selectedTool) {
          event.preventDefault();
          setPlacementRotation((prev) => rotateBy90(prev));
        }
        return;
      }

      if (key === 'e') {
        if (mirrorSelection()) {
          event.preventDefault();
          return;
        }
        if (activeComponentTool) {
          event.preventDefault();
          setPlacementFlipped((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeDrawingTool,
    copySelection,
    cutSelection,
    deleteSelection,
    isPasteMode,
    mirrorSelection,
    onToggleGrid,
    onToolComplete,
    pasteSelection,
    redo,
    selectedComponentSet,
    selectedDrawingSet,
    selectedTool,
    undo,
    updateScene,
    wireDash,
    wireDraft,
    wireStrokeWidth,
  ]);

  useEffect(() => {
    if (selectedTool !== 'wire' && !isBridgeDrawingTool(selectedTool as NonWireDrawingToolId)) {
      setIsWireWidthMenuOpen(false);
    }
    if (selectedTool !== 'wire') {
      setIsWireDashMenuOpen(false);
    }

    if (selectedTool && isPasteMode) {
      setIsPasteMode(false);
    }

    if (!selectedTool && !isPasteMode) {
      setHoverPoint(null);
      setPlacementRotation(0);
      setPlacementFlipped(false);
      setWireDraft(null);
    }

    if (selectedTool && !isDrawingTool(selectedTool)) {
      setWireDraft(null);
    }
  }, [isPasteMode, selectedTool]);

  const handleMouseLeave = useCallback(() => {
    setHoverPoint(null);

    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      selectionStartRef.current = null;
      setSelectionRect((prev) => ({ ...prev, visible: false }));
    }
    interactionTriage.reset();
  }, []);

  const handleContextMenuEvent = useCallback((e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
  }, []);

  const handleContainerContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className={styles.canvasContainer}
      ref={containerRef}
      onContextMenu={handleContainerContextMenu}
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenuEvent}
        ref={stageRef}
        style={{ cursor }}
      >
        <Layer x={camera.offsetX} y={camera.offsetY} scaleX={camera.zoom} scaleY={camera.zoom}>
          {shouldShowGrid && renderGrid()}
        </Layer>

        <Layer x={camera.offsetX} y={camera.offsetY} scaleX={camera.zoom} scaleY={camera.zoom}>
          {components.map((component) => (
            <ComponentGlyph
              key={component.id}
              toolId={component.toolId}
              x={component.x}
              y={component.y}
              rotation={component.rotation}
              flipped={component.flipped === true}
              strokeColor={component.strokeColor ?? DEFAULT_STROKE_COLOR}
              isSelected={selectedComponentSet.has(component.id)}
              onMouseDown={handleEntityMouseDown('component', component.id)}
            />
          ))}

          {activeComponentTool && hoverPoint && (
            <ComponentGlyph
              toolId={activeComponentTool}
              x={hoverPoint.x}
              y={hoverPoint.y}
              rotation={placementRotation}
              flipped={placementFlipped}
              isSelected={false}
              listening={false}
              strokeColor="#888888"
              opacity={0.6}
            />
          )}

          {isPasteMode && clipboard && hoverPoint &&
            clipboard.components.map((component, componentIndex) => (
              <ComponentGlyph
                key={`paste-component-${componentIndex}`}
                toolId={component.toolId}
                x={component.x + hoverPoint.x}
                y={component.y + hoverPoint.y}
                rotation={component.rotation}
                flipped={component.flipped === true}
                isSelected={false}
                listening={false}
                strokeColor="#888888"
                opacity={0.6}
              />
            ))}
        </Layer>

        <Layer x={camera.offsetX} y={camera.offsetY} scaleX={camera.zoom} scaleY={camera.zoom}>
          {wires.map((wire) => {
            const relativePoints = wire.vertices.flatMap((point) => [point.x, point.y]);
            const isSelected = selectedWireSet.has(wire.id);
            const lineWidth = normalizeWireStrokeWidth(wire.strokeWidth);
            const lineDash = normalizeWireDash(wire.dash);
            return (
              <React.Fragment key={wire.id}>
                <Group
                  x={wire.x}
                  y={wire.y}
                  onMouseDown={handleEntityMouseDown('wire', wire.id)}
                >
                  <Line
                    points={relativePoints}
                    stroke={wire.strokeColor ?? DEFAULT_STROKE_COLOR}
                    strokeWidth={lineWidth}
                    dash={lineDash}
                    lineJoin="round"
                    lineCap="round"
                    hitStrokeWidth={Math.max(6, lineWidth + 4)}
                  />
                  {isSelected && !selectedTool && !isPasteMode &&
                    wire.vertices.map((point, index) => (
                      <Circle
                        key={`${wire.id}-point-${index}`}
                        x={point.x}
                        y={point.y}
                        radius={4}
                        fill="#ffffff"
                        stroke="#4f80ff"
                        strokeWidth={1}
                        draggable={true}
                    onDragStart={handleWirePointDragStart}
                        onDragMove={handleWirePointDragMove(wire.id, index)}
                        onDragEnd={handleWirePointDragEnd(wire.id, index)}
                      />
                    ))}
                </Group>
              </React.Fragment>
            );
          })}

          {drawings.map((drawing) => (
            <DrawingGlyph
              key={drawing.id}
              drawing={drawing}
              strokeColor={drawing.strokeColor ?? DEFAULT_STROKE_COLOR}
              isSelected={selectedDrawingSet.has(drawing.id)}
              onMouseDown={handleEntityMouseDown('drawing', drawing.id)}
              onDoubleClick={handleTextDoubleClick(drawing)}
            />
          ))}

          {isPasteMode && clipboard && hoverPoint &&
            clipboard.wires.map((wire, wireIndex) => (
              <Line
                key={`paste-wire-${wireIndex}`}
                points={wire.points
                  .flatMap((point) => [point.x + hoverPoint.x, point.y + hoverPoint.y])}
                stroke="#888888"
                strokeWidth={normalizeWireStrokeWidth(wire.strokeWidth)}
                dash={normalizeWireDash(wire.dash)}
                lineJoin="round"
                lineCap="round"
                opacity={0.6}
                listening={false}
              />
            ))}

          {wireDraft && wireDraft.length >= 2 && (
            <Line
              points={wireDraft.flatMap((point) => [point.x, point.y])}
              stroke={DEFAULT_STROKE_COLOR}
              strokeWidth={wireStrokeWidth}
              dash={wireDash}
              lineJoin="round"
              lineCap="round"
              listening={false}
            />
          )}

          {activeDrawingTool === 'wire' && wireDraft && wireHoverPoint && wireDraft.length >= 1 && (
            <Line
              points={[...wireDraft, wireHoverPoint].flatMap((point) => [point.x, point.y])}
              stroke="#888888"
              strokeWidth={wireStrokeWidth}
              dash={wireDash}
              lineJoin="round"
              lineCap="round"
              opacity={0.6}
              listening={false}
            />
          )}

          {activeDrawingTool === 'wire' && wireHoverPoint && (
            <Circle x={wireHoverPoint.x} y={wireHoverPoint.y} radius={2} fill="#888888" opacity={0.6} listening={false} />
          )}

          {activeDrawingTool && activeDrawingTool !== 'wire' && hoverPoint && (
            <DrawingGlyph
              drawing={{
                id: 'preview',
                toolId: activeDrawingTool as NonWireDrawingToolId,
                x: hoverPoint.x,
                y: hoverPoint.y,
                rotation: placementRotation,
                strokeWidth: isBridgeDrawingTool(activeDrawingTool as NonWireDrawingToolId)
                  ? drawingStrokeWidth
                  : undefined,
              }}
              isSelected={false}
              listening={false}
              strokeColor="#888888"
              opacity={0.6}
            />
          )}

          {isPasteMode && clipboard && hoverPoint &&
            clipboard.drawings.map((drawing, drawingIndex) => (
              <DrawingGlyph
                key={`paste-drawing-${drawingIndex}`}
                drawing={{
                  id: `paste-drawing-${drawingIndex}`,
                  ...drawing,
                  x: drawing.x + hoverPoint.x,
                  y: drawing.y + hoverPoint.y,
                }}
                isSelected={false}
                listening={false}
                strokeColor="#888888"
                opacity={0.6}
              />
            ))}
        </Layer>

      </Stage>

      <div className={styles.latexOverlay}>
        {textDrawings.map((drawing) => {
          const content = getDrawingDisplayText(drawing);
          const isLatex = hasLatexSyntax(content);
          const fontSize = getTextSymbolFontSize(drawing.fontSize);
          const metrics = measureRenderedText(content, fontSize);
          const boxWidth = Math.max(24, metrics.width + LABEL_PADDING_X * 2);
          const boxHeight = Math.max(16, metrics.height + LABEL_PADDING_Y * 2);
          const color = drawing.strokeColor ?? DEFAULT_STROKE_COLOR;
          const showBorder = drawing.border === true;
          return (
            <div
              key={`latex-${drawing.id}`}
              className={styles.latexNode}
              style={{
                left: camera.offsetX + drawing.x * camera.zoom,
                top: camera.offsetY + drawing.y * camera.zoom,
                width: `${boxWidth}px`,
                height: `${boxHeight}px`,
                transform: `translate(-50%, -50%) rotate(${drawing.rotation}deg) scale(${camera.zoom})`,
                color,
                border: showBorder ? `1.2px solid ${color}` : 'none',
              }}
            >
              <div
                className={styles.latexContent}
                style={{
                  width: `${boxWidth - LABEL_PADDING_X * 2}px`,
                  height: `${boxHeight - LABEL_PADDING_Y * 2}px`,
                  fontFamily: isLatex ? undefined : LABEL_FONT_FAMILY,
                  fontSize: `${fontSize}px`,
                }}
              >
                {isLatex ? <Latex>{content}</Latex> : content}
              </div>
            </div>
          );
        })}
      </div>

      {selectionRect.visible && (
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          className={styles.selectionOverlay}
          listening={false}
        >
          <Layer>
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              stroke="#4f80ff"
              strokeWidth={1}
              dash={[4, 4]}
              fill="rgba(79, 128, 255, 0.1)"
            />
          </Layer>
        </Stage>
      )}

      <div className={styles.hud}>
        <div>Zoom: {((camera.zoom / ZOOM_BASELINE) * 100).toFixed(0)}%</div>
        <div>
          Position: ({mouseWorldPos.x.toFixed(0)}, {mouseWorldPos.y.toFixed(0)})
        </div>
      </div>

      {selectedTool === 'wire' && (
        <div className={styles.bottomEditorBar}>
          <span className={styles.editorLabel}>Wire</span>
          <div className={styles.menuGroup}>
            <button
              type="button"
              className={styles.menuButton}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setIsWireDashMenuOpen(false);
                setIsWireWidthMenuOpen((prev) => !prev);
              }}
            >
              Thickness: {wireStrokeWidth}
            </button>
            {isWireWidthMenuOpen && (
              <div className={styles.upwardMenu} onPointerDown={(event) => event.stopPropagation()}>
                {WIRE_STROKE_WIDTH_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.menuItemButton} ${wireStrokeWidth === value ? styles.menuItemButtonActive : ''}`}
                    onClick={() => {
                      setWireStrokeWidth(value);
                      setIsWireWidthMenuOpen(false);
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.menuGroup}>
            <button
              type="button"
              className={styles.menuButton}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setIsWireWidthMenuOpen(false);
                setIsWireDashMenuOpen((prev) => !prev);
              }}
            >
              Dashes: {wireDashLabel}
            </button>
            {isWireDashMenuOpen && (
              <div className={styles.upwardMenu} onPointerDown={(event) => event.stopPropagation()}>
                {WIRE_DASH_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.menuItemButton} ${wireDashOptionId === option.id ? styles.menuItemButtonActive : ''}`}
                    onClick={() => {
                      setWireDash([...option.dash]);
                      setIsWireDashMenuOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {(selectedTool === 'bridge' || selectedTool === 'half-circle') && (
        <div className={styles.bottomEditorBar}>
          <span className={styles.editorLabel}>
            {selectedTool === 'bridge' ? 'Bridge' : 'Half-circle'}
          </span>
          <div className={styles.menuGroup}>
            <button
              type="button"
              className={styles.menuButton}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setIsWireWidthMenuOpen((prev) => !prev);
              }}
            >
              Thickness: {drawingStrokeWidth}
            </button>
            {isWireWidthMenuOpen && (
              <div className={styles.upwardMenu} onPointerDown={(event) => event.stopPropagation()}>
                {WIRE_STROKE_WIDTH_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.menuItemButton} ${drawingStrokeWidth === value ? styles.menuItemButtonActive : ''}`}
                    onClick={() => {
                      setDrawingStrokeWidth(value);
                      setIsWireWidthMenuOpen(false);
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {singleSelection && !selectedTool && !isPasteMode && (
        <div className={styles.bottomEditorBar}>
          <span className={styles.editorLabel}>Color</span>
          <div className={styles.paletteRow}>
            {QUICK_COLOR_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                className={`${styles.colorSwatch} ${selectedStrokeColorInput.toLowerCase() === color.toLowerCase() ? styles.colorSwatchActive : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => applySelectedStrokeColor(color)}
                aria-label={`Set color ${color}`}
                title={color}
              />
            ))}
          </div>
          <label className={styles.pickerLabel}>
            Picker
            <input
              type="color"
              value={selectedStrokeColorInput}
              className={styles.colorPicker}
              onChange={(event) => applySelectedStrokeColor(event.target.value)}
              aria-label="Pick custom color"
            />
          </label>
          {selectedBridgeDrawing && (
            <div className={styles.menuGroup}>
              <button
                type="button"
                className={styles.menuButton}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsWireDashMenuOpen(false);
                  setIsWireWidthMenuOpen((prev) => !prev);
                }}
              >
                Thickness: {selectedBridgeStrokeWidth}
              </button>
              {isWireWidthMenuOpen && (
                <div className={styles.upwardMenu} onPointerDown={(event) => event.stopPropagation()}>
                  {WIRE_STROKE_WIDTH_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.menuItemButton} ${selectedBridgeStrokeWidth === value ? styles.menuItemButtonActive : ''}`}
                      onClick={() => {
                        applySelectedBridgeStrokeWidth(value);
                        setIsWireWidthMenuOpen(false);
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedWire && (
            <>
              <div className={styles.menuGroup}>
                <button
                  type="button"
                  className={styles.menuButton}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsWireDashMenuOpen(false);
                    setIsWireWidthMenuOpen((prev) => !prev);
                  }}
                >
                  Thickness: {selectedWireStrokeWidth}
                </button>
                {isWireWidthMenuOpen && (
                  <div className={styles.upwardMenu} onPointerDown={(event) => event.stopPropagation()}>
                    {WIRE_STROKE_WIDTH_OPTIONS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`${styles.menuItemButton} ${selectedWireStrokeWidth === value ? styles.menuItemButtonActive : ''}`}
                        onClick={() => {
                          applySelectedWireStrokeWidth(value);
                          setIsWireWidthMenuOpen(false);
                        }}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.menuGroup}>
                <button
                  type="button"
                  className={styles.menuButton}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsWireWidthMenuOpen(false);
                    setIsWireDashMenuOpen((prev) => !prev);
                  }}
                >
                  Dashes: {selectedWireDashLabel}
                </button>
                {isWireDashMenuOpen && (
                  <div className={styles.upwardMenu} onPointerDown={(event) => event.stopPropagation()}>
                    {WIRE_DASH_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.menuItemButton} ${selectedWireDashOptionId === option.id ? styles.menuItemButtonActive : ''}`}
                        onClick={() => {
                          applySelectedWireDash(option.dash);
                          setIsWireDashMenuOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          {selectedTextDrawing && (
            <>
              <label className={styles.toggleLabel}>
                Border
                <input
                  type="checkbox"
                  checked={selectedTextBorder}
                  onChange={(event) => applySelectedTextBorder(event.target.checked)}
                />
              </label>
              <div className={styles.fontControls}>
                <button
                  type="button"
                  className={styles.fontButton}
                  onClick={() => nudgeSelectedTextFontSize(-1)}
                  aria-label="Decrease font size"
                >
                  -
                </button>
                <span className={styles.fontSizeReadout}>{selectedTextFontSize}px</span>
                <button
                  type="button"
                  className={styles.fontButton}
                  onClick={() => nudgeSelectedTextFontSize(1)}
                  aria-label="Increase font size"
                >
                  +
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
