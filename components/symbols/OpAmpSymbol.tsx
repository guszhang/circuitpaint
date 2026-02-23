'use client';

import React from 'react';
import { Group, Line, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type SymbolRotation = 0 | 90 | 180 | 270;

interface OpAmpSymbolProps {
  x: number;
  y: number;
  rotation: SymbolRotation;
  isSelected: boolean;
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

export default function OpAmpSymbol({
  x,
  y,
  rotation,
  isSelected,
  draggable = false,
  strokeColor,
  opacity = 1,
  listening = true,
  dragBoundFunc,
  onMouseDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: OpAmpSymbolProps) {
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
      <Rect x={-26} y={-12} width={52} height={24} fill="black" opacity={0} strokeWidth={0} listening={true} />
      {isSelected && (
        <Rect
          x={-26}
          y={-12}
          width={52}
          height={24}
          stroke="#4f80ff"
          strokeWidth={1}
          dash={[4, 4]}
          cornerRadius={2}
          listening={false}
        />
      )}
      <Line points={[-6, -8, -6, 8, 8, 0, -6, -8]} stroke={lineColor} strokeWidth={2} lineJoin="round" />
      <Line points={[-20, -4, -6, -4]} stroke={lineColor} strokeWidth={1} lineCap="round" />
      <Line points={[-20, 4, -6, 4]} stroke={lineColor} strokeWidth={1} lineCap="round" />
      <Line points={[8, 0, 20, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" />
      <Line points={[-13, -4, -9, -4]} stroke={lineColor} strokeWidth={1.5} lineCap="round" />
      <Line points={[-11, -6, -11, -2]} stroke={lineColor} strokeWidth={1.5} lineCap="round" />
      <Line points={[-13, 4, -9, 4]} stroke={lineColor} strokeWidth={1.5} lineCap="round" />
    </Group>
  );
}
