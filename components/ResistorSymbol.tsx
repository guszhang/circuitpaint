'use client';

import React from 'react';
import { Group, Line, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

export type ResistorRotation = 0 | 90 | 180 | 270;

interface ResistorSymbolProps {
  x: number;
  y: number;
  rotation: ResistorRotation;
  isSelected: boolean;
  draggable?: boolean;
  strokeColor?: string;
  opacity?: number;
  listening?: boolean;
  onMouseDown?: (e: KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
}

export default function ResistorSymbol({
  x,
  y,
  rotation,
  isSelected,
  draggable = false,
  strokeColor,
  opacity = 1,
  listening = true,
  onMouseDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: ResistorSymbolProps) {
  const lineColor = strokeColor ?? 'black';

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
      <Rect
        x={-26}
        y={-12}
        width={52}
        height={24}
        fill="black"
        opacity={0}
        strokeWidth={0}
        listening={true}
      />
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
      <Line
        points={[-12, 0, -10, -4, -6, 4, -2, -4, 2, 4, 6, -4, 10, 4, 12, 0]}
        stroke={lineColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[-20, 0, -12, 0]}
        stroke={lineColor}
        strokeWidth={1}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[12, 0, 20, 0]}
        stroke={lineColor}
        strokeWidth={1}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
}
