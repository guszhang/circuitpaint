'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Shape, Rect, Line, Circle, Group, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
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
  type ComponentEntity,
  type DrawingEntity,
  type NonWireDrawingToolId,
  type Rotation,
  type SceneData,
  type WireEntity,
} from './canvas/types';
import { useComponentEventHandlers } from './canvas/useComponentEventHandlers';
import { useDrawingEventHandlers } from './canvas/useDrawingEventHandlers';
import { useWireEventHandlers } from './canvas/useWireEventHandlers';
import styles from './CanvasViewport.module.css';
import ResistorSymbol, { type ResistorRotation } from './ResistorSymbol';

interface CanvasViewportProps {
  onContextMenu: (x: number, y: number) => void;
  selectedTool?: ToolId | '';
  onToolComplete?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  onRegisterViewportControls?: (controls: CanvasViewportControls) => void;
}

export interface CanvasViewportControls {
  setZoomLevel: (zoom: number) => void;
  undo: () => void;
  redo: () => void;
  copySelection: () => void;
  cutSelection: () => void;
  pasteSelection: () => void;
  deleteSelection: () => void;
}

const DRAG_THRESHOLD = 5;
const rotateBy90 = (rotation: Rotation) => ((rotation + 90) % 360) as Rotation;
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function cloneScene(scene: SceneData): SceneData {
  return {
    components: scene.components.map((component) => ({ ...component })),
    drawings: scene.drawings.map((drawing) => ({ ...drawing })),
    wires: scene.wires.map((wire) => ({
      ...wire,
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

function makeWireFromAbsolutePoints(id: string, points: Point[]): WireEntity {
  const first = points[0] ?? { x: 0, y: 0 };
  return {
    id,
    x: first.x,
    y: first.y,
    vertices: points.map((point, index) =>
      index === 0 ? { x: 0, y: 0 } : { x: point.x - first.x, y: point.y - first.y }
    ),
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
  if (drawing.toolId === 'joint') {
    return {
      minX: drawing.x - 4,
      maxX: drawing.x + 4,
      minY: drawing.y - 4,
      maxY: drawing.y + 4,
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
  isSelected,
  draggable = false,
  listening = true,
  strokeColor = 'black',
  opacity = 1,
  onMouseDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  toolId: ComponentToolId;
  x: number;
  y: number;
  rotation: Rotation;
  isSelected: boolean;
  draggable?: boolean;
  listening?: boolean;
  strokeColor?: string;
  opacity?: number;
  onMouseDown?: (e: KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
}) {
  if (toolId === 'resistor') {
    return (
      <ResistorSymbol
        x={x}
        y={y}
        rotation={rotation as ResistorRotation}
        isSelected={isSelected}
        draggable={draggable}
        listening={listening}
        strokeColor={strokeColor}
        opacity={opacity}
        onMouseDown={onMouseDown}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    );
  }

  const glyphLabel: Record<Exclude<ComponentToolId, 'resistor'>, string> = {
    capacitor: 'C',
    inductor: 'L',
    diode: 'D',
    transistor: 'Q',
    ic: 'IC',
    ground: 'GND',
    power: 'V+',
  };

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable={draggable}
      listening={listening}
      opacity={opacity}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      <Rect x={-20} y={-14} width={40} height={28} fill="black" opacity={0} />
      {isSelected && (
        <Rect
          x={-20}
          y={-14}
          width={40}
          height={28}
          stroke="#4f80ff"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
      <Line points={[-24, 0, -12, 0]} stroke={strokeColor} strokeWidth={1.4} />
      <Line points={[12, 0, 24, 0]} stroke={strokeColor} strokeWidth={1.4} />
      <Rect x={-12} y={-8} width={24} height={16} stroke={strokeColor} strokeWidth={1.4} />
      <Text
        x={-11}
        y={-6}
        width={22}
        height={12}
        fontSize={8}
        align="center"
        verticalAlign="middle"
        text={glyphLabel[toolId]}
        fill={strokeColor}
        listening={false}
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
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
}) {
  if (drawing.toolId === 'joint') {
    return (
      <Group
        x={drawing.x}
        y={drawing.y}
        draggable={draggable}
        listening={listening}
        opacity={opacity}
        onMouseDown={onMouseDown}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      >
        <Circle x={0} y={0} radius={2} fill={strokeColor} />
        {isSelected && (
          <Circle
            x={0}
            y={0}
            radius={5}
            stroke="#4f80ff"
            strokeWidth={1}
            listening={false}
          />
        )}
      </Group>
    );
  }

  const glyphLabel: Record<Exclude<NonWireDrawingToolId, 'joint'>, string> = {
    bus: 'BUS',
    label: 'LBL',
    text: 'TXT',
    note: 'NOTE',
  };

  return (
    <Group
      x={drawing.x}
      y={drawing.y}
      rotation={drawing.rotation}
      draggable={draggable}
      listening={listening}
      opacity={opacity}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      <Rect x={-20} y={-12} width={40} height={24} fill="black" opacity={0} />
      {isSelected && (
        <Rect
          x={-20}
          y={-12}
          width={40}
          height={24}
          stroke="#4f80ff"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
      <Rect x={-18} y={-10} width={36} height={20} stroke={strokeColor} strokeWidth={1.2} />
      <Text
        x={-17}
        y={-7}
        width={34}
        height={14}
        fontSize={8}
        align="center"
        verticalAlign="middle"
        text={glyphLabel[drawing.toolId as Exclude<NonWireDrawingToolId, 'joint'>]}
        fill={strokeColor}
        listening={false}
      />
    </Group>
  );
}

export default function CanvasViewport({
  onContextMenu,
  selectedTool,
  onToolComplete,
  showGrid = true,
  onToggleGrid,
  onRegisterViewportControls,
}: CanvasViewportProps) {
  const [camera, setCamera] = useState<Camera>({ offsetX: 400, offsetY: 300, zoom: 1 });
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [cursor, setCursor] = useState('default');
  const [isPanning, setIsPanning] = useState(false);

  const [mouseWorldPos, setMouseWorldPos] = useState<Point>({ x: 0, y: 0 });
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [placementRotation, setPlacementRotation] = useState<Rotation>(0);

  const [scene, setScene] = useState<SceneData>({
    components: [],
    drawings: [],
    wires: [],
  });
  const [wireDraft, setWireDraft] = useState<Point[] | null>(null);

  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([]);
  const [selectedWireIds, setSelectedWireIds] = useState<string[]>([]);
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

  const dragStartPositionsRef = useRef<Map<string, Point> | null>(null);
  const wireDragStartPointsRef = useRef<Map<string, Point> | null>(null);
  const dragAnchorIdRef = useRef<string | null>(null);
  const dragHistoryCapturedRef = useRef(false);
  const sceneRef = useRef<SceneData>(scene);
  const undoStackRef = useRef<SceneData[]>([]);
  const redoStackRef = useRef<SceneData[]>([]);

  const { components, drawings, wires } = scene;

  const activeComponentTool = selectedTool && isComponentTool(selectedTool) ? selectedTool : null;
  const activeDrawingTool = selectedTool && isDrawingTool(selectedTool) ? selectedTool : null;

  const selectedComponentSet = useMemo(() => new Set(selectedComponentIds), [selectedComponentIds]);
  const selectedDrawingSet = useMemo(() => new Set(selectedDrawingIds), [selectedDrawingIds]);
  const selectedWireSet = useMemo(() => new Set(selectedWireIds), [selectedWireIds]);

  const shouldShowGrid = showGrid !== false;

  const makeDragKey = useCallback(
    (kind: 'component' | 'drawing' | 'wire', id: string) => `${kind}:${id}`,
    []
  );

  const clearSelection = useCallback(() => {
    setSelectedComponentIds([]);
    setSelectedDrawingIds([]);
    setSelectedWireIds([]);
  }, []);

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

  const captureDragHistory = useCallback(() => {
    if (dragHistoryCapturedRef.current) {
      return;
    }
    undoStackRef.current.push(cloneScene(sceneRef.current));
    redoStackRef.current = [];
    dragHistoryCapturedRef.current = true;
  }, []);

  const {
    handleComponentMouseDown,
    handleComponentDragStart,
    handleComponentDragMove,
    handleComponentDragEnd,
  } = useComponentEventHandlers({
    selectedTool,
    isPasteMode,
    selectedComponentSet,
    selectedComponentIds,
    selectedDrawingIds,
    selectedWireIds,
    setSelectedComponentIds,
    setSelectedDrawingIds,
    setSelectedWireIds,
    captureDragHistory,
    components,
    drawings,
    wires,
    makeDragKey,
    dragStartPositionsRef,
    wireDragStartPointsRef,
    dragAnchorIdRef,
    dragHistoryCapturedRef,
    updateScene,
  });

  const {
    handleDrawingMouseDown,
    handleDrawingDragStart,
    handleDrawingDragMove,
    handleDrawingDragEnd,
  } = useDrawingEventHandlers({
    selectedTool,
    isPasteMode,
    selectedDrawingIds,
    selectedComponentIds,
    selectedWireIds,
    selectedDrawingSet,
    setSelectedDrawingIds,
    setSelectedComponentIds,
    setSelectedWireIds,
    captureDragHistory,
    components,
    drawings,
    wires,
    makeDragKey,
    dragStartPositionsRef,
    wireDragStartPointsRef,
    dragAnchorIdRef,
    dragHistoryCapturedRef,
    updateScene,
  });

  const {
    handleWireMouseDown,
    handleWireDragStart,
    handleWireDragMove,
    handleWireDragEnd,
  } = useWireEventHandlers({
    selectedTool,
    isPasteMode,
    selectedWireIds,
    selectedWireSet,
    selectedComponentIds,
    selectedDrawingIds,
    setSelectedWireIds,
    setSelectedComponentIds,
    setSelectedDrawingIds,
    captureDragHistory,
    components,
    drawings,
    wires,
    makeDragKey,
    dragStartPositionsRef,
    wireDragStartPointsRef,
    dragAnchorIdRef,
    dragHistoryCapturedRef,
    updateScene,
  });

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
      })),
      drawings: selectedDrawings.map((drawing) => ({
        toolId: drawing.toolId,
        x: drawing.x - anchor.x,
        y: drawing.y - anchor.y,
        rotation: drawing.rotation,
      })),
      wires: selectedWires.map((wire) => ({
        points: getAbsoluteWirePoints(wire).map((point) => ({
          x: point.x - anchor.x,
          y: point.y - anchor.y,
        })),
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
    }),
    [copySelection, cutSelection, deleteSelection, pasteSelection, redo, setZoomLevel, undo]
  );

  useEffect(() => {
    if (onRegisterViewportControls) {
      onRegisterViewportControls(viewportControls);
    }
  }, [onRegisterViewportControls, viewportControls]);

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

      if (selectedTool) {
        const snapped = getSnappedWorld(pointer, camera);

        if (activeComponentTool) {
          updateScene((prev) => ({
            ...prev,
            components: [
              ...prev.components,
              {
                id: makeId('component'),
                toolId: activeComponentTool,
                x: snapped.x,
                y: snapped.y,
                rotation: placementRotation,
              },
            ],
          }));
          clearSelection();
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
                }))
              )
            ),
          ],
        }));
        clearSelection();
        return;
      }

      if (!selectedTool && clickedOnCanvas) {
        isSelectingRef.current = true;
        selectionStartRef.current = pointer;
        setSelectionRect({ x: pointer.x, y: pointer.y, width: 0, height: 0, visible: true });
      }
    },
    [
      activeComponentTool,
      activeDrawingTool,
      camera,
      clipboard,
      clearSelection,
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

      if (isSelectingRef.current && selectionStartRef.current) {
        const start = selectionStartRef.current;
        setSelectionRect({
          x: Math.min(start.x, pointer.x),
          y: Math.min(start.y, pointer.y),
          width: Math.abs(pointer.x - start.x),
          height: Math.abs(pointer.y - start.y),
          visible: true,
        });
      }
    },
    [camera, isPanning, isPasteMode, selectedTool]
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

      if (e.evt.button !== 0 || !isSelectingRef.current || !selectionStartRef.current || selectedTool || isPasteMode) {
        return;
      }

      const isClick = selectionRect.width <= DRAG_THRESHOLD && selectionRect.height <= DRAG_THRESHOLD;
      if (isClick) {
        clearSelection();
      } else {
        const topLeft = screenToWorld({ x: selectionRect.x, y: selectionRect.y }, camera);
        const bottomRight = screenToWorld(
          { x: selectionRect.x + selectionRect.width, y: selectionRect.y + selectionRect.height },
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

        setSelectedDrawingIds(matchedDrawingIds);
        setSelectedWireIds(matchedWireIds);
        setSelectedComponentIds(matchedComponentIds);
      }

      isSelectingRef.current = false;
      selectionStartRef.current = null;
      setSelectionRect((prev) => ({ ...prev, visible: false }));
    },
    [camera, clearSelection, components, drawings, isPasteMode, onContextMenu, selectedTool, selectionRect, wires]
  );

  const handleWirePointDragStart = useCallback(() => {
    captureDragHistory();
  }, [captureDragHistory]);

  const handleWirePointDragMove = useCallback(
    (wireId: string, pointIndex: number) => {
      return (e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const { x, y } = e.target.position();
        updateScene((prev) => ({
          ...prev,
          wires: prev.wires.map((wire) => {
            if (wire.id !== wireId) return wire;
            return setWireVertexAbsolute(wire, pointIndex, { x, y });
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
              x: snapToGrid(x),
              y: snapToGrid(y),
            });
          }),
        }), false);
        dragHistoryCapturedRef.current = false;
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
              wires: [...prev.wires, makeWireFromAbsolutePoints(makeId('wire'), wireDraft)],
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
        if (selectedTool) {
          event.preventDefault();
          setPlacementRotation((prev) => rotateBy90(prev));
          return;
        }

        if (selectedComponentIds.length > 0 || selectedDrawingIds.length > 0) {
          event.preventDefault();
          updateScene((prev) => ({
            ...prev,
            components: prev.components.map((component) =>
              selectedComponentSet.has(component.id)
                ? { ...component, rotation: rotateBy90(component.rotation) }
                : component
            ),
            drawings: prev.drawings.map((drawing) =>
              selectedDrawingSet.has(drawing.id)
                ? { ...drawing, rotation: rotateBy90(drawing.rotation) }
                : drawing
            ),
          }));
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
    onToggleGrid,
    onToolComplete,
    pasteSelection,
    redo,
    selectedComponentSet,
    selectedDrawingSet,
    selectedTool,
    undo,
    updateScene,
    wireDraft,
  ]);

  useEffect(() => {
    if (selectedTool && isPasteMode) {
      setIsPasteMode(false);
    }

    if (!selectedTool && !isPasteMode) {
      setHoverPoint(null);
      setPlacementRotation(0);
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
              isSelected={selectedComponentSet.has(component.id)}
              draggable={selectedComponentSet.has(component.id) && !selectedTool && !isPasteMode}
              onMouseDown={handleComponentMouseDown(component.id)}
              onDragStart={handleComponentDragStart(component.id)}
              onDragMove={handleComponentDragMove(component.id)}
              onDragEnd={handleComponentDragEnd(component.id)}
            />
          ))}

          {activeComponentTool && hoverPoint && (
            <ComponentGlyph
              toolId={activeComponentTool}
              x={hoverPoint.x}
              y={hoverPoint.y}
              rotation={placementRotation}
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
                isSelected={false}
                listening={false}
                strokeColor="#888888"
                opacity={0.6}
              />
            ))}
        </Layer>

        <Layer x={camera.offsetX} y={camera.offsetY} scaleX={camera.zoom} scaleY={camera.zoom}>
          {wires.map((wire) => {
            const absolutePoints = getAbsoluteWirePoints(wire);
            const points = absolutePoints.flatMap((point) => [point.x, point.y]);
            const isSelected = selectedWireSet.has(wire.id);
            return (
              <React.Fragment key={wire.id}>
                <Line
                  points={points}
                  stroke="black"
                  strokeWidth={1}
                  lineJoin="round"
                  lineCap="round"
                  hitStrokeWidth={6}
                  onMouseDown={handleWireMouseDown(wire.id)}
                  draggable={isSelected && !selectedTool && !isPasteMode}
                  onDragStart={handleWireDragStart(wire.id)}
                  onDragMove={handleWireDragMove(wire.id)}
                  onDragEnd={handleWireDragEnd(wire.id)}
                />
                {isSelected && !selectedTool && !isPasteMode &&
                  absolutePoints.map((point, index) => (
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
              </React.Fragment>
            );
          })}

          {drawings.map((drawing) => (
            <DrawingGlyph
              key={drawing.id}
              drawing={drawing}
              isSelected={selectedDrawingSet.has(drawing.id)}
              draggable={selectedDrawingSet.has(drawing.id) && !selectedTool && !isPasteMode}
              onMouseDown={handleDrawingMouseDown(drawing.id)}
              onDragStart={handleDrawingDragStart(drawing.id)}
              onDragMove={handleDrawingDragMove(drawing.id)}
              onDragEnd={handleDrawingDragEnd(drawing.id)}
            />
          ))}

          {isPasteMode && clipboard && hoverPoint &&
            clipboard.wires.map((wire, wireIndex) => (
              <Line
                key={`paste-wire-${wireIndex}`}
                points={wire.points
                  .flatMap((point) => [point.x + hoverPoint.x, point.y + hoverPoint.y])}
                stroke="#888888"
                strokeWidth={1}
                lineJoin="round"
                lineCap="round"
                opacity={0.6}
                listening={false}
              />
            ))}

          {wireDraft && wireDraft.length >= 2 && (
            <Line
              points={wireDraft.flatMap((point) => [point.x, point.y])}
              stroke="black"
              strokeWidth={1}
              lineJoin="round"
              lineCap="round"
              listening={false}
            />
          )}

          {activeDrawingTool === 'wire' && wireDraft && hoverPoint && wireDraft.length >= 1 && (
            <Line
              points={[...wireDraft, hoverPoint].flatMap((point) => [point.x, point.y])}
              stroke="#888888"
              strokeWidth={1}
              lineJoin="round"
              lineCap="round"
              opacity={0.6}
              listening={false}
            />
          )}

          {activeDrawingTool === 'wire' && hoverPoint && (
            <Circle x={hoverPoint.x} y={hoverPoint.y} radius={2} fill="#888888" opacity={0.6} listening={false} />
          )}

          {activeDrawingTool && activeDrawingTool !== 'wire' && hoverPoint && (
            <DrawingGlyph
              drawing={{
                id: 'preview',
                toolId: activeDrawingTool as NonWireDrawingToolId,
                x: hoverPoint.x,
                y: hoverPoint.y,
                rotation: placementRotation,
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
        <div>Zoom: {(camera.zoom * 100).toFixed(0)}%</div>
        <div>
          World: ({mouseWorldPos.x.toFixed(0)}, {mouseWorldPos.y.toFixed(0)})
        </div>
      </div>
    </div>
  );
}
