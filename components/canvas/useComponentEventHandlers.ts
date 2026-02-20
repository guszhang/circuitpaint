import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Point } from '../../lib/geometry';
import type { ToolId } from '../../lib/tools';
import { useEntityDragHandlers } from './useEntityDragHandlers';
import type { ComponentEntity, DrawingEntity, SceneData, WireEntity } from './types';

interface UseComponentEventHandlersParams {
  selectedTool?: ToolId | '';
  isPasteMode: boolean;
  selectedComponentSet: Set<string>;
  selectedComponentIds: string[];
  selectedDrawingIds: string[];
  selectedWireIds: string[];
  setSelectedComponentIds: Dispatch<SetStateAction<string[]>>;
  setSelectedDrawingIds: Dispatch<SetStateAction<string[]>>;
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

export function useComponentEventHandlers(params: UseComponentEventHandlersParams) {
  const {
    selectedTool,
    isPasteMode,
    selectedComponentSet,
    selectedComponentIds,
    selectedDrawingIds,
    selectedWireIds,
    setSelectedComponentIds,
    setSelectedDrawingIds,
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

  const handleComponentMouseDown = useCallback(
    (componentId: string) => {
      return (e: KonvaEventObject<MouseEvent>) => {
        if (selectedTool || isPasteMode) return;
        e.cancelBubble = true;
        if (selectedComponentSet.has(componentId)) {
          return;
        }
        setSelectedComponentIds([componentId]);
        setSelectedDrawingIds([]);
        setSelectedWireIds([]);
      };
    },
    [
      isPasteMode,
      selectedComponentSet,
      selectedTool,
      setSelectedComponentIds,
      setSelectedDrawingIds,
      setSelectedWireIds,
    ]
  );

  const ensureComponentSelection = useCallback(
    (componentId: string) => {
      let nextComponentIds = selectedComponentIds;
      let nextDrawingIds = selectedDrawingIds;
      let nextWireIds = selectedWireIds;

      if (!selectedComponentSet.has(componentId)) {
        nextComponentIds = [componentId];
        nextDrawingIds = [];
        nextWireIds = [];
        setSelectedComponentIds(nextComponentIds);
        setSelectedDrawingIds([]);
        setSelectedWireIds([]);
      }

      return { nextComponentIds, nextDrawingIds, nextWireIds };
    },
    [
      selectedComponentIds,
      selectedComponentSet,
      selectedDrawingIds,
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
    ensureSelection: ensureComponentSelection,
    entityKind: 'component',
  });

  return {
    handleComponentMouseDown,
    handleComponentDragStart: handleDragStart,
    handleComponentDragMove: handleDragMove,
    handleComponentDragEnd: handleDragEnd,
  };
}
