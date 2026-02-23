export const GRID_SPACING = 10;
export const DOT_RADIUS = 1.5;

export const snapToGrid = (value: number) => Math.round(value / GRID_SPACING) * GRID_SPACING;
