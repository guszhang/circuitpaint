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
  onFileExportSvg?: () => void;
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
  onFileExportSvg,
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showHelpPopup, setShowHelpPopup] = useState(true);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'Open', onSelect: onFileOpen },
      { label: 'Save', onSelect: onFileSave },
      { label: 'Export as SVG', onSelect: onFileExportSvg },
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
      <div className={styles.menuCenterTitle}>CircuitPaint</div>
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
            <div className={styles.helpSectionTitle2}>CircuitPaint v0.1.6</div>

            <div className={styles.helpMeta}>
              CircuitPaint is a lightweight schematic drawing tool developed to provide
              clean, consistent, and publication-quality circuit symbols. <br />

              <b>This tool is designed for Desktop use only for now. A mouse and a keyboard are required for full functionality.</b>
            </div>
            <div className={styles.helpSectionTitle}>Quick Commands</div>
            <ul className={styles.helpList}>
              <li>Click on an empty area of the canvas to clear the current selection.</li>
              <li>Click and drag to select multiple components.</li>
              <li><strong>Long press on a component</strong> to access additional options.</li>
              <li>Press <strong>R</strong> to rotate the selected component(s).</li>
              <li>Press <strong>E</strong> to mirror the selected items horizontally.</li>
              <li>Press <strong>G</strong> to toggle grid visibility.</li>
              <li>Press <strong>W</strong> to select the wire tool.</li>
              <li>Press <strong>Esc</strong> to deselect the current tool.</li>
              <li>Use <strong>Ctrl/Cmd + C</strong>, <strong>X</strong>, and <strong>V</strong> to copy, cut, and paste. Selected items can be pasted into Word and similar apps as a rasterised picture.</li>
              <li>Use <strong>Ctrl/Cmd + S</strong> to export the schematic as a JSON file.</li>
              <li>Use <strong>File → Export as SVG</strong> to export the canvas as a self-contained SVG.</li>
              <li>Use mouse wheel to zoom in and out.</li>
              <li>Use right-click drag to pan the canvas.</li>
              <li>Use your system’s screenshot function to capture and save the schematic image.</li>
            </ul>

            <div className={styles.helpSectionTitle}>Project Information</div>

            <div className={styles.helpMeta}>
              <span>Project Repository:</span>{' '}
              <a
                href="https://github.com/guszhang/circuitpaint"
                target="_blank"
                rel="noopener noreferrer"
              >
                CircuitPaint Repository
              </a>
            </div>

            <div className={styles.helpMeta}>
              <strong>CircuitPaint</strong><br />
              <a href="mailto:cheng.zhang@manchester.ac.uk">Cheng (Gus) Zhang</a> · Department of Electrical and Electronic Engineering, The University of Manchester, UK<br />
              <br />
              Developed in part using GitHub Copilot and OpenAI Codex · AGPL-3.0<br />
              © {new Date().getFullYear()} Cheng (Gus) Zhang
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
