'use client';

import React from 'react';
import { Group, Layer, Stage } from 'react-konva';
import type { ToolId } from '../../lib/tools';
import {
  getToolSymbolIconScale,
  getToolSymbolComponent,
  getToolSymbolPreviewProps,
} from '../symbols/toolSymbols';

interface ToolSymbolIconProps {
  toolId: ToolId;
}

const TOOL_ICON_COLOR = '#2a3b57';

export default function ToolSymbolIcon({ toolId }: ToolSymbolIconProps) {
  const SymbolComponent = getToolSymbolComponent(toolId);

  if (!SymbolComponent) {
    return null;
  }

  const scale = getToolSymbolIconScale(toolId);

  return (
    <Stage width={24} height={24} listening={false}>
      <Layer listening={false}>
        <Group x={12} y={12} scaleX={scale} scaleY={scale} listening={false}>
          <SymbolComponent
            x={0}
            y={0}
            rotation={0}
            isSelected={false}
            strokeColor={TOOL_ICON_COLOR}
            listening={false}
            {...getToolSymbolPreviewProps(toolId)}
          />
        </Group>
      </Layer>
    </Stage>
  );
}
