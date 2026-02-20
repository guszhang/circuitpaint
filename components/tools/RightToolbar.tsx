'use client';

import React from 'react';
import type { ToolId } from '../../lib/tools';
import ToolPanel from './ToolPanel';

interface RightToolbarProps {
  onToolSelect?: (tool: ToolId) => void;
  selectedTool?: ToolId | '';
}

export default function RightToolbar({ onToolSelect, selectedTool }: RightToolbarProps) {
  return (
    <ToolPanel
      title="Wiring & Annotation"
      group="drawing"
      side="right"
      onToolSelect={onToolSelect}
      selectedTool={selectedTool}
      renderIcon={() => (
        <svg width="24" height="24" viewBox="0 0 24 24">
          <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    />
  );
}
