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
                  points="3,12 6,12 7,9 9,15 11,9 13,15 15,9 17,15 18,12 21,12"
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
                <line x1="4" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="10" y1="7" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="14" y1="7" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="15" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
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
                <line x1="4" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <polygon points="9,6 17,12 9,18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin='round'/>
                <line x1="17" y1="6" x2="17" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap='round'/>
                <line x1="17" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round'/>
              </svg>
            );
          case 'switch':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="2" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="16" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="8" y1="12" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          case 'ic':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin='round' />
                <line x1="4" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="4" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="4" y1="16" x2="6" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="18" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="18" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="18" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          case 'ground':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="12" y1="4" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="8" y1="15" x2="16" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="11" y1="18" x2="13" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          case 'source':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="10" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="12" y1="7" x2="12" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="10" y1="15" x2="14" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          default:
            return null;
        }
      }}
    />
  );
}
