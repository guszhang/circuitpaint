// Coordinate transformation utilities

export interface Point {
  x: number;
  y: number;
}

export interface Camera {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(
  screenPoint: Point,
  camera: Camera
): Point {
  return {
    x: (screenPoint.x - camera.offsetX) / camera.zoom,
    y: (screenPoint.y - camera.offsetY) / camera.zoom,
  };
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(
  worldPoint: Point,
  camera: Camera
): Point {
  return {
    x: worldPoint.x * camera.zoom + camera.offsetX,
    y: worldPoint.y * camera.zoom + camera.offsetY,
  };
}

/** Axis-aligned size of a width x height box rotated by `degrees` about its centre. */
export function getRotatedBoxSize(width: number, height: number, degrees: number) {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return { width: width * cos + height * sin, height: width * sin + height * cos };
}
