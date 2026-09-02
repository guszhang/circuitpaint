'use client';

import React from 'react';
import { Group, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

interface RectangleShapeSymbolProps {
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  isSelected: boolean;
  shapeWidth?: number;
  shapeHeight?: number;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  listening?: boolean;
  onMouseDown?: (event: KonvaEventObject<MouseEvent>) => void;
}

export default function RectangleShapeSymbol({
  x,
  y,
  rotation,
  isSelected,
  shapeWidth = 40,
  shapeHeight = 40,
  strokeColor = 'black',
  strokeWidth = 1,
  opacity = 1,
  listening = true,
  onMouseDown,
}: RectangleShapeSymbolProps) {
  const width = Math.max(1, shapeWidth);
  const height = Math.max(1, shapeHeight);

  return (
    <Group x={x} y={y} rotation={rotation} opacity={opacity} listening={listening}>
      <Rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        hitStrokeWidth={10}
        onMouseDown={onMouseDown}
      />
      {isSelected && (
        <Rect
          x={-width / 2 - 2}
          y={-height / 2 - 2}
          width={width + 4}
          height={height + 4}
          stroke="#4f80ff"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Group>
  );
}
