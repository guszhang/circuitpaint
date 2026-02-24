'use client';

import React from 'react';
import { Group, Line, Rect, Shape } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type SymbolRotation = 0 | 90 | 180 | 270;

interface AndGateSymbolProps {
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

export default function AndGateSymbol({
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
}: AndGateSymbolProps) {
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
      <Rect x={-26} y={-26} width={52} height={52} fill="black" opacity={0} strokeWidth={0} listening={true} />
      {isSelected && (
        <Rect
          x={-26}
          y={-26}
          width={52}
          height={52}
          stroke="#4f80ff"
          strokeWidth={1}
          dash={[4, 4]}
          cornerRadius={2}
          listening={false}
        />
      )}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(-16, -16);
          ctx.lineTo(-4, -16);
          // Top-right quarter circle
          ctx.arc(-4, 0, 16, -Math.PI / 2, 0, false);
          // Bottom-right quarter circle
          ctx.arc(-4, 0, 16, 0, Math.PI / 2, false);
          ctx.lineTo(-16, 16);
          ctx.closePath();
          ctx.strokeShape(shape);
        }}
        stroke={lineColor}
        strokeWidth={2}
        lineJoin="round"
        lineCap="round"
      />
      <Line points={[-20, -10, -16, -10]} stroke={lineColor} strokeWidth={1} lineCap="round" />
      <Line points={[-20, 10, -16, 10]} stroke={lineColor} strokeWidth={1} lineCap="round" />
      <Line points={[12, 0, 20, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" />
    </Group>
  );
}
