import type { Point } from './geometry';

export const WIRE_ARROW_TIP_OFFSET = 2;
export const WIRE_ARROW_POINTER_LENGTH = 5;
export const WIRE_ARROW_POINTER_WIDTH = 5;

export function getWireArrowRenderPoints(points: Point[]) {
  if (points.length < 2) {
    return points;
  }

  const end = points[points.length - 1];
  let previousIndex = points.length - 2;
  while (
    previousIndex >= 0 &&
    points[previousIndex].x === end.x &&
    points[previousIndex].y === end.y
  ) {
    previousIndex -= 1;
  }
  if (previousIndex < 0) {
    return points;
  }

  const previous = points[previousIndex];
  const dx = end.x - previous.x;
  const dy = end.y - previous.y;
  const length = Math.hypot(dx, dy);
  const offset = Math.min(WIRE_ARROW_TIP_OFFSET, length / 2);
  const shortenedEnd = {
    x: end.x - (dx / length) * offset,
    y: end.y - (dy / length) * offset,
  };

  return [...points.slice(0, previousIndex + 1), shortenedEnd];
}
