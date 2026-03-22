'use client';

import React, { useEffect, useState } from 'react';
import type { ToolId } from '../../lib/tools';
import ToolPanel from './ToolPanel';

interface LeftToolbarProps {
  onToolSelect?: (tool: ToolId) => void;
  selectedTool?: ToolId | '';
}

export default function LeftToolbar({ onToolSelect, selectedTool }: LeftToolbarProps) {
  const [resistorFamilyTool, setResistorFamilyTool] = useState<'resistor' | 'potentiometer'>('resistor');
  const [capacitorFamilyTool, setCapacitorFamilyTool] = useState<
    'capacitor' | 'polarised-capacitor' | 'variable-capacitor'
  >('capacitor');
  const [inductorFamilyTool, setInductorFamilyTool] = useState<
    'inductor' | 'variable-inductor' | 'transformer'
  >('inductor');
  const [diodeFamilyTool, setDiodeFamilyTool] = useState<'diode' | 'zener-diode' | 'schottky-diode'>('diode');
  const [switchFamilyTool, setSwitchFamilyTool] = useState<
    'switch' | 'n-mosfet' | 'p-mosfet' | 'npn-bjt' | 'pnp-bjt' | 'spark-gap'
  >('switch');
  const [icFamilyTool, setIcFamilyTool] = useState<
    'ic' | 'not-gate' | 'and-gate' | 'or-gate' | 'nand-gate' | 'nor-gate' | 'xor-gate' | 'opamp'
  >('ic');
  const [sourceFamilyTool, setSourceFamilyTool] = useState<
    'source' | 'current-source' | 'ac-source' | 'controlled-voltage-source' | 'controlled-current-source'
  >('source');

  useEffect(() => {
    if (selectedTool === 'resistor' || selectedTool === 'potentiometer') {
      setResistorFamilyTool(selectedTool);
    }
    if (
      selectedTool === 'capacitor' ||
      selectedTool === 'polarised-capacitor' ||
      selectedTool === 'variable-capacitor'
    ) {
      setCapacitorFamilyTool(selectedTool);
    }
    if (selectedTool === 'inductor' || selectedTool === 'variable-inductor' || selectedTool === 'transformer') {
      setInductorFamilyTool(selectedTool);
    }
    if (selectedTool === 'diode' || selectedTool === 'zener-diode' || selectedTool === 'schottky-diode') {
      setDiodeFamilyTool(selectedTool);
    }
    if (
      selectedTool === 'switch' ||
      selectedTool === 'n-mosfet' ||
      selectedTool === 'p-mosfet' ||
      selectedTool === 'npn-bjt' ||
      selectedTool === 'pnp-bjt' ||
      selectedTool === 'spark-gap'
    ) {
      setSwitchFamilyTool(selectedTool);
    }
    if (
      selectedTool === 'ic' ||
      selectedTool === 'not-gate' ||
      selectedTool === 'and-gate' ||
      selectedTool === 'or-gate' ||
      selectedTool === 'nand-gate' ||
      selectedTool === 'nor-gate' ||
      selectedTool === 'xor-gate' ||
      selectedTool === 'opamp'
    ) {
      setIcFamilyTool(selectedTool);
    }
    if (
      selectedTool === 'source' ||
      selectedTool === 'current-source' ||
      selectedTool === 'ac-source' ||
      selectedTool === 'controlled-voltage-source' ||
      selectedTool === 'controlled-current-source'
    ) {
      setSourceFamilyTool(selectedTool);
    }
  }, [selectedTool]);

  return (
    <ToolPanel
      title="Components"
      group="component"
      side="left"
      toolIds={[
        resistorFamilyTool,
        capacitorFamilyTool,
        inductorFamilyTool,
        diodeFamilyTool,
        switchFamilyTool,
        icFamilyTool,
        sourceFamilyTool,
        'ground',
      ]}
      submenuByToolId={{
        [resistorFamilyTool]: ['resistor', 'potentiometer'],
        [capacitorFamilyTool]: ['capacitor', 'polarised-capacitor', 'variable-capacitor'],
        [inductorFamilyTool]: ['inductor', 'variable-inductor', 'transformer'],
        [diodeFamilyTool]: ['diode', 'zener-diode', 'schottky-diode'],
        [switchFamilyTool]: ['switch', 'n-mosfet', 'p-mosfet', 'npn-bjt', 'pnp-bjt', 'spark-gap'],
        [icFamilyTool]: ['ic', 'not-gate', 'and-gate', 'or-gate', 'nand-gate', 'nor-gate', 'xor-gate', 'opamp'],
        [sourceFamilyTool]: [
          'source',
          'current-source',
          'ac-source',
          'controlled-voltage-source',
          'controlled-current-source',
        ],
      }}
      onToolSelect={(tool) => {
        if (tool === 'resistor' || tool === 'potentiometer') {
          setResistorFamilyTool(tool);
        }
        if (tool === 'capacitor' || tool === 'polarised-capacitor' || tool === 'variable-capacitor') {
          setCapacitorFamilyTool(tool);
        }
        if (tool === 'inductor' || tool === 'variable-inductor' || tool === 'transformer') {
          setInductorFamilyTool(tool);
        }
        if (tool === 'diode' || tool === 'zener-diode' || tool === 'schottky-diode') {
          setDiodeFamilyTool(tool);
        }
        if (
          tool === 'switch' ||
          tool === 'n-mosfet' ||
          tool === 'p-mosfet' ||
          tool === 'npn-bjt' ||
          tool === 'pnp-bjt' ||
          tool === 'spark-gap'
        ) {
          setSwitchFamilyTool(tool);
        }
        if (
          tool === 'ic' ||
          tool === 'not-gate' ||
          tool === 'and-gate' ||
          tool === 'or-gate' ||
          tool === 'nand-gate' ||
          tool === 'nor-gate' ||
          tool === 'xor-gate' ||
          tool === 'opamp'
        ) {
          setIcFamilyTool(tool);
        }
        if (
          tool === 'source' ||
          tool === 'current-source' ||
          tool === 'ac-source' ||
          tool === 'controlled-voltage-source' ||
          tool === 'controlled-current-source'
        ) {
          setSourceFamilyTool(tool);
        }
        onToolSelect?.(tool);
      }}
      selectedTool={selectedTool}
    />
  );
}
