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
      toolIds={[resistorFamilyTool, capacitorFamilyTool, inductorFamilyTool, diodeFamilyTool, switchFamilyTool, icFamilyTool, sourceFamilyTool, 'ground']}
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
          case 'potentiometer':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polyline
                  points="4,12 7.2,12 8,10.4 9.6,13.6 11.2,10.4 12.8,13.6 14.4,10.4 16,13.6 16.8,12 20,12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <line x1="12" y1="4" x2="12" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <polygon points="10.8,8.4 13.2,8.4 12,10.8" fill="currentColor" />
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
          case 'polarised-capacitor':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="4" y1="12" x2="11.2" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="11.2" y1="9.6" x2="11.2" y2="14.4" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <path d="M12.8 9.6 Q11.6 12 12.8 14.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="12" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="8.8" y1="9.6" x2="8.8" y2="11.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap='round' />
                <line x1="8" y1="10.4" x2="9.6" y2="10.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap='round' />
              </svg>
            );
          case 'variable-capacitor':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="4" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="10" y1="7" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="14" y1="7" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="15" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="17" y1="5" x2="9" y2="17" stroke="currentColor" strokeWidth="1.7" strokeLinecap='round' />
                <polygon points="8,14 8,18 11,16" fill="currentColor" />
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
          case 'variable-inductor':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M4 12h2c1 0 1-4 3-4s2 4 4 4 2-4 4-4 2 4 4 4h1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line x1="18" y1="5" x2="8" y2="17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <polygon points="7,14 7,18 10,16" fill="currentColor" />
              </svg>
            );
          case 'transformer':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M8 5c-1.6 0-1.6 2 0 2s1.6 2 0 2s-1.6 2 0 2s1.6 2 0 2s-1.6 2 0 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M16 5c-1.6 0-1.6 2 0 2s1.6 2 0 2s-1.6 2 0 2s1.6 2 0 2s-1.6 2 0 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="4" y1="5" x2="6.4" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="17.6" y1="5" x2="20" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="4" y1="19" x2="6.4" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="17.6" y1="19" x2="20" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="10" y1="8.5" x2="14" y2="8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
          case 'zener-diode':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="4" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap='round' />
                <polyline points="14,12 10,9.6 10,14.4 14,12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin='round' strokeLinecap='round' />
                <polyline points="14.8,9.2 14,10 14,14 13.2,14.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin='round' strokeLinecap='round' />
                <line x1="14" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap='round'/>
              </svg>
            );
          case 'schottky-diode':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="4" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap='round' />
                <polyline points="14,12 10,9.6 10,14.4 14,12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin='round' strokeLinecap='round' />
                <polyline points="14.8,10 14.8,9.2 14,9.2 14,14.8 13.2,14.8 13.2,14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin='round' strokeLinecap='round' />
                <line x1="14" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap='round'/>
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
          case 'n-mosfet':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polyline points="4,12 9.6,12 9.6,15.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8.8" y1="15.2" x2="15.2" y2="15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="9.6" y1="16.8" x2="14.4" y2="16.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1="16.8" x2="12" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="12" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="14.4" y1="12" x2="14.4" y2="15.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="12" y1="12" x2="12" y2="15.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <polygon points="11.1,14.1 12.9,14.1 12,15.8" fill="currentColor" />
              </svg>
            );
          case 'p-mosfet':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polyline points="4,12 9.6,12 9.6,15.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8.8" y1="15.2" x2="15.2" y2="15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="9.6" y1="16.8" x2="14.4" y2="16.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1="16.8" x2="12" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="9.6" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <polyline points="14.4,15.2 14.4,12 20,12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <polygon points="11.1,13.9 12.9,13.9 12,12.2" fill="currentColor" />
              </svg>
            );
          case 'npn-bjt':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="4" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="16" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="8" y1="12" x2="10.4" y2="15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="8.8" y1="15.2" x2="15.2" y2="15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1="15.2" x2="12" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="13.6" y1="15.2" x2="16" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <polygon points="14.7,12.6 16.8,11.8 15.8,13.8" fill="currentColor" />
              </svg>
            );
          case 'pnp-bjt':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="4" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="16" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="16" y1="12" x2="13.6" y2="15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="8.8" y1="15.2" x2="15.2" y2="15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1="15.2" x2="12" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="8" y1="12" x2="10.4" y2="14.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <polygon points="8.6,12.2 10.8,14 8.9,14.5" fill="currentColor" />
              </svg>
            );
          case 'spark-gap':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="15" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <polyline points="9,9 11,12 9,15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="15,9 13,12 15,15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );
          case 'ic':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polygon points="8,6 8,18 18,12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin='round' />
                <line x1="4" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="18" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          case 'not-gate':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polygon points="8,6 8,18 17,12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin='round' />
                <circle cx="18.5" cy="12" r="1.5" fill="white" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="20" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          case 'and-gate':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M8 6h4c3 0 5 2.5 5 6s-2 6-5 6H8z" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="4" y1="15" x2="8" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="17" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          case 'or-gate':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M7 6c4 0 7 2 10 6-3 4-6 6-10 6 1.6-1.8 1.6-8.2 0-12z" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="4" y1="15" x2="8" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="17" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          case 'nand-gate':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M8 6h4c3 0 5 2.5 5 6s-2 6-5 6H8z" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="12" r="1.5" fill="white" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="4" y1="15" x2="8" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="19.5" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          case 'nor-gate':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M7 6c4 0 7 2 10 6-3 4-6 6-10 6 1.6-1.8 1.6-8.2 0-12z" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="12" r="1.5" fill="white" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="4" y1="15" x2="8" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="19.5" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          case 'xor-gate':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M7 6c4 0 7 2 10 6-3 4-6 6-10 6 1.6-1.8 1.6-8.2 0-12z" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M5.5 6c1.6 1.8 1.6 8.2 0 12" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="4" y1="9" x2="7" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="4" y1="15" x2="7" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="17" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          case 'opamp':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polygon points="8,6 8,18 18,12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin='round' />
                <line x1="4" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="4" y1="15" x2="8" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="18" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="5.5" y1="9" x2="7" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap='round' />
                <line x1="6.25" y1="8.2" x2="6.25" y2="9.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap='round' />
                <line x1="5.5" y1="15" x2="7" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap='round' />
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
          case 'current-source':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="12" y1="16" x2="12" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <polygon points="12,7 9,11 15,11" fill="currentColor" />
              </svg>
            );
          case 'ac-source':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <path d="M8 12c1.2-2 2.8-2 4 0s2.8 2 4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            );
          case 'controlled-voltage-source':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polygon points="12,4 18,12 12,20 6,12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="10" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
              </svg>
            );
          case 'controlled-current-source':
            return (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polygon points="12,4 18,12 12,20 6,12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <line x1="12" y1="15" x2="12" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap='round' />
                <polygon points="12,8 9,11 15,11" fill="currentColor" />
              </svg>
            );
          default:
            return null;
        }
      }}
    />
  );
}
