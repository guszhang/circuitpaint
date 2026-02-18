// Discrete zoom levels for the canvas
export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3, 4];

export function getNextZoomLevel(currentZoom: number, zoomIn: boolean): number {
  if (zoomIn) {
    // Find the next higher zoom level
    for (const level of ZOOM_LEVELS) {
      if (level > currentZoom + 0.001) {
        return level;
      }
    }
    return ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  } else {
    // Find the next lower zoom level
    for (let i = ZOOM_LEVELS.length - 1; i >= 0; i--) {
      if (ZOOM_LEVELS[i] < currentZoom - 0.001) {
        return ZOOM_LEVELS[i];
      }
    }
    return ZOOM_LEVELS[0];
  }
}

export function clampZoom(zoom: number): number {
  const min = ZOOM_LEVELS[0];
  const max = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  return Math.max(min, Math.min(max, zoom));
}
