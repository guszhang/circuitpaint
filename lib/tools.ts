const TOOL_DEFINITIONS = [
  { id: 'resistor', label: 'Resistor', group: 'component' },
  { id: 'potentiometer', label: 'Potentiometer', group: 'component' },
  { id: 'capacitor', label: 'Capacitor', group: 'component' },
  { id: 'polarised-capacitor', label: 'Polarised Capacitor', group: 'component' },
  { id: 'variable-capacitor', label: 'Variable Capacitor', group: 'component' },
  { id: 'inductor', label: 'Inductor', group: 'component' },
  { id: 'variable-inductor', label: 'Variable Inductor', group: 'component' },
  { id: 'transformer', label: 'Transformer', group: 'component' },
  { id: 'diode', label: 'Diode', group: 'component' },
  { id: 'zener-diode', label: 'Zener Diode', group: 'component' },
  { id: 'schottky-diode', label: 'Schottky Diode', group: 'component' },
  { id: 'switch', label: 'Switch', group: 'component' },
  { id: 'n-mosfet', label: 'N-MOSFET', group: 'component' },
  { id: 'p-mosfet', label: 'P-MOSFET', group: 'component' },
  { id: 'npn-bjt', label: 'NPN-BJT', group: 'component' },
  { id: 'pnp-bjt', label: 'PNP-BJT', group: 'component' },
  { id: 'spark-gap', label: 'Spark Gap', group: 'component' },
  { id: 'ic', label: 'Buffer', group: 'component' },
  { id: 'not-gate', label: 'NOT Gate', group: 'component' },
  { id: 'and-gate', label: 'AND Gate', group: 'component' },
  { id: 'or-gate', label: 'OR Gate', group: 'component' },
  { id: 'nand-gate', label: 'NAND Gate', group: 'component' },
  { id: 'nor-gate', label: 'NOR Gate', group: 'component' },
  { id: 'xor-gate', label: 'XOR Gate', group: 'component' },
  { id: 'opamp', label: 'Op Amp', group: 'component' },
  { id: 'ground', label: 'Ground', group: 'component' },
  { id: 'v-rail', label: 'V Rail', group: 'component' },
  { id: 'vss', label: 'VSS', group: 'component' },
  { id: 'chassis-ground', label: 'Chassis Ground', group: 'component' },
  { id: 'source', label: 'Voltage Source', group: 'component' },
  { id: 'current-source', label: 'Current Source', group: 'component' },
  { id: 'ac-source', label: 'AC Source', group: 'component' },
  { id: 'controlled-voltage-source', label: 'Controlled Voltage Source', group: 'component' },
  { id: 'controlled-current-source', label: 'Controlled Current Source', group: 'component' },
  { id: 'joint', label: 'Joint', group: 'drawing' },
  { id: 'bridge', label: 'Bridge', group: 'drawing' },
  { id: 'half-circle', label: 'Half-circle', group: 'drawing' },
  { id: 'port', label: 'Port', group: 'drawing' },
  { id: 'wire', label: 'Wire', group: 'drawing' },
  { id: 'text', label: 'Text', group: 'drawing' },
  { id: 'voltage-plus-annotation', label: 'Voltage +', group: 'drawing' },
  { id: 'voltage-minus-annotation', label: 'Voltage -', group: 'drawing' },
  { id: 'current-annotation', label: 'Current', group: 'drawing' },
] as const;

export type ToolGroup = (typeof TOOL_DEFINITIONS)[number]['group'];
export type ToolId = (typeof TOOL_DEFINITIONS)[number]['id'];
export type ComponentToolId = Extract<(typeof TOOL_DEFINITIONS)[number], { group: 'component' }>['id'];
export type DrawingToolId = Extract<(typeof TOOL_DEFINITIONS)[number], { group: 'drawing' }>['id'];

export interface ToolDefinition {
  id: ToolId;
  label: string;
  group: ToolGroup;
}

export interface ToolFamilyDefinition<T extends ToolId = ToolId> {
  key: string;
  group: ToolGroup;
  defaultToolId: T;
  toolIds: readonly T[];
}

export const COMPONENT_TOOL_FAMILIES = [
  { key: 'resistor-family', group: 'component', defaultToolId: 'resistor', toolIds: ['resistor', 'potentiometer'] },
  {
    key: 'capacitor-family',
    group: 'component',
    defaultToolId: 'capacitor',
    toolIds: ['capacitor', 'polarised-capacitor', 'variable-capacitor'],
  },
  {
    key: 'inductor-family',
    group: 'component',
    defaultToolId: 'inductor',
    toolIds: ['inductor', 'variable-inductor', 'transformer'],
  },
  {
    key: 'diode-family',
    group: 'component',
    defaultToolId: 'diode',
    toolIds: ['diode', 'zener-diode', 'schottky-diode'],
  },
  {
    key: 'switch-family',
    group: 'component',
    defaultToolId: 'switch',
    toolIds: ['switch', 'n-mosfet', 'p-mosfet', 'npn-bjt', 'pnp-bjt', 'spark-gap'],
  },
  {
    key: 'logic-family',
    group: 'component',
    defaultToolId: 'ic',
    toolIds: ['ic', 'not-gate', 'and-gate', 'or-gate', 'nand-gate', 'nor-gate', 'xor-gate', 'opamp'],
  },
  {
    key: 'source-family',
    group: 'component',
    defaultToolId: 'source',
    toolIds: ['source', 'current-source', 'ac-source', 'controlled-voltage-source', 'controlled-current-source'],
  },
  {
    key: 'ground-family',
    group: 'component',
    defaultToolId: 'ground',
    toolIds: ['ground', 'v-rail', 'vss', 'chassis-ground'],
  },
] as const satisfies readonly ToolFamilyDefinition<ComponentToolId>[];

export const DRAWING_TOOL_FAMILIES = [
  {
    key: 'joint-family',
    group: 'drawing',
    defaultToolId: 'joint',
    toolIds: ['joint', 'port', 'bridge', 'half-circle'],
  },
  { key: 'wire-family', group: 'drawing', defaultToolId: 'wire', toolIds: ['wire'] },
  { key: 'text-family', group: 'drawing', defaultToolId: 'text', toolIds: ['text'] },
  {
    key: 'voltage-family',
    group: 'drawing',
    defaultToolId: 'voltage-plus-annotation',
    toolIds: ['voltage-plus-annotation', 'voltage-minus-annotation'],
  },
  {
    key: 'current-family',
    group: 'drawing',
    defaultToolId: 'current-annotation',
    toolIds: ['current-annotation'],
  },
] as const satisfies readonly ToolFamilyDefinition<DrawingToolId>[];

const TOOL_DEFINITION_BY_ID = new Map<ToolId, ToolDefinition>(
  TOOL_DEFINITIONS.map((tool) => [tool.id, tool])
);

const TOOLS_BY_GROUP = {
  component: TOOL_DEFINITIONS.filter((tool) => tool.group === 'component'),
  drawing: TOOL_DEFINITIONS.filter((tool) => tool.group === 'drawing'),
} as const satisfies Record<ToolGroup, readonly ToolDefinition[]>;

const COMPONENT_TOOL_SET = new Set<ComponentToolId>(
  TOOLS_BY_GROUP.component.map((tool) => tool.id as ComponentToolId)
);
const DRAWING_TOOL_SET = new Set<DrawingToolId>(
  TOOLS_BY_GROUP.drawing.map((tool) => tool.id as DrawingToolId)
);

const TOOL_FAMILY_BY_TOOL_ID = new Map<ToolId, readonly ToolId[]>();

for (const family of [...COMPONENT_TOOL_FAMILIES, ...DRAWING_TOOL_FAMILIES]) {
  for (const toolId of family.toolIds) {
    TOOL_FAMILY_BY_TOOL_ID.set(toolId, family.toolIds);
  }
}

export function isComponentTool(tool: string): tool is ComponentToolId {
  return COMPONENT_TOOL_SET.has(tool as ComponentToolId);
}

export function isDrawingTool(tool: string): tool is DrawingToolId {
  return DRAWING_TOOL_SET.has(tool as DrawingToolId);
}

export function getToolDefinition(toolId: ToolId): ToolDefinition {
  const tool = TOOL_DEFINITION_BY_ID.get(toolId);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }
  return tool;
}

export function getToolsByGroup(group: ToolGroup): ToolDefinition[] {
  return [...TOOLS_BY_GROUP[group]];
}

export function getToolFamily(toolId: ToolId): readonly ToolId[] {
  return TOOL_FAMILY_BY_TOOL_ID.get(toolId) ?? [toolId];
}
