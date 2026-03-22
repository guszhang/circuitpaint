'use client';

import React from 'react';
import { Group, Line } from 'react-konva';

interface WireSymbolProps {
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  isSelected: boolean;
  strokeColor?: string;
  opacity?: number;
  listening?: boolean;
}

export default function WireSymbol({
  x,
  y,
  rotation,
  strokeColor,
  opacity = 1,
  listening = true,
}: WireSymbolProps) {
  return (
    <Group x={x} y={y} rotation={rotation} opacity={opacity} listening={listening}>
      <Line points={[-10, -6, 10, 6]} stroke={strokeColor ?? 'black'} strokeWidth={2} lineCap="round" lineJoin="round" />
    </Group>
  );
}
