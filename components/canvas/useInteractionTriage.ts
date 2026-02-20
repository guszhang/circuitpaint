import { useCallback, useRef } from 'react';
import type { Point } from '../../lib/geometry';

export type EntityKind = 'component' | 'drawing' | 'wire';

type Modifiers = {
  toggle: boolean;
  additive: boolean;
};

type PointerDown = {
  kind: 'entity' | 'canvas';
  entityKind?: EntityKind;
  entityId?: string;
  startScreen: Point;
  startWorld: Point;
  modifiers: Modifiers;
};

type DragPhase = 'idle' | 'pending-entity' | 'pending-canvas' | 'drag-entity' | 'marquee';

interface InteractionTriageParams {
  dragThreshold: number;
  onEntityMouseDown: (kind: EntityKind, id: string, modifiers: Modifiers) => void;
  onEntityDragStart: (info: { kind: EntityKind; id: string; startWorld: Point; modifiers: Modifiers }) => void;
  onEntityDragMove: (info: { world: Point; startWorld: Point; modifiers: Modifiers }) => void;
  onEntityDragEnd: () => void;
  onCanvasClick: (modifiers: Modifiers) => void;
  onMarqueeStart: (start: Point) => void;
  onMarqueeMove: (rect: { x: number; y: number; width: number; height: number }) => void;
  onMarqueeEnd: (rect: { x: number; y: number; width: number; height: number }, modifiers: Modifiers) => void;
}

export function useInteractionTriage(params: InteractionTriageParams) {
  const {
    dragThreshold,
    onEntityMouseDown,
    onEntityDragStart,
    onEntityDragMove,
    onEntityDragEnd,
    onCanvasClick,
    onMarqueeStart,
    onMarqueeMove,
    onMarqueeEnd,
  } = params;

  const pointerDownRef = useRef<PointerDown | null>(null);
  const phaseRef = useRef<DragPhase>('idle');

  const handleEntityMouseDown = useCallback(
    (kind: EntityKind, id: string, screen: Point, world: Point, modifiers: Modifiers) => {
      pointerDownRef.current = {
        kind: 'entity',
        entityKind: kind,
        entityId: id,
        startScreen: screen,
        startWorld: world,
        modifiers,
      };
      phaseRef.current = 'pending-entity';
      onEntityMouseDown(kind, id, modifiers);
    },
    [onEntityMouseDown]
  );

  const handleCanvasMouseDown = useCallback((screen: Point, world: Point, modifiers: Modifiers) => {
    pointerDownRef.current = {
      kind: 'canvas',
      startScreen: screen,
      startWorld: world,
      modifiers,
    };
    phaseRef.current = 'pending-canvas';
  }, []);

  const handlePointerMove = useCallback(
    (screen: Point, world: Point) => {
      const down = pointerDownRef.current;
      if (!down) return;

      const dist = Math.hypot(screen.x - down.startScreen.x, screen.y - down.startScreen.y);

      if (phaseRef.current === 'pending-entity' && dist > dragThreshold) {
        phaseRef.current = 'drag-entity';
        if (down.entityKind && down.entityId) {
          onEntityDragStart({
            kind: down.entityKind,
            id: down.entityId,
            startWorld: down.startWorld,
            modifiers: down.modifiers,
          });
        }
      }

      if (phaseRef.current === 'pending-canvas' && dist > dragThreshold) {
        phaseRef.current = 'marquee';
        onMarqueeStart(down.startScreen);
      }

      if (phaseRef.current === 'drag-entity') {
        onEntityDragMove({ world, startWorld: down.startWorld, modifiers: down.modifiers });
      } else if (phaseRef.current === 'marquee') {
        const rect = {
          x: Math.min(down.startScreen.x, screen.x),
          y: Math.min(down.startScreen.y, screen.y),
          width: Math.abs(screen.x - down.startScreen.x),
          height: Math.abs(screen.y - down.startScreen.y),
        };
        onMarqueeMove(rect);
      }
    },
    [dragThreshold, onEntityDragMove, onEntityDragStart, onMarqueeMove, onMarqueeStart]
  );

  const handlePointerUp = useCallback(
    (screen: Point) => {
      const down = pointerDownRef.current;
      if (!down) return;

      if (phaseRef.current === 'drag-entity') {
        onEntityDragEnd();
      } else if (phaseRef.current === 'marquee') {
        const rect = {
          x: Math.min(down.startScreen.x, screen.x),
          y: Math.min(down.startScreen.y, screen.y),
          width: Math.abs(screen.x - down.startScreen.x),
          height: Math.abs(screen.y - down.startScreen.y),
        };
        onMarqueeEnd(rect, down.modifiers);
      } else if (phaseRef.current === 'pending-canvas') {
        onCanvasClick(down.modifiers);
      }

      pointerDownRef.current = null;
      phaseRef.current = 'idle';
    },
    [onCanvasClick, onEntityDragEnd, onMarqueeEnd]
  );

  const reset = useCallback(() => {
    pointerDownRef.current = null;
    phaseRef.current = 'idle';
  }, []);

  return {
    handleEntityMouseDown,
    handleCanvasMouseDown,
    handlePointerMove,
    handlePointerUp,
    reset,
  };
}
