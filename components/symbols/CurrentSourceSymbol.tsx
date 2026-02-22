'use client';

import React from 'react';
import { Arrow, Circle, Group, Line, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type SymbolRotation = 0 | 90 | 180 | 270;

interface CurrentSourceSymbolProps {
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

export default function CurrentSourceSymbol({
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
}: CurrentSourceSymbolProps) {
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
      <Circle x={0} y={0} radius={12} stroke={lineColor} strokeWidth={2} listening={false} />
      <Arrow
        points={[0, 6, 0, -6]}
        stroke={lineColor}
        fill={lineColor}
        strokeWidth={1.5}
        pointerLength={4}
        pointerWidth={4}
        lineCap="round"
        lineJoin="round"
      />
      <Line points={[-20, 0, -12, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Line points={[12, 0, 20, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
    </Group>
  );
}
