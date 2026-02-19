export const COMPONENT_TOOL_IDS = [
  'resistor',
  'capacitor',
  'inductor',
  'diode',
  'transistor',
  'ic',
  'ground',
  'power',
] as const;

export const DRAWING_TOOL_IDS = [
  'joint',
  'wire',
  'bus',
  'label',
  'text',
  'note',
] as const;

export type ComponentToolId = (typeof COMPONENT_TOOL_IDS)[number];
export type DrawingToolId = (typeof DRAWING_TOOL_IDS)[number];
export type ToolId = ComponentToolId | DrawingToolId;
export type ToolGroup = 'component' | 'drawing';

export interface ToolDefinition {
  id: ToolId;
  label: string;
  group: ToolGroup;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { id: 'resistor', label: 'Resistor', group: 'component' },
  { id: 'capacitor', label: 'Capacitor', group: 'component' },
  { id: 'inductor', label: 'Inductor', group: 'component' },
  { id: 'diode', label: 'Diode', group: 'component' },
  { id: 'transistor', label: 'Transistor', group: 'component' },
  { id: 'ic', label: 'IC', group: 'component' },
  { id: 'ground', label: 'Ground', group: 'component' },
  { id: 'power', label: 'Power', group: 'component' },
  { id: 'joint', label: 'Joint', group: 'drawing' },
  { id: 'wire', label: 'Wire', group: 'drawing' },
  { id: 'bus', label: 'Bus', group: 'drawing' },
  { id: 'label', label: 'Label', group: 'drawing' },
  { id: 'text', label: 'Text', group: 'drawing' },
  { id: 'note', label: 'Note', group: 'drawing' },
];

const COMPONENT_TOOL_SET = new Set<ComponentToolId>(COMPONENT_TOOL_IDS);
const DRAWING_TOOL_SET = new Set<DrawingToolId>(DRAWING_TOOL_IDS);

export function isComponentTool(tool: string): tool is ComponentToolId {
  return COMPONENT_TOOL_SET.has(tool as ComponentToolId);
}

export function isDrawingTool(tool: string): tool is DrawingToolId {
  return DRAWING_TOOL_SET.has(tool as DrawingToolId);
}

export function getToolsByGroup(group: ToolGroup): ToolDefinition[] {
  return TOOL_DEFINITIONS.filter((tool) => tool.group === group);
}
