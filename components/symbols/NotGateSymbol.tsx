'use client';

import React from 'react';
import { Circle, Group, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type SymbolRotation = 0 | 90 | 180 | 270;

interface NotGateSymbolProps {
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

export default function NotGateSymbol({
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
}: NotGateSymbolProps) {
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
      <Line points={[-16, -16, -16, 16, 12, 0, -16, -16]} stroke={lineColor} strokeWidth={2} lineJoin="round" lineCap='round' />
      <Line points={[-20, 0, -16, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Line points={[12, 0, 20, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Circle x={14} y={0} radius={2} stroke={lineColor} strokeWidth={2} fill="white" />
    </Group>
  );
}
