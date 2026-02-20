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
      renderIcon={(tool) => {
        switch (tool.id) {
          case 'resistor':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polyline
                  points="3,12 6,9 8,15 10,9 12,15 14,9 16,15 18,12 21,12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            );
          case 'capacitor':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="4" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="9" y1="7" x2="9" y2="17" stroke="currentColor" strokeWidth="2" />
                <line x1="15" y1="7" x2="15" y2="17" stroke="currentColor" strokeWidth="2" />
                <line x1="15" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" />
              </svg>
            );
          case 'inductor':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M4 12h2c1 0 1-4 3-4s2 4 4 4 2-4 4-4 2 4 4 4h1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            );
          case 'diode':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="4" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" />
                <polygon points="9,6 17,12 9,18" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="17" y1="6" x2="17" y2="18" stroke="currentColor" strokeWidth="2" />
                <line x1="17" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" />
              </svg>
            );
          case 'transistor':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="6" x2="12" y2="4" stroke="currentColor" strokeWidth="2" />
                <line x1="16" y1="16" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
              </svg>
            );
          case 'ic':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="16" x2="6" y2="16" stroke="currentColor" strokeWidth="2" />
                <line x1="18" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="2" />
                <line x1="18" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="18" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="2" />
              </svg>
            );
          case 'ground':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="12" y1="4" x2="12" y2="10" stroke="currentColor" strokeWidth="2" />
                <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="2" />
                <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="2" />
                <line x1="10" y1="16" x2="14" y2="16" stroke="currentColor" strokeWidth="2" />
              </svg>
            );
          case 'power':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2" />
                <line x1="6" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
              </svg>
            );
          default:
            return null;
        }
      }}
    />
  );
}
