'use client';

import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import {
  LABEL_FONT_FAMILY,
  LABEL_PADDING_X,
  LABEL_PADDING_Y,
  getTextSymbolFontSize,
  measureRenderedText,
} from './textMetrics';

type SymbolRotation = 0 | 90 | 180 | 270;

interface TextSymbolProps {
  x: number;
  y: number;
  rotation: SymbolRotation;
  isSelected: boolean;
  text?: string;
  border?: boolean;
  fontSize?: number;
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

export default function TextSymbol({
  x,
  y,
  rotation,
  isSelected,
  text = 'Text',
  border = false,
  fontSize,
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
}: TextSymbolProps) {
  const lineColor = strokeColor ?? 'black';
  const resolvedFontSize = getTextSymbolFontSize(fontSize);
  const metrics = measureRenderedText(text, resolvedFontSize);
  const boxWidth = Math.max(24, metrics.width + LABEL_PADDING_X * 2);
  const boxHeight = Math.max(16, metrics.height + LABEL_PADDING_Y * 2);
  const labelBoxX = -boxWidth / 2;
  const labelBoxY = -boxHeight / 2;

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
      <Rect x={labelBoxX - 2} y={labelBoxY - 2} width={boxWidth + 4} height={boxHeight + 4} fill="black" opacity={0} />
      {isSelected && (
        <Rect
          x={labelBoxX - 2}
          y={labelBoxY - 2}
          width={boxWidth + 4}
          height={boxHeight + 4}
          stroke="#4f80ff"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
      {border && <Rect x={labelBoxX} y={labelBoxY} width={boxWidth} height={boxHeight} stroke={lineColor} strokeWidth={1.2} />}
      {!listening && (
        <Text
          x={labelBoxX + LABEL_PADDING_X}
          y={labelBoxY + LABEL_PADDING_Y}
          width={boxWidth - LABEL_PADDING_X * 2}
          height={boxHeight - LABEL_PADDING_Y * 2}
          fontSize={resolvedFontSize}
          fontFamily={LABEL_FONT_FAMILY}
          align="center"
          verticalAlign="middle"
          text={text}
          fill={lineColor}
          listening={false}
        />
      )}
    </Group>
  );
}
