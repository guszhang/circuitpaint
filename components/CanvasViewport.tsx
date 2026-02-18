'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Shape } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { Camera, Point, screenToWorld, snapToGrid } from '../lib/geometry';
import { getNextZoomLevel } from '../lib/zoom';
import Resistor, { ResistorData } from './Resistor';
import styles from './CanvasViewport.module.css';

interface CanvasViewportProps {
  onContextMenu: (x: number, y: number) => void;
  selectedTool: string;
}

const GRID_SPACING = 20; // Grid spacing in world units
const DOT_RADIUS = 1.5; // Radius of grid dots
const DRAG_THRESHOLD = 5; // Pixels to distinguish click from drag

export default function CanvasViewport({ onContextMenu, selectedTool }: CanvasViewportProps) {
  const [camera, setCamera] = useState<Camera>({
    offsetX: 400,
    offsetY: 300,
    zoom: 1,
  });
  
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [cursor, setCursor] = useState('default');
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [worldPos, setWorldPos] = useState<Point>({ x: 0, y: 0 });
  const [resistors, setResistors] = useState<ResistorData[]>([]);
  const [selectedResistorId, setSelectedResistorId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const panStartRef = useRef<Point | null>(null);
  const rightMouseDownPosRef = useRef<Point | null>(null);
  const cameraStartRef = useRef<Camera | null>(null);

  // Update stage size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle keyboard events for rotation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (selectedResistorId) {
          setResistors(prev => prev.map(resistor => {
            if (resistor.id === selectedResistorId) {
              return {
                ...resistor,
                rotation: (resistor.rotation + 90) % 360
              };
            }
            return resistor;
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedResistorId]);

  // Render grid dots using a single Shape with custom drawing function
  const renderGrid = useCallback(() => {
    // Calculate visible world bounds
    const topLeft = screenToWorld({ x: 0, y: 0 }, camera);
    const bottomRight = screenToWorld(
      { x: stageSize.width, y: stageSize.height },
      camera
    );

    // Expand bounds slightly for smoother panning
    const minX = Math.floor(topLeft.x / GRID_SPACING) - 1;
    const maxX = Math.ceil(bottomRight.x / GRID_SPACING) + 1;
    const minY = Math.floor(topLeft.y / GRID_SPACING) - 1;
    const maxY = Math.ceil(bottomRight.y / GRID_SPACING) + 1;

    // Use a single Shape node with custom sceneFunc for performance
    return (
      <Shape
        sceneFunc={(context, shape) => {
          const dotRadius = DOT_RADIUS / camera.zoom;
          context.fillStyle = '#a0a0a0';
          
          // Draw all dots - each arc needs to be independent
          for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
              const worldX = x * GRID_SPACING;
              const worldY = y * GRID_SPACING;
              
              // Start a new path for each dot to keep them independent
              context.beginPath();
              context.arc(worldX, worldY, dotRadius, 0, Math.PI * 2);
              context.fill();
            }
          }
          
          // Required to complete the shape rendering
          context.fillStrokeShape(shape);
        }}
        listening={false}
      />
    );
  }, [camera, stageSize]);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = e.target.getStage();
      if (!stage) return;

      const oldScale = camera.zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Determine zoom direction
      const zoomIn = e.evt.deltaY < 0;
      const newScale = getNextZoomLevel(oldScale, zoomIn);

      if (newScale === oldScale) return;

      // Calculate new position to zoom around pointer
      const mousePointTo = {
        x: (pointer.x - camera.offsetX) / oldScale,
        y: (pointer.y - camera.offsetY) / oldScale,
      };

      const newOffsetX = pointer.x - mousePointTo.x * newScale;
      const newOffsetY = pointer.y - mousePointTo.y * newScale;

      setCamera({
        offsetX: newOffsetX,
        offsetY: newOffsetY,
        zoom: newScale,
      });
    },
    [camera]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Right mouse button for panning
      if (e.evt.button === 2) {
        e.evt.preventDefault();
        rightMouseDownPosRef.current = pointer;
        panStartRef.current = pointer;
        cameraStartRef.current = { ...camera };
      }
      
      // Left mouse button for placing resistor or deselecting
      if (e.evt.button === 0) {
        // Check if clicking on canvas background (not on a resistor)
        const clickedOnBackground = e.target === stage || e.target.getLayer();
        
        if (clickedOnBackground) {
          if (selectedTool === 'resistor') {
            // Place a new resistor at grid-snapped position
            const worldPoint = screenToWorld(pointer, camera);
            const snappedPoint = snapToGrid(worldPoint, GRID_SPACING);
            
            const newResistor: ResistorData = {
              id: `resistor-${Date.now()}-${Math.random()}`,
              x: snappedPoint.x,
              y: snappedPoint.y,
              rotation: 0,
              selected: false
            };
            
            setResistors(prev => [...prev, newResistor]);
          } else {
            // Deselect all resistors
            setSelectedResistorId(null);
            setResistors(prev => prev.map(r => ({ ...r, selected: false })));
          }
        }
      }
    },
    [camera, selectedTool]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Update mouse position for HUD
      setMousePos(pointer);
      const world = screenToWorld(pointer, camera);
      setWorldPos(world);

      // Handle panning
      if (panStartRef.current && cameraStartRef.current && rightMouseDownPosRef.current) {
        const dx = pointer.x - panStartRef.current.x;
        const dy = pointer.y - panStartRef.current.y;
        
        // Check if we've exceeded drag threshold
        const distFromStart = Math.sqrt(
          Math.pow(pointer.x - rightMouseDownPosRef.current.x, 2) +
          Math.pow(pointer.y - rightMouseDownPosRef.current.y, 2)
        );

        if (distFromStart > DRAG_THRESHOLD) {
          if (!isPanning) {
            setIsPanning(true);
            setCursor('grabbing');
          }

          setCamera({
            ...camera,
            offsetX: cameraStartRef.current.offsetX + dx,
            offsetY: cameraStartRef.current.offsetY + dy,
          });
        }
      }
    },
    [camera, isPanning]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 2) {
        e.evt.preventDefault();
        
        const stage = e.target.getStage();
        if (!stage) return;

        const pointer = stage.getPointerPosition();
        if (!pointer || !rightMouseDownPosRef.current) return;

        // Check if this was a click or a drag
        const dist = Math.sqrt(
          Math.pow(pointer.x - rightMouseDownPosRef.current.x, 2) +
          Math.pow(pointer.y - rightMouseDownPosRef.current.y, 2)
        );

        if (dist <= DRAG_THRESHOLD) {
          // It's a click - open context menu
          onContextMenu(pointer.x, pointer.y);
        }

        // Reset panning state
        setIsPanning(false);
        setCursor('default');
        panStartRef.current = null;
        cameraStartRef.current = null;
        rightMouseDownPosRef.current = null;
      }
    },
    [onContextMenu]
  );

  // Prevent context menu
  const handleContextMenuEvent = useCallback((e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
  }, []);

  // Prevent browser default context menu on the container
  const handleContainerContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Handle resistor selection
  const handleResistorSelect = useCallback((id: string) => {
    setSelectedResistorId(id);
    setResistors(prev => prev.map(resistor => ({
      ...resistor,
      selected: resistor.id === id
    })));
  }, []);

  // Handle resistor drag end with grid snapping
  const handleResistorDragEnd = useCallback((id: string, x: number, y: number) => {
    const snappedPoint = snapToGrid({ x, y }, GRID_SPACING);
    setResistors(prev => prev.map(resistor => {
      if (resistor.id === id) {
        return {
          ...resistor,
          x: snappedPoint.x,
          y: snappedPoint.y
        };
      }
      return resistor;
    }));
  }, []);

  return (
    <div 
      className={styles.canvasContainer} 
      ref={containerRef}
      onContextMenu={handleContainerContextMenu}
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenuEvent}
        ref={stageRef}
        style={{ cursor }}
      >
        {/* Grid Layer */}
        <Layer
          x={camera.offsetX}
          y={camera.offsetY}
          scaleX={camera.zoom}
          scaleY={camera.zoom}
        >
          {renderGrid()}
        </Layer>

        {/* Future: Schematic items layer */}
        <Layer
          x={camera.offsetX}
          y={camera.offsetY}
          scaleX={camera.zoom}
          scaleY={camera.zoom}
        >
          {/* Render resistors */}
          {resistors.map(resistor => (
            <Resistor
              key={resistor.id}
              data={resistor}
              onSelect={handleResistorSelect}
              onDragEnd={handleResistorDragEnd}
            />
          ))}
        </Layer>
      </Stage>

      {/* HUD Overlay */}
      <div className={styles.hud}>
        <div>Zoom: {(camera.zoom * 100).toFixed(0)}%</div>
        <div>
          World: ({worldPos.x.toFixed(0)}, {worldPos.y.toFixed(0)})
        </div>
      </div>
    </div>
  );
}
