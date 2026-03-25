import type { Point } from '../../lib/geometry';
import type { ComponentToolId, DrawingToolId } from '../../lib/tools';

export type Rotation = 0 | 90 | 180 | 270;

export type NonWireDrawingToolId = Exclude<DrawingToolId, 'wire'>;

export interface ComponentEntity {
  id: string;
  toolId: ComponentToolId;
  x: number;
  y: number;
  rotation: Rotation;
  flipped?: boolean;
  strokeColor?: string;
}

export interface DrawingEntity {
  id: string;
  toolId: NonWireDrawingToolId;
  x: number;
  y: number;
  rotation: Rotation;
  text?: string;
  strokeColor?: string;
  strokeWidth?: number;
  border?: boolean;
  fontSize?: number;
}

export interface WireEntity {
  id: string;
  x: number;
  y: number;
  vertices: Point[];
  strokeColor?: string;
  strokeWidth?: number;
  dash?: number[];
}

export interface SceneData {
  components: ComponentEntity[];
  drawings: DrawingEntity[];
  wires: WireEntity[];
}

export interface CanvasFile {
  version: 1;
  components: ComponentEntity[];
  drawings: DrawingEntity[];
  wires: WireEntity[];
}

export interface ClipboardData {
  components: Omit<ComponentEntity, 'id'>[];
  drawings: Omit<DrawingEntity, 'id'>[];
  wires: Array<{ points: Point[]; strokeColor?: string; strokeWidth?: number; dash?: number[] }>;
}
