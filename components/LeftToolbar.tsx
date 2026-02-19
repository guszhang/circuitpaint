'use client';

import React from 'react';
import styles from './LeftToolbar.module.css';
import { getToolsByGroup, type ToolId } from '../lib/tools';

interface LeftToolbarProps {
  onToolSelect?: (tool: ToolId) => void;
  selectedTool?: ToolId | '';
}

export default function LeftToolbar({ onToolSelect, selectedTool }: LeftToolbarProps) {
  const tools = getToolsByGroup('component');

  const handleToolClick = (toolId: ToolId) => {
    if (onToolSelect) {
      onToolSelect(toolId);
    }
  };

  return (
    <div className={styles.leftToolbar}>
      <div className={styles.toolbarTitle}>Components</div>
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
              <rect x="6" y="10" width="12" height="4" fill="currentColor" />
            </svg>
          </div>
          <div className={styles.label}>{tool.label}</div>
        </div>
      ))}
    </div>
  );
}
