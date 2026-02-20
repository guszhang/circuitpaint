'use client';

import React from 'react';
import type { ToolId } from '../../lib/tools';
import ToolPanel from './ToolPanel';

interface LeftToolbarProps {
  onToolSelect?: (tool: ToolId) => void;
  selectedTool?: ToolId | '';
}

export default function LeftToolbar({ onToolSelect, selectedTool }: LeftToolbarProps) {
  return (
    <ToolPanel
      title="Components"
      group="component"
      side="left"
      onToolSelect={onToolSelect}
      selectedTool={selectedTool}
      renderIcon={() => (
        <svg width="24" height="24" viewBox="0 0 24 24">
          <rect x="6" y="10" width="12" height="4" fill="currentColor" />
        </svg>
      )}
    />
  );
}
