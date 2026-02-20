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
          case 'note':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M6 4h9l3 3v13H6z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line x1="9" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="2" />
                <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
              </svg>
            );
          default:
            return null;
        }
      }}
    />
  );
}
