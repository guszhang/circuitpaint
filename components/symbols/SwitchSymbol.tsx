'use client';

import React from 'react';
import { Group, Line, Rect, Arrow } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type SymbolRotation = 0 | 90 | 180 | 270;

interface SwitchSymbolProps {
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

export default function SwitchSymbol({
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
}: SwitchSymbolProps) {
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
      <Rect
        x={-26}
        y={-6}
        width={52}
        height={30}
        fill="black"
        opacity={0}
        strokeWidth={0}
        listening={true}
      />
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
      <Line
        points={[-8, 8, 8, 8]}
        stroke={lineColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      /><Line
        points={[-6, 12, 6, 12]}
        stroke={lineColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[0, 12, 0, 20]}
        stroke={lineColor}
        strokeWidth={1}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[-20, 0, -6, 0, -6, 8]}
        stroke={lineColor}
        strokeWidth={1}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[0, 0, 20, 0]}
        stroke={lineColor}
        strokeWidth={1}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[6, 0, 6, 8]}
        stroke={lineColor}
        strokeWidth={1}
        lineCap="round"
        lineJoin="round"
      />
      <Arrow
        points={[0, 0, 0, 8]}
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
