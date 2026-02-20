const TOOL_GROUP_CONFIG = {
  component: [
    { id: 'resistor', label: 'Resistor' },
    { id: 'capacitor', label: 'Capacitor' },
    { id: 'inductor', label: 'Inductor' },
    { id: 'diode', label: 'Diode' },
    { id: 'transistor', label: 'Transistor' },
    { id: 'ic', label: 'IC' },
    { id: 'ground', label: 'Ground' },
    { id: 'power', label: 'Power' },
  ],
  drawing: [
    { id: 'joint', label: 'Joint' },
    { id: 'wire', label: 'Wire' },
    { id: 'bus', label: 'Bus' },
    { id: 'label', label: 'Label' },
    { id: 'text', label: 'Text' },
    { id: 'note', label: 'Note' },
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

export const TOOL_DEFINITIONS: ToolDefinition[] = Object.values(TOOLS_BY_GROUP).flat();

export const COMPONENT_TOOL_IDS = TOOL_GROUP_CONFIG.component.map((tool) => tool.id) as ComponentToolId[];
export const DRAWING_TOOL_IDS = TOOL_GROUP_CONFIG.drawing.map((tool) => tool.id) as DrawingToolId[];

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
