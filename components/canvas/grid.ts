export const GRID_SPACING = 10;
export const DOT_RADIUS = 1.5;
export const HALF_GRID_SPACING = GRID_SPACING / 2;
export const HALF_GRID_DOT_RADIUS = DOT_RADIUS / 2;

export const snapToGrid = (value: number, spacing = GRID_SPACING) =>
  Math.round(value / spacing) * spacing;
