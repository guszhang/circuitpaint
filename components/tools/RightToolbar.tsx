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
      title="Tools"
      group="drawing"
      side="right"
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
          case 'label':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <rect x="4" y="6" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="2" />
                <text x="12" y="15" fontSize="8" textAnchor="middle" fill="currentColor">
                  LBL
                </text>
              </svg>
            );
          case 'text':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="6" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="7" x2="12" y2="19" stroke="currentColor" strokeWidth="2" />
              </svg>
            );
          case 'voltage-annotation':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="7" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="10" y1="9" x2="10" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
