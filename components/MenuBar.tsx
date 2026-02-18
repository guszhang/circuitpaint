'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './MenuBar.module.css';

interface MenuBarProps {
  // Props can be added here for callbacks
}

export default function MenuBar({}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const menus = {
    File: ['New', 'Open', 'Save', 'Save As', 'Export', 'Exit'],
    Edit: ['Undo', 'Redo', 'Cut', 'Copy', 'Paste', 'Delete'],
    Draw: ['Line', 'Rectangle', 'Circle', 'Text'],
    Tool: ['Select', 'Wire', 'Component', 'Label'],
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

  const handleMenuItemClick = (menuName: string, item: string) => {
    console.log(`Menu action: ${menuName} -> ${item}`);
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
              {items.map((item) => (
                <div
                  key={item}
                  className={styles.menuItem}
                  onClick={() => handleMenuItemClick(menuName, item)}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
