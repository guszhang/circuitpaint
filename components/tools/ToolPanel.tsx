'use client';

import React from 'react';
import {
  getToolsByGroup,
  type ToolDefinition,
  type ToolGroup,
  type ToolId,
} from '../../lib/tools';
import styles from './ToolPanel.module.css';

interface ToolPanelProps {
  title: string;
  group: ToolGroup;
  side: 'left' | 'right';
  selectedTool?: ToolId | '';
  onToolSelect?: (tool: ToolId) => void;
  renderIcon?: (tool: ToolDefinition) => React.ReactNode;
}

const defaultRenderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" fill="currentColor" />
  </svg>
);

export default function ToolPanel({
  title,
  group,
  side,
  selectedTool,
  onToolSelect,
  renderIcon = defaultRenderIcon,
}: ToolPanelProps) {
  const tools = getToolsByGroup(group);
  const panelClassName = `${styles.panel} ${side === 'left' ? styles.panelLeft : styles.panelRight}`;

  const handleToolClick = (toolId: ToolId) => {
    onToolSelect?.(toolId);
  };

  return (
    <div className={panelClassName}>
      <div className={styles.toolbarTitle}>{title}</div>
      {tools.map((tool) => {
        const isSelected = selectedTool === tool.id;
        const toolButtonClass = `${styles.toolButton} ${isSelected ? styles.selected : ''}`;
        return (
          <button
            key={tool.id}
            type="button"
            className={toolButtonClass}
            onClick={() => handleToolClick(tool.id)}
            title={tool.label}
          >
            <div className={styles.icon}>{renderIcon(tool)}</div>
            <div className={styles.label}>{tool.label}</div>
          </button>
        );
      })}
    </div>
  );
}
