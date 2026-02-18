'use client';

import React from 'react';
import { Group, Shape } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

export interface ResistorData {
  id: string;
  x: number;
  y: number;
  rotation: number; // Rotation angle in degrees (typically 0, 90, 180, 270)
  selected: boolean;
}

interface ResistorProps {
  data: ResistorData;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

const RESISTOR_WIDTH = 40;
const RESISTOR_HEIGHT = 10;

export default function Resistor({ data, onSelect, onDragEnd }: ResistorProps) {
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect(data.id);
  };

  const handleTap = (e: KonvaEventObject<TouchEvent>) => {
    e.cancelBubble = true;
    onSelect(data.id);
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onDragEnd(data.id, node.x(), node.y());
  };

  return (
    <Group
      x={data.x}
      y={data.y}
      rotation={data.rotation}
      draggable
      onClick={handleClick}
      onTap={handleTap}
      onDragEnd={handleDragEnd}
    >
      {/* Selection highlight */}
      {data.selected && (
        <Shape
          sceneFunc={(context, shape) => {
            context.beginPath();
            context.rect(-RESISTOR_WIDTH / 2 - 3, -RESISTOR_HEIGHT / 2 - 3, RESISTOR_WIDTH + 6, RESISTOR_HEIGHT + 6);
            context.fillStrokeShape(shape);
          }}
          stroke="#00aaff"
          strokeWidth={2}
          listening={false}
        />
      )}

      {/* Resistor body - zigzag pattern */}
      <Shape
        sceneFunc={(context, shape) => {
          const halfWidth = RESISTOR_WIDTH / 2;
          const halfHeight = RESISTOR_HEIGHT / 2;
          
          // Left lead
          context.beginPath();
          context.moveTo(-halfWidth - 10, 0);
          context.lineTo(-halfWidth, 0);
          
          // Zigzag body (6 segments)
          const segmentWidth = RESISTOR_WIDTH / 6;
          for (let i = 0; i < 6; i++) {
            const x = -halfWidth + segmentWidth * i;
            const y = (i % 2 === 0) ? -halfHeight : halfHeight;
            context.lineTo(x + segmentWidth / 2, y);
            context.lineTo(x + segmentWidth, 0);
          }
          
          // Right lead
          context.lineTo(halfWidth + 10, 0);
          
          context.fillStrokeShape(shape);
        }}
        stroke={data.selected ? "#00aaff" : "#000000"}
        strokeWidth={2}
        listening={false}
      />
    </Group>
  );
}
