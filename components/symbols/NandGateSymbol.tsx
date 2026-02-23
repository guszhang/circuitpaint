'use client';

import React from 'react';
import { Circle, Group, Line, Rect, Shape } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type SymbolRotation = 0 | 90 | 180 | 270;

interface NandGateSymbolProps {
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

export default function NandGateSymbol({
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
}: NandGateSymbolProps) {
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
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(-8, -8);
          ctx.lineTo(0, -8);
          ctx.quadraticCurveTo(8, -8, 8, 0);
          ctx.quadraticCurveTo(8, 8, 0, 8);
          ctx.lineTo(-8, 8);
          ctx.closePath();
          ctx.strokeShape(shape);
        }}
        stroke={lineColor}
        strokeWidth={2}
      />
      <Circle x={10} y={0} radius={2} stroke={lineColor} strokeWidth={2} fill="white" />
      <Line points={[-20, -4, -8, -4]} stroke={lineColor} strokeWidth={1} lineCap="round" />
      <Line points={[-20, 4, -8, 4]} stroke={lineColor} strokeWidth={1} lineCap="round" />
      <Line points={[12, 0, 20, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" />
    </Group>
  );
}
