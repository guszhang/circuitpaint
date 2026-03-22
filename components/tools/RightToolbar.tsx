'use client';

import React, { useEffect, useState } from 'react';
import type { ToolId } from '../../lib/tools';
import ToolPanel from './ToolPanel';

interface RightToolbarProps {
  onToolSelect?: (tool: ToolId) => void;
  selectedTool?: ToolId | '';
}

export default function RightToolbar({ onToolSelect, selectedTool }: RightToolbarProps) {
  const [jointFamilyTool, setJointFamilyTool] = useState<'joint' | 'port'>('joint');
  const [voltageFamilyTool, setVoltageFamilyTool] = useState<
    'voltage-plus-annotation' | 'voltage-minus-annotation'
  >('voltage-plus-annotation');

  useEffect(() => {
    if (selectedTool === 'joint' || selectedTool === 'port') {
      setJointFamilyTool(selectedTool);
    }
    if (selectedTool === 'voltage-plus-annotation' || selectedTool === 'voltage-minus-annotation') {
      setVoltageFamilyTool(selectedTool);
    }
  }, [selectedTool]);

  return (
    <ToolPanel
      title="Tools"
      group="drawing"
      side="right"
      toolIds={[jointFamilyTool, 'wire', 'text', voltageFamilyTool, 'current-annotation']}
      submenuByToolId={{
        [jointFamilyTool]: ['joint', 'port'],
        [voltageFamilyTool]: ['voltage-plus-annotation', 'voltage-minus-annotation'],
      }}
      onToolSelect={(tool) => {
        if (tool === 'joint' || tool === 'port') {
          setJointFamilyTool(tool);
        }
        if (tool === 'voltage-plus-annotation' || tool === 'voltage-minus-annotation') {
          setVoltageFamilyTool(tool);
        }
        onToolSelect?.(tool);
      }}
      selectedTool={selectedTool}
    />
  );
}
