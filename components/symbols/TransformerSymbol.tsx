'use client';

import React from 'react';
import { Arc, Group, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type SymbolRotation = 0 | 90 | 180 | 270;

interface TransformerSymbolProps {
  x: number;
  y: number;
  rotation: SymbolRotation;
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

export default function TransformerSymbol({
  x,
  y,
  rotation,
  draggable = false,
  strokeColor,
  opacity = 1,
  listening = true,
  dragBoundFunc,
  onMouseDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: TransformerSymbolProps) {
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
      <Arc x={-12} y={20} innerRadius={4} outerRadius={4} angle={180} rotation={180} stroke={lineColor} strokeWidth={2} lineCap='round' lineJoin='round'/>
      <Arc x={-4} y={20} innerRadius={4} outerRadius={4} angle={180} rotation={180} stroke={lineColor} strokeWidth={2} lineCap='round' lineJoin='round'/>
      <Arc x={4} y={20} innerRadius={4} outerRadius={4} angle={180} rotation={180} stroke={lineColor} strokeWidth={2} lineCap='round' lineJoin='round'/>
      <Arc x={12} y={20} innerRadius={4} outerRadius={4} angle={180} rotation={180} stroke={lineColor} strokeWidth={2} lineCap='round' lineJoin='round'/>
      <Arc x={-12} y={-10} innerRadius={4} outerRadius={4} angle={180} rotation={0} stroke={lineColor} strokeWidth={2} lineCap='round' lineJoin='round'/>
      <Arc x={-4} y={-10} innerRadius={4} outerRadius={4} angle={180} rotation={0} stroke={lineColor} strokeWidth={2} lineCap='round' lineJoin='round'/>
      <Arc x={4} y={-10} innerRadius={4} outerRadius={4} angle={180} rotation={0} stroke={lineColor} strokeWidth={2} lineCap='round' lineJoin='round'/>
      <Arc x={12} y={-10} innerRadius={4} outerRadius={4} angle={180} rotation={0} stroke={lineColor} strokeWidth={2} lineCap='round' lineJoin='round'/>
      <Line points={[-20, 20, -16, 20]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Line points={[16, 20, 20, 20]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Line points={[-20, -10, -16, -10]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Line points={[16, -10, 20, -10]} stroke={lineColor} strokeWidth={1} lineCap="round" lineJoin="round" />
      <Line points={[-16, 3, 16, 3]} stroke={lineColor} strokeWidth={2} lineCap="round" lineJoin="round" />
      <Line points={[-16, 7, 16, 7]} stroke={lineColor} strokeWidth={2} lineCap="round" lineJoin="round" />
    </Group>
  );
}
