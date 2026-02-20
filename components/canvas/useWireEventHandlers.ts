import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Point } from '../../lib/geometry';
import type { ToolId } from '../../lib/tools';
import { useEntityDragHandlers } from './useEntityDragHandlers';
import type { ComponentEntity, DrawingEntity, SceneData, WireEntity } from './types';

interface UseWireEventHandlersParams {
  selectedTool?: ToolId | '';
  isPasteMode: boolean;
  selectedWireIds: string[];
  selectedWireSet: Set<string>;
  selectedComponentIds: string[];
  selectedDrawingIds: string[];
  setSelectedWireIds: Dispatch<SetStateAction<string[]>>;
  setSelectedComponentIds: Dispatch<SetStateAction<string[]>>;
  setSelectedDrawingIds: Dispatch<SetStateAction<string[]>>;
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

export function useWireEventHandlers(params: UseWireEventHandlersParams) {
  const {
    selectedTool,
    isPasteMode,
    selectedWireIds,
    selectedWireSet,
    selectedComponentIds,
    selectedDrawingIds,
    setSelectedWireIds,
    setSelectedComponentIds,
    setSelectedDrawingIds,
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

  const handleWireMouseDown = useCallback(
    (wireId: string) => {
      return (e: KonvaEventObject<MouseEvent>) => {
        if (selectedTool || isPasteMode) return;
        e.cancelBubble = true;
        if (selectedWireSet.has(wireId)) {
          return;
        }
        setSelectedWireIds([wireId]);
        setSelectedDrawingIds([]);
        setSelectedComponentIds([]);
      };
    },
    [
      isPasteMode,
      selectedTool,
      selectedWireSet,
      setSelectedComponentIds,
      setSelectedDrawingIds,
      setSelectedWireIds,
    ]
  );

  const ensureWireSelection = useCallback(
    (wireId: string) => {
      let nextWireIds = selectedWireIds;
      let nextComponentIds = selectedComponentIds;
      let nextDrawingIds = selectedDrawingIds;

      if (!selectedWireSet.has(wireId)) {
        nextWireIds = [wireId];
        nextComponentIds = [];
        nextDrawingIds = [];
        setSelectedWireIds(nextWireIds);
        setSelectedComponentIds([]);
        setSelectedDrawingIds([]);
      }

      return { nextComponentIds, nextDrawingIds, nextWireIds };
    },
    [
      selectedComponentIds,
      selectedDrawingIds,
      selectedWireIds,
      selectedWireSet,
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
    ensureSelection: ensureWireSelection,
    entityKind: 'wire',
  });

  return {
    handleWireMouseDown,
    handleWireDragStart: handleDragStart,
    handleWireDragMove: handleDragMove,
    handleWireDragEnd: handleDragEnd,
  };
}
