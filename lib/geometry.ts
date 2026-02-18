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
