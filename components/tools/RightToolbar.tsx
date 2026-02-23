'use client';

import React, { useEffect, useState } from 'react';
import type { ToolId } from '../../lib/tools';
import ToolPanel from './ToolPanel';

interface RightToolbarProps {
  onToolSelect?: (tool: ToolId) => void;
  selectedTool?: ToolId | '';
}

export default function RightToolbar({ onToolSelect, selectedTool }: RightToolbarProps) {
  const [voltageFamilyTool, setVoltageFamilyTool] = useState<
    'voltage-plus-annotation' | 'voltage-minus-annotation'
  >('voltage-plus-annotation');

  useEffect(() => {
    if (selectedTool === 'voltage-plus-annotation' || selectedTool === 'voltage-minus-annotation') {
      setVoltageFamilyTool(selectedTool);
    }
  }, [selectedTool]);

  return (
    <ToolPanel
      title="Tools"
      group="drawing"
      side="right"
      toolIds={['joint', 'wire', 'text', voltageFamilyTool, 'current-annotation']}
      submenuByToolId={{
        [voltageFamilyTool]: ['voltage-plus-annotation', 'voltage-minus-annotation'],
      }}
      onToolSelect={onToolSelect}
      selectedTool={selectedTool}
      renderIcon={(tool) => {
        switch (tool.id) {
          case 'joint':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            );
          case 'wire':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="4" y1="6" x2="20" y2="18" stroke="currentColor" strokeWidth="2" />
              </svg>
            );
          case 'text':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="6" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="7" x2="12" y2="19" stroke="currentColor" strokeWidth="2" />
              </svg>
            );
          case 'voltage-plus-annotation':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            );
          case 'voltage-minus-annotation':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            );
          case 'current-annotation':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <polygon points="19,12 14,9 14,15" fill="currentColor" />
              </svg>
            );
          default:
            return null;
        }
      }}
    />
  );
}
