'use client';

import React from 'react';
import type { ComponentToolId, DrawingToolId, ToolId } from '../../lib/tools';
import AcSourceSymbol from './AcSourceSymbol';
import AndGateSymbol from './AndGateSymbol';
import BridgeSymbol from './BridgeSymbol';
import CapacitorSymbol from './CapacitorSymbol';
import ChassisGroundSymbol from './ChassisGroundSymbol';
import ControlledCurrentSourceSymbol from './ControlledCurrentSourceSymbol';
import ControlledVoltageSourceSymbol from './ControlledVoltageSourceSymbol';
import CurrentAnnotationSymbol from './CurrentAnnotationSymbol';
import CurrentSourceSymbol from './CurrentSourceSymbol';
import DiodeSymbol from './DiodeSymbol';
import GroundSymbol from './GroundSymbol';
import HalfCircleSymbol from './HalfCircleSymbol';
import IcSymbol from './IcSymbol';
import InductorSymbol from './InductorSymbol';
import JointSymbol from './JointSymbol';
import NMosfetSymbol from './NMosfetSymbol';
import NandGateSymbol from './NandGateSymbol';
import NorGateSymbol from './NorGateSymbol';
import NotGateSymbol from './NotGateSymbol';
import NpnBjtSymbol from './NpnBjtSymbol';
import OpAmpSymbol from './OpAmpSymbol';
import OrGateSymbol from './OrGateSymbol';
import PMosfetSymbol from './PMosfetSymbol';
import PnpBjtSymbol from './PnpBjtSymbol';
import PolarisedCapacitorSymbol from './PolarisedCapacitorSymbol';
import PortSymbol from './PortSymbol';
import PotentiometerSymbol from './PotentiometerSymbol';
import ResistorSymbol from './ResistorSymbol';
import SchottkyDiodeSymbol from './SchottkyDiodeSymbol';
import SourceSymbol from './SourceSymbol';
import SparkGapSymbol from './SparkGapSymbol';
import SwitchSymbol from './SwitchSymbol';
import TextSymbol from './TextSymbol';
import TransformerSymbol from './TransformerSymbol';
import VariableCapacitorSymbol from './VariableCapacitorSymbol';
import VariableInductorSymbol from './VariableInductorSymbol';
import VRailSymbol from './VRailSymbol';
import VssSymbol from './VssSymbol';
import VoltageMinusAnnotationSymbol from './VoltageMinusAnnotationSymbol';
import VoltagePlusAnnotationSymbol from './VoltagePlusAnnotationSymbol';
import WireSymbol from './WireSymbol';
import XorGateSymbol from './XorGateSymbol';
import ZenerDiodeSymbol from './ZenerDiodeSymbol';

const TOOL_SYMBOL_COMPONENT_BY_ID: Record<ToolId, React.ComponentType<any>> = {
  'resistor': ResistorSymbol,
  'potentiometer': PotentiometerSymbol,
  'capacitor': CapacitorSymbol,
  'polarised-capacitor': PolarisedCapacitorSymbol,
  'variable-capacitor': VariableCapacitorSymbol,
  'inductor': InductorSymbol,
  'variable-inductor': VariableInductorSymbol,
  'transformer': TransformerSymbol,
  'diode': DiodeSymbol,
  'zener-diode': ZenerDiodeSymbol,
  'schottky-diode': SchottkyDiodeSymbol,
  'switch': SwitchSymbol,
  'n-mosfet': NMosfetSymbol,
  'p-mosfet': PMosfetSymbol,
  'npn-bjt': NpnBjtSymbol,
  'pnp-bjt': PnpBjtSymbol,
  'spark-gap': SparkGapSymbol,
  'ic': IcSymbol,
  'not-gate': NotGateSymbol,
  'and-gate': AndGateSymbol,
  'or-gate': OrGateSymbol,
  'nand-gate': NandGateSymbol,
  'nor-gate': NorGateSymbol,
  'xor-gate': XorGateSymbol,
  'opamp': OpAmpSymbol,
  'ground': GroundSymbol,
  'v-rail': VRailSymbol,
  'vss': VssSymbol,
  'chassis-ground': ChassisGroundSymbol,
  'source': SourceSymbol,
  'current-source': CurrentSourceSymbol,
  'ac-source': AcSourceSymbol,
  'controlled-voltage-source': ControlledVoltageSourceSymbol,
  'controlled-current-source': ControlledCurrentSourceSymbol,
  'joint': JointSymbol,
  'bridge': BridgeSymbol,
  'half-circle': HalfCircleSymbol,
  'port': PortSymbol,
  'wire': WireSymbol,
  'text': TextSymbol,
  'voltage-plus-annotation': VoltagePlusAnnotationSymbol,
  'voltage-minus-annotation': VoltageMinusAnnotationSymbol,
  'current-annotation': CurrentAnnotationSymbol,
};

export function getComponentSymbolComponent(toolId: ComponentToolId) {
  return TOOL_SYMBOL_COMPONENT_BY_ID[toolId];
}

export function getDrawingSymbolComponent(toolId: DrawingToolId) {
  return TOOL_SYMBOL_COMPONENT_BY_ID[toolId];
}

export function getToolSymbolComponent(toolId: ToolId) {
  return TOOL_SYMBOL_COMPONENT_BY_ID[toolId];
}

const TOOL_ICON_SCALE_BY_ID: Partial<Record<ToolId, number>> = {
  joint: 1.6,
  bridge: 0.9,
  'half-circle': 1.1,
  port: 1.6,
  wire: 1,
  text: 0.42,
};

export function getToolSymbolIconScale(toolId: ToolId) {
  return TOOL_ICON_SCALE_BY_ID[toolId] ?? 0.42;
}

export function getToolSymbolPreviewProps(toolId: ToolId) {
  if (toolId === 'bridge') {
    return {
      x: -5,
    };
  }
  if (toolId === 'half-circle') {
    return {
      x: -2.5,
    };
  }
  if (toolId === 'text') {
    return {
      text: 'Text',
      border: true,
      fontSize: 12,
    };
  }
  return {};
}
