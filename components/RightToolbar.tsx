'use client';

import React from 'react';
import styles from './RightToolbar.module.css';
import { getToolsByGroup, type ToolId } from '../lib/tools';

interface RightToolbarProps {
  onToolSelect?: (tool: ToolId) => void;
  selectedTool?: ToolId | '';
}

export default function RightToolbar({ onToolSelect, selectedTool }: RightToolbarProps) {
  const tools = getToolsByGroup('drawing');

  const handleToolClick = (toolId: ToolId) => {
    if (onToolSelect) {
      onToolSelect(toolId);
    }
  };

  return (
    <div className={styles.rightToolbar}>
      <div className={styles.toolbarTitle}>Wiring & Annotation</div>
      {tools.map((tool) => (
        <div
          key={tool.id}
          className={`${styles.toolButton} ${
            selectedTool === tool.id ? styles.selected : ''
          }`}
          onClick={() => handleToolClick(tool.id)}
          title={tool.label}
        >
          <div className={styles.icon}>
            {/* Placeholder SVG icons */}
            <svg width="24" height="24" viewBox="0 0 24 24">
              <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className={styles.label}>{tool.label}</div>
        </div>
      ))}
    </div>
  );
}
