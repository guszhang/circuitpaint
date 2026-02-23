const TOOL_GROUP_CONFIG = {
  component: [
    { id: 'resistor', label: 'Resistor' },
    { id: 'potentiometer', label: 'Potentiometer' },
    { id: 'capacitor', label: 'Capacitor' },
    { id: 'polarised-capacitor', label: 'Polarised Capacitor' },
    { id: 'variable-capacitor', label: 'Variable Capacitor' },
    { id: 'inductor', label: 'Inductor' },
    { id: 'variable-inductor', label: 'Variable Inductor' },
    { id: 'transformer', label: 'Transformer' },
    { id: 'diode', label: 'Diode' },
    { id: 'zener-diode', label: 'Zener Diode' },
    { id: 'schottky-diode', label: 'Schottky Diode' },
    { id: 'switch', label: 'Switch' },
    { id: 'n-mosfet', label: 'N-MOSFET' },
    { id: 'p-mosfet', label: 'P-MOSFET' },
    { id: 'npn-bjt', label: 'NPN-BJT' },
    { id: 'pnp-bjt', label: 'PNP-BJT' },
    { id: 'spark-gap', label: 'Spark Gap' },
    { id: 'ic', label: 'Buffer' },
    { id: 'not-gate', label: 'NOT Gate' },
    { id: 'and-gate', label: 'AND Gate' },
    { id: 'or-gate', label: 'OR Gate' },
    { id: 'nand-gate', label: 'NAND Gate' },
    { id: 'nor-gate', label: 'NOR Gate' },
    { id: 'xor-gate', label: 'XOR Gate' },
    { id: 'opamp', label: 'Op Amp' },
    { id: 'ground', label: 'Ground' },
    { id: 'source', label: 'Voltage Source' },
    { id: 'current-source', label: 'Current Source' },
    { id: 'ac-source', label: 'AC Source' },
    { id: 'controlled-voltage-source', label: 'Controlled Voltage Source' },
    { id: 'controlled-current-source', label: 'Controlled Current Source' },
  ],
  drawing: [
    { id: 'joint', label: 'Joint' },
    { id: 'wire', label: 'Wire' },
    { id: 'text', label: 'Text' },
    { id: 'voltage-plus-annotation', label: 'Voltage +' },
    { id: 'voltage-minus-annotation', label: 'Voltage -' },
    { id: 'current-annotation', label: 'Current' },
  ],
} as const;

export type ToolGroup = keyof typeof TOOL_GROUP_CONFIG;

type ToolGroupEntry<G extends ToolGroup> = (typeof TOOL_GROUP_CONFIG)[G][number];

export type ComponentToolId = ToolGroupEntry<'component'>['id'];
export type DrawingToolId = ToolGroupEntry<'drawing'>['id'];
export type ToolId = ComponentToolId | DrawingToolId;

export interface ToolDefinition {
  id: ToolId;
  label: string;
  group: ToolGroup;
}

const TOOLS_BY_GROUP = Object.fromEntries(
  (Object.entries(TOOL_GROUP_CONFIG) as Array<[ToolGroup, readonly ToolGroupEntry<ToolGroup>[]]>).map(
    ([group, tools]) => [
      group,
      tools.map((tool) => ({
        ...tool,
        group,
      })),
    ]
  )
) as Record<ToolGroup, ToolDefinition[]>;

const TOOL_DEFINITIONS: ToolDefinition[] = Object.values(TOOLS_BY_GROUP).flat();

const COMPONENT_TOOL_IDS = TOOL_GROUP_CONFIG.component.map((tool) => tool.id) as ComponentToolId[];
const DRAWING_TOOL_IDS = TOOL_GROUP_CONFIG.drawing.map((tool) => tool.id) as DrawingToolId[];

const COMPONENT_TOOL_SET = new Set<ComponentToolId>(COMPONENT_TOOL_IDS);
const DRAWING_TOOL_SET = new Set<DrawingToolId>(DRAWING_TOOL_IDS);

export function isComponentTool(tool: string): tool is ComponentToolId {
  return COMPONENT_TOOL_SET.has(tool as ComponentToolId);
}

export function isDrawingTool(tool: string): tool is DrawingToolId {
  return DRAWING_TOOL_SET.has(tool as DrawingToolId);
}

export function getToolsByGroup(group: ToolGroup): ToolDefinition[] {
  return TOOLS_BY_GROUP[group];
}
