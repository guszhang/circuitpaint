import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Point } from '../../lib/geometry';
import type { ToolId } from '../../lib/tools';
import type { ComponentEntity, DrawingEntity, SceneData, WireEntity } from './types';

interface UseEntityDragHandlersParams {
  selectedTool?: ToolId | '';
  isPasteMode: boolean;
  captureDragHistory: () => void;
  components: ComponentEntity[];
  drawings: DrawingEntity[];
  wires: WireEntity[];
  getSelection: () => {
    componentIds: string[];
    drawingIds: string[];
    wireIds: string[];
  };
  makeDragKey: (kind: 'component' | 'drawing' | 'wire', id: string) => string;
  dragStartPositionsRef: MutableRefObject<Map<string, Point> | null>;
  wireDragStartPointsRef: MutableRefObject<Map<string, Point> | null>;
  dragAnchorIdRef: MutableRefObject<string | null>;
  dragHistoryCapturedRef: MutableRefObject<boolean>;
  updateScene: (updater: (prev: SceneData) => SceneData, recordHistory?: boolean) => void;
  entityKind: 'component' | 'drawing' | 'wire';
}

export function useEntityDragHandlers({
  selectedTool,
  isPasteMode,
  captureDragHistory,
  components,
  drawings,
  wires,
  getSelection,
  makeDragKey,
  dragStartPositionsRef,
  wireDragStartPointsRef,
  dragAnchorIdRef,
  dragHistoryCapturedRef,
  updateScene,
  entityKind,
}: UseEntityDragHandlersParams) {
  const handleDragStart = useCallback(
    (id: string) => {
      return (e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        if (selectedTool || isPasteMode) return;

        captureDragHistory();

        const selection = getSelection();
        let nextComponentIds = selection.componentIds;
        let nextDrawingIds = selection.drawingIds;
        let nextWireIds = selection.wireIds;

        if (entityKind === 'component' && !nextComponentIds.includes(id)) {
          nextComponentIds = [...nextComponentIds, id];
        } else if (entityKind === 'drawing' && !nextDrawingIds.includes(id)) {
          nextDrawingIds = [...nextDrawingIds, id];
        } else if (entityKind === 'wire' && !nextWireIds.includes(id)) {
          nextWireIds = [...nextWireIds, id];
        }

        const snapshot = new Map<string, Point>();
        components.forEach((component) => {
          if (nextComponentIds.includes(component.id)) {
            snapshot.set(makeDragKey('component', component.id), { x: component.x, y: component.y });
          }
        });
        drawings.forEach((drawing) => {
          if (nextDrawingIds.includes(drawing.id)) {
            snapshot.set(makeDragKey('drawing', drawing.id), { x: drawing.x, y: drawing.y });
          }
        });
        const wireSnapshot = new Map<string, Point>();
        wires.forEach((wire) => {
          if (nextWireIds.includes(wire.id)) {
            snapshot.set(makeDragKey('wire', wire.id), { x: wire.x, y: wire.y });
            wireSnapshot.set(wire.id, { x: wire.x, y: wire.y });
          }
        });

        dragStartPositionsRef.current = snapshot;
        wireDragStartPointsRef.current = wireSnapshot;
        dragAnchorIdRef.current = makeDragKey(entityKind, id);
      };
    },
    [
      captureDragHistory,
      components,
      drawings,
      entityKind,
      isPasteMode,
      makeDragKey,
      selectedTool,
      wires,
      dragStartPositionsRef,
      wireDragStartPointsRef,
      dragAnchorIdRef,
    ]
  );

  const handleDragMove = useCallback(
    (id: string) => {
      return (e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const snapshot = dragStartPositionsRef.current;
        if (!snapshot) return;

        const anchorKey = dragAnchorIdRef.current ?? makeDragKey(entityKind, id);
        const anchorStart = snapshot.get(anchorKey);
        if (!anchorStart) return;

        const { x, y } = e.target.position();
        const delta = { x: x - anchorStart.x, y: y - anchorStart.y };

        updateScene((prev) => ({
          ...prev,
          components: prev.components.map((component) => {
            const start = snapshot.get(makeDragKey('component', component.id));
            if (!start) return component;
            return { ...component, x: start.x + delta.x, y: start.y + delta.y };
          }),
          drawings: prev.drawings.map((drawing) => {
            const start = snapshot.get(makeDragKey('drawing', drawing.id));
            if (!start) return drawing;
            return { ...drawing, x: start.x + delta.x, y: start.y + delta.y };
          }),
          wires: (() => {
            const wireSnapshot = wireDragStartPointsRef.current;
            if (!wireSnapshot) {
              return prev.wires;
            }
            return prev.wires.map((wire) => {
              const start = wireSnapshot.get(wire.id);
              if (!start) return wire;
              return {
                ...wire,
                x: start.x + delta.x,
                y: start.y + delta.y,
              };
            });
          })(),
        }), false);
      };
    },
    [
      dragAnchorIdRef,
      dragStartPositionsRef,
      entityKind,
      makeDragKey,
      updateScene,
      wireDragStartPointsRef,
    ]
  );

  const handleDragEnd = useCallback(
    (id: string) => {
      return (e: KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const snapshot = dragStartPositionsRef.current;
        if (!snapshot) return;

        const anchorKey = dragAnchorIdRef.current ?? makeDragKey(entityKind, id);
        const anchorStart = snapshot.get(anchorKey);
        if (!anchorStart) return;

        const { x, y } = e.target.position();
        const delta = { x: x - anchorStart.x, y: y - anchorStart.y };

        updateScene((prev) => ({
          ...prev,
          components: prev.components.map((component) => {
            const start = snapshot.get(makeDragKey('component', component.id));
            if (!start) return component;
            return {
              ...component,
              x: start.x + delta.x,
              y: start.y + delta.y,
            };
          }),
          drawings: prev.drawings.map((drawing) => {
            const start = snapshot.get(makeDragKey('drawing', drawing.id));
            if (!start) return drawing;
            return {
              ...drawing,
              x: start.x + delta.x,
              y: start.y + delta.y,
            };
          }),
          wires: (() => {
            const wireSnapshot = wireDragStartPointsRef.current;
            if (!wireSnapshot) {
              return prev.wires;
            }
            return prev.wires.map((wire) => {
              const start = wireSnapshot.get(wire.id);
              if (!start) return wire;
              return {
                ...wire,
                x: start.x + delta.x,
                y: start.y + delta.y,
              };
            });
          })(),
        }), false);

        dragStartPositionsRef.current = null;
        wireDragStartPointsRef.current = null;
        dragAnchorIdRef.current = null;
        dragHistoryCapturedRef.current = false;
      };
    },
    [
      dragAnchorIdRef,
      dragHistoryCapturedRef,
      dragStartPositionsRef,
      entityKind,
      makeDragKey,
      updateScene,
      wireDragStartPointsRef,
    ]
  );

  return {
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
