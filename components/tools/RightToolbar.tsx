'use client';

import React from 'react';
import { DRAWING_TOOL_FAMILIES, type DrawingToolId, type ToolId } from '../../lib/tools';
import ToolPanel from './ToolPanel';
import { useToolFamilySelection } from './useToolFamilySelection';
import styles from './ToolPanel.module.css';

interface RightToolbarProps {
  onToolSelect?: (tool: ToolId) => void;
  selectedTool?: ToolId | '';
  halfGridEnabled?: boolean;
  onHalfGridChange?: (enabled: boolean) => void;
}

export default function RightToolbar({
  onToolSelect,
  selectedTool,
  halfGridEnabled = false,
  onHalfGridChange,
}: RightToolbarProps) {
  const { toolIds, submenuByToolId, handleToolSelect } = useToolFamilySelection<DrawingToolId>(
    DRAWING_TOOL_FAMILIES,
    selectedTool
  );

  return (
    <ToolPanel
      title="Tools"
      group="drawing"
      side="right"
      toolIds={toolIds}
      submenuByToolId={submenuByToolId}
      onToolSelect={(tool) => {
        handleToolSelect(tool as DrawingToolId);
        onToolSelect?.(tool);
      }}
      selectedTool={selectedTool}
      footer={
        <div className={styles.halfGridControl}>
          <div className={styles.halfGridLabel}>Half-grid</div>
          <button
            type="button"
            role="switch"
            aria-checked={halfGridEnabled}
            aria-label="Half-grid"
            className={`${styles.halfGridSwitch} ${halfGridEnabled ? styles.halfGridSwitchOn : ''}`}
            onClick={() => onHalfGridChange?.(!halfGridEnabled)}
          >
            <span className={styles.halfGridSwitchThumb} />
          </button>
        </div>
      }
    />
  );
}
