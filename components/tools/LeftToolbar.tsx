'use client';

import React from 'react';
import { COMPONENT_TOOL_FAMILIES, type ComponentToolId, type ToolId } from '../../lib/tools';
import ToolPanel from './ToolPanel';
import { useToolFamilySelection } from './useToolFamilySelection';

interface LeftToolbarProps {
  onToolSelect?: (tool: ToolId) => void;
  selectedTool?: ToolId | '';
}

const SHORTCUTS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function LeftToolbar({ onToolSelect, selectedTool }: LeftToolbarProps) {
  const { toolIds, submenuByToolId, handleToolSelect } = useToolFamilySelection<ComponentToolId>(
    COMPONENT_TOOL_FAMILIES,
    selectedTool
  );

  return (
    <ToolPanel
      title="Components"
      group="component"
      side="left"
      shortcuts={SHORTCUTS}
      toolIds={toolIds}
      submenuByToolId={submenuByToolId}
      onToolSelect={(tool) => {
        handleToolSelect(tool as ComponentToolId);
        onToolSelect?.(tool);
      }}
      selectedTool={selectedTool}
    />
  );
}
