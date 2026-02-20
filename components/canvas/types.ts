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
}

export interface DrawingEntity {
  id: string;
  toolId: NonWireDrawingToolId;
  x: number;
  y: number;
  rotation: Rotation;
}

export interface WireEntity {
  id: string;
  x: number;
  y: number;
  vertices: Point[];
}

export interface SceneData {
  components: ComponentEntity[];
  drawings: DrawingEntity[];
  wires: WireEntity[];
}

export interface ClipboardData {
  components: Omit<ComponentEntity, 'id'>[];
  drawings: Omit<DrawingEntity, 'id'>[];
  wires: Array<{ points: Point[] }>;
}
