'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ToolFamilyDefinition, ToolId } from '../../lib/tools';

type ToolSelectionState<T extends ToolId> = Record<string, T>;

function buildInitialSelection<T extends ToolId>(families: readonly ToolFamilyDefinition<T>[]) {
  return families.reduce<ToolSelectionState<T>>((selection, family) => {
    selection[family.key] = family.defaultToolId;
    return selection;
  }, {});
}

export function useToolFamilySelection<T extends ToolId>(
  families: readonly ToolFamilyDefinition<T>[],
  selectedTool?: ToolId | ''
) {
  const [activeToolByFamily, setActiveToolByFamily] = useState<ToolSelectionState<T>>(() =>
    buildInitialSelection(families)
  );

  useEffect(() => {
    setActiveToolByFamily((current) => {
      const next = { ...current };
      let changed = false;

      for (const family of families) {
        const selectedFamilyTool = family.toolIds.find((toolId) => toolId === selectedTool);
        if (selectedFamilyTool && current[family.key] !== selectedFamilyTool) {
          next[family.key] = selectedFamilyTool;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [families, selectedTool]);

  const toolIds = useMemo(
    () => families.map((family) => activeToolByFamily[family.key] ?? family.defaultToolId),
    [activeToolByFamily, families]
  );

  const submenuByToolId = useMemo(
    () =>
      families.reduce<Partial<Record<ToolId, ToolId[]>>>((submenu, family) => {
        if (family.toolIds.length > 1) {
          submenu[activeToolByFamily[family.key] ?? family.defaultToolId] = [...family.toolIds];
        }
        return submenu;
      }, {}),
    [activeToolByFamily, families]
  );

  const handleToolSelect = (tool: T) => {
    const family = families.find((entry) => entry.toolIds.includes(tool));
    if (!family) {
      return;
    }

    setActiveToolByFamily((current) => {
      if (current[family.key] === tool) {
        return current;
      }
      return {
        ...current,
        [family.key]: tool,
      };
    });
  };

  return {
    toolIds,
    submenuByToolId,
    handleToolSelect,
  };
}
