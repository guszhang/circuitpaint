'use client';

import React from 'react';
import { Circle, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

interface CircleShapeSymbolProps {
  x: number;
  y: number;
  rotation: 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;
  isSelected: boolean;
  radiusX?: number;
  radiusY?: number;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  listening?: boolean;
  onMouseDown?: (event: KonvaEventObject<MouseEvent>) => void;
}

export default function CircleShapeSymbol({
  x,
  y,
  rotation,
  isSelected,
  radiusX = 20,
  radiusY = 0,
  strokeColor = 'black',
  strokeWidth = 1,
  opacity = 1,
  listening = true,
  onMouseDown,
}: CircleShapeSymbolProps) {
  const radius = Math.max(1, Math.hypot(radiusX, radiusY));

  return (
    <Group x={x} y={y} rotation={rotation} opacity={opacity} listening={listening}>
      <Circle
        radius={radius}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        hitStrokeWidth={10}
        onMouseDown={onMouseDown}
      />
      {isSelected && (
        <Circle
          radius={radius + 2}
          stroke="#4f80ff"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Group>
  );
}
