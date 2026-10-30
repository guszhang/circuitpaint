'use client';

import React from 'react';
import { Arrow, Group, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type SymbolRotation = 0 | 90 | 180 | 270;

interface VariableCapacitorSymbolProps {
  x: number;
  y: number;
  rotation: SymbolRotation;
  draggable?: boolean;
  strokeColor?: string;
  opacity?: number;
  listening?: boolean;
  dragBoundFunc?: (pos: { x: number; y: number }) => { x: number; y: number };
  onMouseDown?: (e: KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
}

export default function VariableCapacitorSymbol({
  x,
  y,
  rotation,
  draggable = false,
  strokeColor,
  opacity = 1,
  listening = true,
  dragBoundFunc,
  onMouseDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: VariableCapacitorSymbolProps) {
  const lineColor = strokeColor ?? 'black';

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable={draggable}
      listening={listening}
      opacity={opacity}
      dragBoundFunc={dragBoundFunc}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      <Line points={[-2, -6, -2, 6]} stroke={lineColor} strokeWidth={2} lineCap="round" lineJoin="round" />
      <Line points={[2, -6, 2, 6]} stroke={lineColor} strokeWidth={2} lineCap="round" lineJoin="round" />
      <Line points={[-20, 0, -2, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Line points={[2, 0, 20, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Arrow
        points={[6, 6, -6, -6]}
        stroke={lineColor}
        fill={lineColor}
        strokeWidth={1}
        pointerLength={3}
        pointerWidth={3}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
}
