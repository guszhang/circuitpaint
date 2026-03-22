'use client';

import React from 'react';
import { DRAWING_TOOL_FAMILIES, type DrawingToolId, type ToolId } from '../../lib/tools';
import ToolPanel from './ToolPanel';
import { useToolFamilySelection } from './useToolFamilySelection';

interface RightToolbarProps {
  onToolSelect?: (tool: ToolId) => void;
  selectedTool?: ToolId | '';
}

export default function RightToolbar({ onToolSelect, selectedTool }: RightToolbarProps) {
  const { toolIds, submenuByToolId, handleToolSelect } = useToolFamilySelection<DrawingToolId>(
    DRAWING_TOOL_FAMILIES,
    selectedTool
  );

  return (
    <ToolPanel
      title="Tools"
      group="drawing"
      side="right"
      toolIds={toolIds}
      submenuByToolId={submenuByToolId}
      onToolSelect={(tool) => {
        handleToolSelect(tool as DrawingToolId);
        onToolSelect?.(tool);
      }}
      selectedTool={selectedTool}
    />
  );
}
