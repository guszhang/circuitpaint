'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getToolsByGroup,
  type ToolDefinition,
  type ToolGroup,
  type ToolId,
} from '../../lib/tools';
import styles from './ToolPanel.module.css';

const HOVER_OPEN_MS = 120;
const HOVER_CLOSE_MS = 220;
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
  footer?: React.ReactNode;
  /** Shortcut key per entry of the displayed tool list (same order as toolIds). */
  shortcuts?: readonly (string | undefined)[];
}

const ToolSymbolIcon = dynamic(() => import('./ToolSymbolIcon'), {
  ssr: false,
});

const defaultRenderIcon = (tool: ToolDefinition) => <ToolSymbolIcon toolId={tool.id} />;

export default function ToolPanel({
  title,
  group,
  side,
  toolIds,
  selectedTool,
  onToolSelect,
  renderIcon = defaultRenderIcon,
  submenuByToolId,
  footer,
  shortcuts,
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
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [openSubmenuTool, setOpenSubmenuTool] = useState<ToolId | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const handleToolClick = (toolId: ToolId) => {
    onToolSelect?.(toolId);
  };

  const clearTimers = () => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => clearTimers, []);

  const toolsRef = useRef(tools);
  toolsRef.current = tools;
  const onToolSelectRef = useRef(onToolSelect);
  onToolSelectRef.current = onToolSelect;

  useEffect(() => {
    if (!shortcuts) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const index = shortcuts.findIndex((key) => key && key === event.key.toLowerCase());
      const tool = index >= 0 ? toolsRef.current[index] : undefined;
      if (!tool) return;
      event.preventDefault();
      setOpenSubmenuTool(null);
      onToolSelectRef.current?.(tool.id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

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

        const handleClick = () => {
          setOpenSubmenuTool(null);
          handleToolClick(tool.id);
        };

        const openSubmenu = (target: HTMLElement) => {
          clearTimers();
          if (!hasSubmenu) {
            return;
          }
          const buttonRect = target.getBoundingClientRect();
          const estimatedSubmenuHeight = submenuToolIds.length * 44 + 16;
          const preferredLeft =
            side === 'right'
              ? buttonRect.left - SUBMENU_GAP - SUBMENU_WIDTH
              : buttonRect.right + SUBMENU_GAP;
          const maxLeft = window.innerWidth - SUBMENU_WIDTH - VIEWPORT_MARGIN;
          const clampedLeft = Math.min(Math.max(preferredLeft, VIEWPORT_MARGIN), maxLeft);
          const maxTop = window.innerHeight - estimatedSubmenuHeight - VIEWPORT_MARGIN;
          const clampedTop = Math.min(Math.max(buttonRect.top, VIEWPORT_MARGIN), maxTop);
          openTimerRef.current = window.setTimeout(() => {
            setSubmenuPosition({ left: clampedLeft, top: clampedTop });
            setOpenSubmenuTool(tool.id);
          }, HOVER_OPEN_MS);
        };

        const scheduleClose = () => {
          clearTimers();
          closeTimerRef.current = window.setTimeout(() => setOpenSubmenuTool(null), HOVER_CLOSE_MS);
        };

        const shortcut = shortcuts?.[tools.indexOf(tool)];

        return (
          <div
            key={tool.id}
            className={styles.toolSlot}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') openSubmenu(event.currentTarget.firstElementChild as HTMLElement);
            }}
            onPointerLeave={scheduleClose}
          >
            <button
              type="button"
              className={toolButtonClass}
              onClick={handleClick}
              title={shortcut ? `${tool.label} (${shortcut.toUpperCase()})` : tool.label}
            >
              <div className={styles.icon}>{renderIcon(tool)}</div>
              <div className={styles.label}>{tool.label}</div>
              {shortcut && <span className={styles.shortcutBadge} aria-hidden="true">{shortcut.toUpperCase()}</span>}
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
      {footer}
    </div>
  );
}
