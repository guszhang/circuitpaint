'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import MenuBar from '../components/MenuBar';
import LeftToolbar from '../components/LeftToolbar';
import RightToolbar from '../components/RightToolbar';
import ContextMenu from '../components/ContextMenu';
import styles from './page.module.css';

// Dynamic import for CanvasViewport to disable SSR
const CanvasViewport = dynamic(() => import('../components/CanvasViewport'), {
  ssr: false,
});

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
    console.log(`Tool selected: ${tool}`);
  };

  const handleContextMenu = (x: number, y: number) => {
    setContextMenu({ x, y });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  return (
    <div className={styles.container}>
      <MenuBar />
      <div className={styles.mainContent}>
        <LeftToolbar onToolSelect={handleToolSelect} selectedTool={selectedTool} />
        <CanvasViewport onContextMenu={handleContextMenu} />
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
