'use client';

import React from 'react';
import { Arrow, Group, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

type SymbolRotation = 0 | 90 | 180 | 270;

interface CurrentAnnotationSymbolProps {
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
  onDoubleClick?: (e: KonvaEventObject<MouseEvent>) => void;
  onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<DragEvent>) => void;
}

export default function CurrentAnnotationSymbol({
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
  onDoubleClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}: CurrentAnnotationSymbolProps) {
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
      onDblClick={onDoubleClick}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      <Rect x={-20} y={-12} width={40} height={24} fill="black" opacity={0} />
      {isSelected && (
        <Rect x={-20} y={-12} width={40} height={24} stroke="#4f80ff" strokeWidth={1} dash={[4, 4]} listening={false} />
      )}
      <Arrow
        points={[-12, 0, 12, 0]}
        stroke={lineColor}
        fill={lineColor}
        strokeWidth={1.8}
        pointerLength={5}
        pointerWidth={5}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
}
