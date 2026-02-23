'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './MenuBar.module.css';

interface MenuBarProps {
  onToggleGrid?: () => void;
  gridVisible?: boolean;
  onZoomTo100?: () => void;
  onEditUndo?: () => void;
  onEditRedo?: () => void;
  onEditCut?: () => void;
  onEditCopy?: () => void;
  onEditPaste?: () => void;
  onEditDelete?: () => void;
  onFileOpen?: () => void;
  onFileSave?: () => void;
}

type MenuItem = string | { label: string; onSelect?: () => void };

export default function MenuBar({
  onToggleGrid,
  gridVisible = true,
  onZoomTo100,
  onEditUndo,
  onEditRedo,
  onEditCut,
  onEditCopy,
  onEditPaste,
  onEditDelete,
  onFileOpen,
  onFileSave,
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'Open', onSelect: onFileOpen },
      { label: 'Save', onSelect: onFileSave },
    ],
    Edit: [
      { label: 'Undo', onSelect: onEditUndo },
      { label: 'Redo', onSelect: onEditRedo },
      { label: 'Cut', onSelect: onEditCut },
      { label: 'Copy', onSelect: onEditCopy },
      { label: 'Paste', onSelect: onEditPaste },
      { label: 'Delete', onSelect: onEditDelete },
    ],
    View: [
      {
        label: gridVisible ? 'Hide Grid' : 'Show Grid',
        onSelect: onToggleGrid,
      },
      {
        label: 'Zoom 100%',
        onSelect: onZoomTo100,
      },
    ],
    Help: [{ label: 'Help', onSelect: () => setShowHelpPopup(true) }],
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
      <div className={styles.menuCenterTitle}>CircuitPaint version 0.1</div>
      {Object.entries(menus).map(([menuName, items]) => (
        <div key={menuName} className={styles.menuContainer}>
          <div
            className={`${styles.menuTitle} ${activeMenu === menuName ? styles.active : ''
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
      {showHelpPopup && (
        <div className={styles.helpPopup} role="dialog" aria-label="Help">
          <div className={styles.helpHeader}>
            <span>CircuitPaint Help</span>
            <button
              type="button"
              className={styles.helpClose}
              onClick={() => setShowHelpPopup(false)}
              aria-label="Close help"
            >
              x
            </button>
          </div>
          <div className={styles.helpBody}>
            <div className={styles.helpSectionTitle}>CircuitPaint</div>

            <div className={styles.helpMeta}>
              CircuitPaint is a lightweight schematic drawing tool developed to provide
              clean, consistent, and publication-quality circuit symbols. While preparing
              lecture notes, research papers, and examination materials, existing general-purpose
              vector tools such as Inkscape were often used; however, a dedicated circuit
              symbol editor with a consistent visual style — comparable to the schematics
              presented in the MIT textbook <em>Principles of Power Electronics</em> —
              was not readily available.

              CircuitPaint was therefore created to enable rapid, high-quality schematic
              diagram generation specifically tailored for power electronics education
              and research.
            </div>
            <div className={styles.helpSectionTitle}>Quick Commands</div>
            <ul className={styles.helpList}>
              <li>Click on an empty area of the canvas to clear the current selection.</li>
              <li>Click and drag to select multiple components.</li>
              <li>Press <strong>R</strong> to rotate the selected component(s).</li>
              <li>Press <strong>G</strong> to toggle grid visibility.</li>
              <li>Use <strong>Ctrl/Cmd + C</strong>, <strong>X</strong>, and <strong>V</strong> to copy, cut, and paste.</li>
              <li>Use <strong>Ctrl/Cmd + S</strong> to export the schematic as a JSON file.</li>
              <li>Use your system’s screenshot function to capture and save the schematic image.</li>
            </ul>

            <div className={styles.helpSectionTitle}>Project Information</div>

            <div className={styles.helpMeta}>
              <span>Software Author:</span> Dr Cheng (Gus) Zhang
            </div>

            <div className={styles.helpMeta}>
              <span>Affiliation:</span> Department of Electrical and Electronic Engineering,
              The University of Manchester, United Kingdom
            </div>

            <div className={styles.helpMeta}>
              <span>Contact:</span> cheng.zhang@manchester.ac.uk
            </div>

            <div className={styles.helpMeta}>
              <span>Development Assistance:</span> Portions of the source code were developed
              with AI-assisted programming tools (GitHub Copilot and OpenAI Codex).
            </div>

            <div className={styles.helpMeta}>
              <span>Licence:</span> GNU Affero General Public License v3.0 (AGPL-3.0)
            </div>

            <div className={styles.helpMeta}>
              <span>Copyright:</span> © {new Date().getFullYear()} Dr Cheng (Gus) Zhang.
              All rights reserved. Distributed under the terms of the AGPL-3.0 licence.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
