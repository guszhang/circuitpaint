'use client';

import React from 'react';
import { Arrow, Group, Line, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ComponentToolId } from '../../lib/tools';
import { konvaElementToSvg, type SvgBounds } from '../../lib/konvaSvg';
import {
  getWireArrowRenderPoints,
  WIRE_ARROW_POINTER_LENGTH,
  WIRE_ARROW_POINTER_WIDTH,
} from '../../lib/wireGeometry';
import { getComponentSymbolComponent, getDrawingSymbolComponent } from '../symbols/toolSymbols';
import { getTextSymbolFontSize } from '../symbols/textMetrics';
import type { ComponentEntity, DrawingEntity, NonWireDrawingToolId, Rotation, WireEntity } from './types';

// Glyphs are the single source of truth for how entities look: the canvas
// renders them directly and the SVG/PNG export serialises the same elements.

export const DEFAULT_STROKE_COLOR = '#000000';
export const DEFAULT_WIRE_STROKE_WIDTH = 1;
export const WIRE_STROKE_WIDTH_OPTIONS = [1, 2, 3, 5] as const;
export const DEFAULT_TEXT_BORDER_STROKE_WIDTH = 1;

// Selection fences (and hit areas) are derived from each symbol's drawn
// geometry, so they always fit the symbol and follow any geometry edits.
const FENCE_PADDING = 3;
const MIN_FENCE_SIZE = 12;
const FENCE_COLOR = '#4f80ff';

export function normalizeWireStrokeWidth(value: number | undefined) {
  if (!value || !Number.isFinite(value)) {
    return DEFAULT_WIRE_STROKE_WIDTH;
  }
  return WIRE_STROKE_WIDTH_OPTIONS.includes(value as (typeof WIRE_STROKE_WIDTH_OPTIONS)[number])
    ? value
    : DEFAULT_WIRE_STROKE_WIDTH;
}

export function normalizeTextBorderStrokeWidth(value: number | undefined) {
  return normalizeWireStrokeWidth(value ?? DEFAULT_TEXT_BORDER_STROKE_WIDTH);
}

export function isBridgeDrawingTool(toolId: NonWireDrawingToolId | DrawingEntity['toolId']) {
  return toolId === 'bridge' || toolId === 'half-circle';
}

export function isCircularShapeDrawingTool(toolId: NonWireDrawingToolId | DrawingEntity['toolId']) {
  return toolId === 'circle' || toolId === 'sum';
}

export function normalizeWireDash(value: number[] | undefined) {
  if (!Array.isArray(value) || value.length === 0) {
    return [] as number[];
  }
  return value.filter((item) => Number.isFinite(item) && item >= 0);
}

export function getDrawingDisplayText(drawing: Pick<DrawingEntity, 'toolId' | 'text'>) {
  if (drawing.toolId === 'text') {
    return drawing.text?.trim() || 'Text';
  }
  return '';
}

interface FenceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const fenceCache = new Map<string, FenceRect>();

function toFenceRect(bounds: SvgBounds | null): FenceRect {
  const geometry = bounds ?? { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  const cx = (geometry.minX + geometry.maxX) / 2;
  const cy = (geometry.minY + geometry.maxY) / 2;
  const width = Math.max(MIN_FENCE_SIZE, geometry.maxX - geometry.minX + FENCE_PADDING * 2);
  const height = Math.max(MIN_FENCE_SIZE, geometry.maxY - geometry.minY + FENCE_PADDING * 2);
  return { x: cx - width / 2, y: cy - height / 2, width, height };
}

function getCachedFence(key: string, element: () => React.ReactElement) {
  let fence = fenceCache.get(key);
  if (!fence) {
    fence = toFenceRect(konvaElementToSvg(element()).bounds);
    fenceCache.set(key, fence);
  }
  return fence;
}

function getComponentFence(toolId: ComponentToolId) {
  const SymbolComponent = getComponentSymbolComponent(toolId);
  return getCachedFence(`component:${toolId}`, () => <SymbolComponent x={0} y={0} rotation={0} />);
}

// Text and resizable shapes manage their own selection outline and stroke-only
// hit testing; every other drawing has fixed geometry and a derived fence.
function hasDerivedFence(toolId: DrawingEntity['toolId']) {
  return toolId !== 'text' && toolId !== 'circle' && toolId !== 'sum' && toolId !== 'rectangle';
}

function getDrawingStrokeWidthProp(drawing: Pick<DrawingEntity, 'toolId' | 'strokeWidth'>) {
  return isBridgeDrawingTool(drawing.toolId) ? normalizeWireStrokeWidth(drawing.strokeWidth) : undefined;
}

function getDrawingFence(drawing: Pick<DrawingEntity, 'toolId' | 'strokeWidth'>) {
  const SymbolComponent = getDrawingSymbolComponent(drawing.toolId);
  const strokeWidth = getDrawingStrokeWidthProp(drawing);
  return getCachedFence(`drawing:${drawing.toolId}:${strokeWidth ?? ''}`, () => (
    <SymbolComponent x={0} y={0} rotation={0} strokeWidth={strokeWidth} />
  ));
}

function fenceToWorldBounds(
  fence: FenceRect,
  origin: { x: number; y: number },
  rotation: Rotation,
  flipped: boolean
): SvgBounds {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corners = [
    { x: fence.x, y: fence.y },
    { x: fence.x + fence.width, y: fence.y },
    { x: fence.x + fence.width, y: fence.y + fence.height },
    { x: fence.x, y: fence.y + fence.height },
  ].map((corner) => {
    const lx = flipped ? -corner.x : corner.x;
    return { x: origin.x + lx * cos - corner.y * sin, y: origin.y + lx * sin + corner.y * cos };
  });
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

export function getComponentSelectionBounds(component: ComponentEntity) {
  return fenceToWorldBounds(getComponentFence(component.toolId), component, component.rotation, component.flipped === true);
}

/** World-space fence of a fixed-geometry drawing; null for text and resizable shapes. */
export function getDrawingSelectionBounds(drawing: DrawingEntity) {
  if (!hasDerivedFence(drawing.toolId)) {
    return null;
  }
  return fenceToWorldBounds(getDrawingFence(drawing), drawing, drawing.rotation, false);
}

function FenceHitArea({ fence }: { fence: FenceRect }) {
  return <Rect {...fence} fill="black" opacity={0} strokeWidth={0} />;
}

function SelectionFence({ fence }: { fence: FenceRect }) {
  return (
    <Rect
      {...fence}
      stroke={FENCE_COLOR}
      strokeWidth={1}
      dash={[4, 4]}
      cornerRadius={2}
      listening={false}
    />
  );
}

export function ComponentGlyph({
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
  const fence = getComponentFence(toolId);

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      scaleX={flipped ? -1 : 1}
      draggable={draggable}
      listening={listening}
      dragBoundFunc={dragBoundFunc}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      <FenceHitArea fence={fence} />
      <SymbolComponent x={0} y={0} rotation={0} strokeColor={strokeColor} opacity={opacity} />
      {isSelected && <SelectionFence fence={fence} />}
    </Group>
  );
}

export function DrawingGlyph({
  drawing,
  isSelected,
  hideText = false,
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
  hideText?: boolean;
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

  if (hasDerivedFence(drawing.toolId)) {
    const fence = getDrawingFence(drawing);
    return (
      <Group
        x={drawing.x}
        y={drawing.y}
        rotation={drawing.rotation}
        draggable={draggable}
        listening={listening}
        dragBoundFunc={dragBoundFunc}
        onMouseDown={onMouseDown}
        onDblClick={onDoubleClick}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      >
        <FenceHitArea fence={fence} />
        <SymbolComponent
          x={0}
          y={0}
          rotation={0}
          strokeWidth={getDrawingStrokeWidthProp(drawing)}
          strokeColor={strokeColor}
          opacity={opacity}
        />
        {isSelected && <SelectionFence fence={fence} />}
      </Group>
    );
  }

  return (
    <SymbolComponent
      x={drawing.x}
      y={drawing.y}
      rotation={drawing.rotation}
      isSelected={isSelected}
      text={drawing.toolId === 'text' ? (hideText ? '' : getDrawingDisplayText(drawing)) : undefined}
      border={drawing.toolId === 'text' ? drawing.border === true : undefined}
      borderWidth={drawing.toolId === 'text' ? drawing.borderWidth : undefined}
      borderHeight={drawing.toolId === 'text' ? drawing.borderHeight : undefined}
      borderStrokeWidth={drawing.toolId === 'text' ? normalizeTextBorderStrokeWidth(drawing.borderStrokeWidth) : undefined}
      fontSize={drawing.toolId === 'text' ? getTextSymbolFontSize(drawing.fontSize) : undefined}
      radiusX={isCircularShapeDrawingTool(drawing.toolId) ? drawing.radiusX : undefined}
      radiusY={isCircularShapeDrawingTool(drawing.toolId) ? drawing.radiusY : undefined}
      shapeWidth={drawing.toolId === 'rectangle' ? drawing.shapeWidth : undefined}
      shapeHeight={drawing.toolId === 'rectangle' ? drawing.shapeHeight : undefined}
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

export function WireStroke({ wire }: { wire: Pick<WireEntity, 'vertices' | 'strokeColor' | 'strokeWidth' | 'dash' | 'arrowEnd'> }) {
  const lineWidth = normalizeWireStrokeWidth(wire.strokeWidth);
  const lineDash = normalizeWireDash(wire.dash);
  const stroke = wire.strokeColor ?? DEFAULT_STROKE_COLOR;

  if (wire.arrowEnd) {
    return (
      <Arrow
        points={getWireArrowRenderPoints(wire.vertices).flatMap((point) => [point.x, point.y])}
        stroke={stroke}
        fill={stroke}
        strokeWidth={lineWidth}
        dash={lineDash}
        pointerLength={WIRE_ARROW_POINTER_LENGTH}
        pointerWidth={WIRE_ARROW_POINTER_WIDTH}
        lineJoin="miter"
        lineCap="round"
        hitStrokeWidth={Math.max(6, lineWidth + 4)}
      />
    );
  }

  return (
    <Line
      points={wire.vertices.flatMap((point) => [point.x, point.y])}
      stroke={stroke}
      strokeWidth={lineWidth}
      dash={lineDash}
      lineJoin="round"
      lineCap="round"
      hitStrokeWidth={Math.max(6, lineWidth + 4)}
    />
  );
}
