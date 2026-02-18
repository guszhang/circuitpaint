'use client';

import React from 'react';
import styles from './RightToolbar.module.css';

interface RightToolbarProps {
  onToolSelect?: (tool: string) => void;
  selectedTool?: string;
}

export default function RightToolbar({ onToolSelect, selectedTool }: RightToolbarProps) {
  const tools = [
    { id: 'wire', label: 'Wire' },
    { id: 'bus', label: 'Bus' },
    { id: 'label', label: 'Label' },
    { id: 'text', label: 'Text' },
    { id: 'note', label: 'Note' },
  ];

  const handleToolClick = (toolId: string) => {
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
