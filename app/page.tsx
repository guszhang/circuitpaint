'use client';

import React, { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import MenuBar from '../components/MenuBar';
import LeftToolbar from '../components/tools/LeftToolbar';
import RightToolbar from '../components/tools/RightToolbar';
import ContextMenu from '../components/ContextMenu';
import styles from './page.module.css';
import type { CanvasViewportControls } from '../components/CanvasViewport';
import type { ToolId } from '../lib/tools';

// Dynamic import for CanvasViewport to disable SSR
const CanvasViewport = dynamic(() => import('../components/CanvasViewport'), {
  ssr: false,
});

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<ToolId | ''>('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const viewportControlsRef = useRef<CanvasViewportControls | null>(null);

  const handleToolSelect = (tool: ToolId) => {
    setSelectedTool(tool);
    console.log(`Tool selected: ${tool}`);
  };

  const handleToolComplete = () => {
    setSelectedTool('');
  };

  const handleContextMenu = (x: number, y: number) => {
    setContextMenu({ x, y });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleToggleGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
  }, []);

  const handleRegisterViewportControls = useCallback((controls: CanvasViewportControls) => {
    viewportControlsRef.current = controls;
  }, []);

  const handleZoomTo800 = useCallback(() => {
    viewportControlsRef.current?.setZoomLevel(8);
  }, []);

  const handleEditUndo = useCallback(() => {
    viewportControlsRef.current?.undo();
  }, []);

  const handleEditRedo = useCallback(() => {
    viewportControlsRef.current?.redo();
  }, []);

  const handleEditCut = useCallback(() => {
    viewportControlsRef.current?.cutSelection();
  }, []);

  const handleEditCopy = useCallback(() => {
    viewportControlsRef.current?.copySelection();
  }, []);

  const handleEditPaste = useCallback(() => {
    viewportControlsRef.current?.pasteSelection();
  }, []);

  const handleEditDelete = useCallback(() => {
    viewportControlsRef.current?.deleteSelection();
  }, []);

  return (
    <div className={styles.container}>
      <MenuBar
        onToggleGrid={handleToggleGrid}
        gridVisible={showGrid}
        onZoomTo800={handleZoomTo800}
        onEditUndo={handleEditUndo}
        onEditRedo={handleEditRedo}
        onEditCut={handleEditCut}
        onEditCopy={handleEditCopy}
        onEditPaste={handleEditPaste}
        onEditDelete={handleEditDelete}
      />
      <div className={styles.mainContent}>
        <LeftToolbar onToolSelect={handleToolSelect} selectedTool={selectedTool} />
        <CanvasViewport
          onContextMenu={handleContextMenu}
          selectedTool={selectedTool}
          onToggleGrid={handleToggleGrid}
          showGrid={showGrid}
          onToolComplete={handleToolComplete}
          onRegisterViewportControls={handleRegisterViewportControls}
        />
        <RightToolbar onToolSelect={handleToolSelect} selectedTool={selectedTool} />
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleContextMenuClose}
        />
      )}
    </div>
  );
}
