'use client';

import React from 'react';
import { Arc, Group, Line, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

interface BridgeSymbolProps {
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  isSelected: boolean;
  draggable?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  listening?: boolean;
  dragBoundFunc?: (pos: { x: number; y: number }) => { x: number; y: number };
  onMouseDown?: (e: KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
}

export default function BridgeSymbol({
  x,
  y,
  rotation,
  isSelected,
  draggable = false,
  strokeColor,
  strokeWidth = 1,
  opacity = 1,
  listening = true,
  dragBoundFunc,
  onMouseDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: BridgeSymbolProps) {
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
      <Rect x={-2} y={-12} width={10} height={24} fill="black" opacity={0} strokeWidth={0} />
      {isSelected && (
        <Rect
          x={-2}
          y={-14}
          width={10}
          height={28}
          stroke="#4f80ff"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
      <Line
        points={[0, -10, 0, -3]}
        stroke={lineColor}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[0, 3, 0, 10]}
        stroke={lineColor}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
      />
      <Arc
        x={0}
        y={0}
        innerRadius={3}
        outerRadius={3}
        angle={180}
        rotation={-90}
        stroke={lineColor}
        strokeWidth={strokeWidth}
        fill="transparent"
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
}
