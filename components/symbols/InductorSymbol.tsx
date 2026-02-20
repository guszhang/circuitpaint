'use client';

import React from 'react';
import { Group, Line, Rect, Arc} from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

export type SymbolRotation = 0 | 90 | 180 | 270;

interface InductorSymbolProps {
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

export default function InductorSymbol({
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
}: InductorSymbolProps) {
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
      <Arc
        x = {-12}
        y = {0}
        innerRadius={4}
        outerRadius={4}
        angle={180}
        rotation={180}
        stroke={lineColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
      <Arc
        x = {-4}
        y = {0}
        innerRadius={4}
        outerRadius={4}
        angle={180}
        rotation={180}
        stroke={lineColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
      <Arc
        x = {4}
        y = {0}
        innerRadius={4}
        outerRadius={4}
        angle={180}
        rotation={180}
        stroke={lineColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      /> 
      <Arc
        x = {12}
        y = {0}
        innerRadius={4}
        outerRadius={4}
        angle={180}
        rotation={180}
        stroke={lineColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[-20, 0, -16, 0]}
        stroke={lineColor}
        strokeWidth={1}
        lineCap="round"
        lineJoin="round"
      />
      <Line
        points={[16, 0, 20, 0]}
        stroke={lineColor}
        strokeWidth={1}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
}
