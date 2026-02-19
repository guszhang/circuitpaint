'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './MenuBar.module.css';

interface MenuBarProps {
  onToggleGrid?: () => void;
  gridVisible?: boolean;
  onZoomTo800?: () => void;
  onEditUndo?: () => void;
  onEditRedo?: () => void;
  onEditCut?: () => void;
  onEditCopy?: () => void;
  onEditPaste?: () => void;
  onEditDelete?: () => void;
}

type MenuItem = string | { label: string; onSelect?: () => void };

export default function MenuBar({
  onToggleGrid,
  gridVisible = true,
  onZoomTo800,
  onEditUndo,
  onEditRedo,
  onEditCut,
  onEditCopy,
  onEditPaste,
  onEditDelete,
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const menus: Record<string, MenuItem[]> = {
    File: ['New', 'Open', 'Save', 'Save As', 'Export', 'Exit'],
    Edit: [
      { label: 'Undo', onSelect: onEditUndo },
      { label: 'Redo', onSelect: onEditRedo },
      { label: 'Cut', onSelect: onEditCut },
      { label: 'Copy', onSelect: onEditCopy },
      { label: 'Paste', onSelect: onEditPaste },
      { label: 'Delete', onSelect: onEditDelete },
    ],
    Draw: ['Line', 'Rectangle', 'Circle', 'Text'],
    Tool: ['Select', 'Wire', 'Component', 'Label'],
    View: [
      {
        label: gridVisible ? 'Hide Grid' : 'Show Grid',
        onSelect: onToggleGrid,
      },
      {
        label: 'Zoom 800%',
        onSelect: onZoomTo800,
      },
    ],
    Help: ['Documentation', 'About'],
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeMenu]);

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleMenuItemClick = (menuName: string, item: MenuItem) => {
    if (typeof item === 'string') {
      console.log(`Menu action: ${menuName} -> ${item}`);
    } else {
      item.onSelect?.();
    }
    setActiveMenu(null);
  };

  return (
    <div className={styles.menuBar} ref={menuBarRef}>
      {Object.entries(menus).map(([menuName, items]) => (
        <div key={menuName} className={styles.menuContainer}>
          <div
            className={`${styles.menuTitle} ${
              activeMenu === menuName ? styles.active : ''
            }`}
            onClick={() => handleMenuClick(menuName)}
          >
            {menuName}
          </div>
          {activeMenu === menuName && (
            <div className={styles.dropdown}>
              {items.map((item) => {
                const label = typeof item === 'string' ? item : item.label;
                return (
                <div
                  key={label}
                  className={styles.menuItem}
                  onClick={() => handleMenuItemClick(menuName, item)}
                >
                  {label}
                </div>
              );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
