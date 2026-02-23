'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import MenuBar from '../components/MenuBar';
import LeftToolbar from '../components/tools/LeftToolbar';
import RightToolbar from '../components/tools/RightToolbar';
import ContextMenu from '../components/ContextMenu';
import styles from './page.module.css';
import type { CanvasViewportControls } from '../components/CanvasViewport';
import type { ToolId } from '../lib/tools';
import { isComponentTool, isDrawingTool } from '../lib/tools';
import type { CanvasFile } from '../components/canvas/types';

type UnknownRecord = Record<string, unknown>;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const isRotation = (value: unknown): value is 0 | 90 | 180 | 270 =>
  value === 0 || value === 90 || value === 180 || value === 270;

const isPoint = (value: unknown): value is { x: number; y: number } => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const point = value as UnknownRecord;
  return isNumber(point.x) && isNumber(point.y);
};

function parseCanvasFile(raw: unknown): CanvasFile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid file format.');
  }
  const data = raw as UnknownRecord;
  if (data.version !== undefined && data.version !== 1) {
    throw new Error('Unsupported file version.');
  }

  if (!Array.isArray(data.components) || !Array.isArray(data.drawings) || !Array.isArray(data.wires)) {
    throw new Error('Missing scene data.');
  }

  const components = data.components.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Invalid component entry.');
    }
    const item = entry as UnknownRecord;
    if (!isString(item.id) || !isString(item.toolId) || !isNumber(item.x) || !isNumber(item.y) || !isRotation(item.rotation)) {
      throw new Error('Invalid component entry.');
    }
    if (!isComponentTool(item.toolId)) {
      throw new Error('Unknown component tool.');
    }
    if (item.strokeColor !== undefined && !isString(item.strokeColor)) {
      throw new Error('Invalid component color.');
    }
    return {
      id: item.id,
      toolId: item.toolId,
      x: item.x,
      y: item.y,
      rotation: item.rotation,
      strokeColor: item.strokeColor,
    };
  });

  const drawings = data.drawings.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Invalid drawing entry.');
    }
    const item = entry as UnknownRecord;
    if (!isString(item.id) || !isString(item.toolId) || !isNumber(item.x) || !isNumber(item.y) || !isRotation(item.rotation)) {
      throw new Error('Invalid drawing entry.');
    }
    const normalizedToolId =
      item.toolId === 'voltage-annotation'
        ? 'voltage-plus-annotation'
        : item.toolId === 'label'
          ? 'text'
          : item.toolId;
    if (!isDrawingTool(normalizedToolId) || normalizedToolId === 'wire') {
      throw new Error('Unknown drawing tool.');
    }
    if (item.text !== undefined && !isString(item.text)) {
      throw new Error('Invalid drawing text.');
    }
    if (item.strokeColor !== undefined && !isString(item.strokeColor)) {
      throw new Error('Invalid drawing color.');
    }
    if (item.border !== undefined && !isBoolean(item.border)) {
      throw new Error('Invalid drawing border value.');
    }
    if (item.fontSize !== undefined && !isNumber(item.fontSize)) {
      throw new Error('Invalid drawing font size.');
    }
    const normalizedBorder = item.toolId === 'label' ? true : item.border;
    return {
      id: item.id,
      toolId: normalizedToolId,
      x: item.x,
      y: item.y,
      rotation: item.rotation,
      text: item.text,
      strokeColor: item.strokeColor,
      border: normalizedBorder,
      fontSize: item.fontSize,
    };
  });

  const wires = data.wires.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Invalid wire entry.');
    }
    const item = entry as UnknownRecord;
    if (!isString(item.id) || !isNumber(item.x) || !isNumber(item.y) || !Array.isArray(item.vertices)) {
      throw new Error('Invalid wire entry.');
    }
    const vertices = item.vertices.map((vertex) => {
      if (!isPoint(vertex)) {
        throw new Error('Invalid wire vertex.');
      }
      return { x: vertex.x, y: vertex.y };
    });
    if (item.strokeColor !== undefined && !isString(item.strokeColor)) {
      throw new Error('Invalid wire color.');
    }
    return {
      id: item.id,
      x: item.x,
      y: item.y,
      vertices,
      strokeColor: item.strokeColor,
    };
  });

  return {
    version: 1,
    components,
    drawings,
    wires,
  };
}

// Dynamic import for CanvasViewport to disable SSR
const CanvasViewport = dynamic(() => import('../components/CanvasViewport'), {
  ssr: false,
});

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<ToolId | ''>('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const viewportControlsRef = useRef<CanvasViewportControls | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleZoomTo100 = useCallback(() => {
    viewportControlsRef.current?.setZoomLevel(2);
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

  const handleFileOpen = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSave = useCallback(() => {
    const data = viewportControlsRef.current?.serializeScene();
    if (!data) {
      return;
    }
    const json = JSON.stringify(data, null, 2);
    const timestamp = new Date()
      .toISOString()
      .replace('T', '-')
      .replace('Z', '')
      .replace(/[:.]/g, '-');
    const filename = `circuitpaint-${timestamp}.json`;

    const tryNativeSave = async () => {
      if (!('showSaveFilePicker' in window)) {
        return false;
      }
      const handle = await (
        window as Window &
          typeof globalThis & {
            showSaveFilePicker?: (options: {
              suggestedName?: string;
              types?: Array<{
                description?: string;
                accept: Record<string, string[]>;
              }>;
            }) => Promise<FileSystemFileHandle>;
          }
      ).showSaveFilePicker?.({
        suggestedName: filename,
        types: [
          {
            description: 'CircuitPaint JSON',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      if (!handle) {
        return false;
      }
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return true;
    };

    const fallbackDownload = () => {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    void (async () => {
      try {
        const saved = await tryNativeSave();
        if (!saved) {
          fallbackDownload();
        }
      } catch (error) {
        console.error(error);
        fallbackDownload();
      }
    })();
  }, []);

  const handleQuickSaveDownload = useCallback(() => {
    const data = viewportControlsRef.current?.serializeScene();
    if (!data) {
      return;
    }
    const json = JSON.stringify(data, null, 2);
    const timestamp = new Date()
      .toISOString()
      .replace('T', '-')
      .replace('Z', '')
      .replace(/[:.]/g, '-');
    const filename = `circuitpaint-${timestamp}.json`;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      try {
        const text = await file.text();
        const parsed = parseCanvasFile(JSON.parse(text));
        viewportControlsRef.current?.loadScene(parsed);
      } catch (error) {
        console.error(error);
        window.alert('Failed to open file. Please select a valid CircuitPaint JSON file.');
      } finally {
        event.target.value = '';
      }
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      handleQuickSaveDownload();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuickSaveDownload]);

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <MenuBar
        onToggleGrid={handleToggleGrid}
        gridVisible={showGrid}
        onZoomTo100={handleZoomTo100}
        onEditUndo={handleEditUndo}
        onEditRedo={handleEditRedo}
        onEditCut={handleEditCut}
        onEditCopy={handleEditCopy}
        onEditPaste={handleEditPaste}
        onEditDelete={handleEditDelete}
        onFileOpen={handleFileOpen}
        onFileSave={handleFileSave}
      />
      <div className={styles.mainContent}>
        <LeftToolbar onToolSelect={handleToolSelect} selectedTool={selectedTool} />
        <CanvasViewport
          onContextMenu={() => {}}
          selectedTool={selectedTool}
          onToggleGrid={handleToggleGrid}
          showGrid={showGrid}
          onToolComplete={handleToolComplete}
          onRegisterViewportControls={handleRegisterViewportControls}
        />
        <RightToolbar onToolSelect={handleToolSelect} selectedTool={selectedTool} />
      </div>
    </div>
  );
}
