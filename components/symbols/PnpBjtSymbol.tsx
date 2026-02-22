'use client';

import React from 'react';
import { Arrow, Group, Line, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type SymbolRotation = 0 | 90 | 180 | 270;

interface PnpBjtSymbolProps {
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

export default function PnpBjtSymbol({
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
}: PnpBjtSymbolProps) {
  const lineColor = strokeColor ?? 'black';
  const renderRotation = ((rotation + 90) % 360) as SymbolRotation;

  return (
    <Group
      x={x}
      y={y}
      rotation={renderRotation}
      draggable={draggable}
      listening={listening}
      opacity={opacity}
      dragBoundFunc={dragBoundFunc}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      <Rect x={-26} y={-6} width={52} height={30} fill="black" opacity={0} strokeWidth={0} listening={true} />
      {isSelected && (
        <Rect
          x={-26}
          y={-6}
          width={52}
          height={30}
          stroke="#4f80ff"
          strokeWidth={1}
          dash={[4, 4]}
          cornerRadius={2}
          listening={false}
        />
      )}
      <Line points={[-20, 0, -10, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Line points={[10, 0, 20, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Line
        points={[10, 0, 4, 8]}
        stroke={lineColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[-8, 8, 8, 8]}
        stroke={lineColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
      <Arrow
        points={[-10, 0, -4, 7]}
        stroke={lineColor}
        fill={lineColor}
        strokeWidth={2}
        pointerLength={2}
        pointerWidth={2}
        lineCap="round"
      />
      <Line
        points={[0, 8, 0, 20]}
        stroke={lineColor}
        strokeWidth={1}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
}
