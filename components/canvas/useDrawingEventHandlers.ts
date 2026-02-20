import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Point } from '../../lib/geometry';
import type { ToolId } from '../../lib/tools';
import { useEntityDragHandlers } from './useEntityDragHandlers';
import type { ComponentEntity, DrawingEntity, SceneData, WireEntity } from './types';

interface UseDrawingEventHandlersParams {
  selectedTool?: ToolId | '';
  isPasteMode: boolean;
  selectedDrawingIds: string[];
  selectedComponentIds: string[];
  selectedWireIds: string[];
  selectedDrawingSet: Set<string>;
  setSelectedDrawingIds: Dispatch<SetStateAction<string[]>>;
  setSelectedComponentIds: Dispatch<SetStateAction<string[]>>;
  setSelectedWireIds: Dispatch<SetStateAction<string[]>>;
  captureDragHistory: () => void;
  components: ComponentEntity[];
  drawings: DrawingEntity[];
  wires: WireEntity[];
  makeDragKey: (kind: 'component' | 'drawing' | 'wire', id: string) => string;
  dragStartPositionsRef: MutableRefObject<Map<string, Point> | null>;
  wireDragStartPointsRef: MutableRefObject<Map<string, Point> | null>;
  dragAnchorIdRef: MutableRefObject<string | null>;
  dragHistoryCapturedRef: MutableRefObject<boolean>;
  updateScene: (updater: (prev: SceneData) => SceneData, recordHistory?: boolean) => void;
}

export function useDrawingEventHandlers(params: UseDrawingEventHandlersParams) {
  const {
    selectedTool,
    isPasteMode,
    selectedDrawingIds,
    selectedComponentIds,
    selectedWireIds,
    selectedDrawingSet,
    setSelectedDrawingIds,
    setSelectedComponentIds,
    setSelectedWireIds,
    captureDragHistory,
    components,
    drawings,
    wires,
    makeDragKey,
    dragStartPositionsRef,
    wireDragStartPointsRef,
    dragAnchorIdRef,
    dragHistoryCapturedRef,
    updateScene,
  } = params;

  const handleDrawingMouseDown = useCallback(
    (drawingId: string) => {
      return (e: KonvaEventObject<MouseEvent>) => {
        if (selectedTool || isPasteMode) return;
        e.cancelBubble = true;
        setSelectedDrawingIds([drawingId]);
        setSelectedComponentIds([]);
        setSelectedWireIds([]);
      };
    },
    [
      isPasteMode,
      selectedTool,
      setSelectedComponentIds,
      setSelectedDrawingIds,
      setSelectedWireIds,
    ]
  );

  const ensureDrawingSelection = useCallback(
    (drawingId: string) => {
      let nextDrawingIds = selectedDrawingIds;
      let nextComponentIds = selectedComponentIds;
      let nextWireIds = selectedWireIds;

      if (!selectedDrawingSet.has(drawingId)) {
        nextDrawingIds = [drawingId];
        nextComponentIds = [];
        nextWireIds = [];
        setSelectedDrawingIds(nextDrawingIds);
        setSelectedComponentIds([]);
        setSelectedWireIds([]);
      }

      return { nextComponentIds, nextDrawingIds, nextWireIds };
    },
    [
      selectedComponentIds,
      selectedDrawingIds,
      selectedDrawingSet,
      selectedWireIds,
      setSelectedComponentIds,
      setSelectedDrawingIds,
      setSelectedWireIds,
    ]
  );

  const { handleDragStart, handleDragMove, handleDragEnd } = useEntityDragHandlers({
    selectedTool,
    isPasteMode,
    captureDragHistory,
    components,
    drawings,
    wires,
    makeDragKey,
    dragStartPositionsRef,
    wireDragStartPointsRef,
    dragAnchorIdRef,
    dragHistoryCapturedRef,
    updateScene,
    ensureSelection: ensureDrawingSelection,
    entityKind: 'drawing',
  });

  return {
    handleDrawingMouseDown,
    handleDrawingDragStart: handleDragStart,
    handleDrawingDragMove: handleDragMove,
    handleDrawingDragEnd: handleDragEnd,
  };
}
