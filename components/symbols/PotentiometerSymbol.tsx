'use client';

import React from 'react';
import { Arrow, Group, Line, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type PotentiometerRotation = 0 | 90 | 180 | 270;

interface PotentiometerSymbolProps {
  x: number;
  y: number;
  rotation: PotentiometerRotation;
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

export default function PotentiometerSymbol({
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
}: PotentiometerSymbolProps) {
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
      <Rect
        x={-26}
        y={-14}
        width={52}
        height={28}
        fill="black"
        opacity={0}
        strokeWidth={0}
        listening={true}
      />
      {isSelected && (
        <Rect
          x={-26}
          y={-14}
          width={52}
          height={28}
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
      <Arrow
        points={[0, -20, 0, -5]}
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
