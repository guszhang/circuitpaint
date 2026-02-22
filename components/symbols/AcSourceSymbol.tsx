'use client';

import React from 'react';
import { Circle, Group, Line, Rect, Shape } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type SymbolRotation = 0 | 90 | 180 | 270;

interface AcSourceSymbolProps {
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

export default function AcSourceSymbol({
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
}: AcSourceSymbolProps) {
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
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(-6, 0);
          ctx.bezierCurveTo(-4, -4, -2, -4, 0, 0);
          ctx.bezierCurveTo(2, 4, 4, 4, 6, 0);
          ctx.strokeShape(shape);
        }}
        stroke={lineColor}
        strokeWidth={1.5}
        lineCap="round"
        lineJoin="round"
      />
      <Line points={[-20, 0, -12, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Line points={[12, 0, 20, 0]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
    </Group>
  );
}
