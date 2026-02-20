'use client';

import React, { useEffect, useRef } from 'react';
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export default function ContextMenu({ x, y, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      // Close on right-click elsewhere
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onClose]);

  const menuItems = [
    { id: 'item1', label: 'Item 1' },
    { id: 'item2', label: 'Item 2' },
    { id: 'item3', label: 'Item 3' },
  ];

  const handleItemClick = (itemId: string) => {
    console.log(`Context menu item clicked: ${itemId}`);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ left: x, top: y }}
    >
      {menuItems.map((item) => (
        <div
          key={item.id}
          className={styles.menuItem}
          onClick={() => handleItemClick(item.id)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
