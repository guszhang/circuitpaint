'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getToolsByGroup,
  type ToolDefinition,
  type ToolGroup,
  type ToolId,
} from '../../lib/tools';
import styles from './ToolPanel.module.css';

const LONG_PRESS_MS = 450;
const SUBMENU_WIDTH = 240;
const SUBMENU_GAP = 8;
const VIEWPORT_MARGIN = 8;

interface ToolPanelProps {
  title: string;
  group: ToolGroup;
  side: 'left' | 'right';
  toolIds?: ToolId[];
  selectedTool?: ToolId | '';
  onToolSelect?: (tool: ToolId) => void;
  renderIcon?: (tool: ToolDefinition) => React.ReactNode;
  submenuByToolId?: Partial<Record<ToolId, ToolId[]>>;
}

const defaultRenderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" fill="currentColor" />
  </svg>
);

export default function ToolPanel({
  title,
  group,
  side,
  toolIds,
  selectedTool,
  onToolSelect,
  renderIcon = defaultRenderIcon,
  submenuByToolId,
}: ToolPanelProps) {
  const toolsForGroup = getToolsByGroup(group);
  const toolLookup = useMemo(
    () => new Map<ToolId, ToolDefinition>(toolsForGroup.map((tool) => [tool.id, tool])),
    [toolsForGroup]
  );
  const tools = useMemo(() => {
    if (!toolIds) return toolsForGroup;
    return toolIds
      .map((id) => toolLookup.get(id))
      .filter((tool): tool is ToolDefinition => Boolean(tool));
  }, [toolIds, toolLookup, toolsForGroup]);
  const panelClassName = `${styles.panel} ${side === 'left' ? styles.panelLeft : styles.panelRight}`;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const suppressClickToolRef = useRef<ToolId | null>(null);
  const [openSubmenuTool, setOpenSubmenuTool] = useState<ToolId | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const handleToolClick = (toolId: ToolId) => {
    onToolSelect?.(toolId);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearLongPressTimer();
    },
    []
  );

  useEffect(() => {
    if (!openSubmenuTool) return;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpenSubmenuTool(null);
      }
    };

    window.addEventListener('pointerdown', closeOnOutsidePointerDown);
    return () => {
      window.removeEventListener('pointerdown', closeOnOutsidePointerDown);
    };
  }, [openSubmenuTool]);

  return (
    <div ref={panelRef} className={panelClassName}>
      <div className={styles.toolbarTitle}>{title}</div>
      {tools.map((tool) => {
        const submenuToolIds = submenuByToolId?.[tool.id] ?? [];
        const hasSubmenu = submenuToolIds.length > 0;
        const hasSelectedSubmenuTool = submenuToolIds.some((submenuToolId) => submenuToolId === selectedTool);
        const isSelected = selectedTool === tool.id || hasSelectedSubmenuTool;
        const toolButtonClass = `${styles.toolButton} ${isSelected ? styles.selected : ''} ${hasSubmenu ? styles.hasSubmenu : ''}`;

        const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
          if (!hasSubmenu) return;
          clearLongPressTimer();
          const buttonRect = event.currentTarget.getBoundingClientRect();
          longPressTimerRef.current = window.setTimeout(() => {
            suppressClickToolRef.current = tool.id;
            const estimatedSubmenuHeight = submenuToolIds.length * 44 + 16;
            const preferredLeft =
              side === 'right'
                ? buttonRect.left - SUBMENU_GAP - SUBMENU_WIDTH
                : buttonRect.right + SUBMENU_GAP;
            const maxLeft = window.innerWidth - SUBMENU_WIDTH - VIEWPORT_MARGIN;
            const clampedLeft = Math.min(Math.max(preferredLeft, VIEWPORT_MARGIN), maxLeft);
            const maxTop = window.innerHeight - estimatedSubmenuHeight - VIEWPORT_MARGIN;
            const clampedTop = Math.min(Math.max(buttonRect.top, VIEWPORT_MARGIN), maxTop);
            setSubmenuPosition({ left: clampedLeft, top: clampedTop });
            setOpenSubmenuTool(tool.id);
          }, LONG_PRESS_MS);
        };

        const cancelLongPress = () => {
          clearLongPressTimer();
        };

        const handleClick = () => {
          if (suppressClickToolRef.current === tool.id) {
            suppressClickToolRef.current = null;
            return;
          }
          setOpenSubmenuTool(null);
          handleToolClick(tool.id);
        };

        return (
          <div key={tool.id} className={styles.toolSlot}>
            <button
              type="button"
              className={toolButtonClass}
              onClick={handleClick}
              onPointerDown={handlePointerDown}
              onPointerUp={cancelLongPress}
              onPointerCancel={cancelLongPress}
              onPointerLeave={cancelLongPress}
              title={tool.label}
            >
              <div className={styles.icon}>{renderIcon(tool)}</div>
              <div className={styles.label}>{tool.label}</div>
              {hasSubmenu && <span className={styles.submenuIndicator} aria-hidden="true" />}
            </button>
            {openSubmenuTool === tool.id && (
              <div className={styles.submenu} style={{ left: `${submenuPosition.left}px`, top: `${submenuPosition.top}px` }}>
                {submenuToolIds.map((submenuToolId) => {
                  const submenuTool = toolLookup.get(submenuToolId);
                  if (!submenuTool) return null;
                  const submenuSelected = selectedTool === submenuTool.id;
                  return (
                    <button
                      key={submenuTool.id}
                      type="button"
                      className={`${styles.submenuButton} ${submenuSelected ? styles.selected : ''}`}
                      onClick={() => {
                        handleToolClick(submenuTool.id);
                        setOpenSubmenuTool(null);
                      }}
                      title={submenuTool.label}
                    >
                      <div className={styles.icon}>{renderIcon(submenuTool)}</div>
                      <div className={styles.label}>{submenuTool.label}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
