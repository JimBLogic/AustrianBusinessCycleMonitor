/**
 * Keyboard Shortcuts Hook
 * Professional keyboard navigation for power users
 */
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  category?: 'navigation' | 'actions' | 'ui' | 'data';
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

export function useKeyboardShortcuts({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: Escape key should work everywhere
        if (event.key !== 'Escape') return;
      }

      const matchingShortcut = shortcuts.find(
        (shortcut) =>
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          !!shortcut.ctrlKey === event.ctrlKey &&
          !!shortcut.altKey === event.altKey &&
          !!shortcut.shiftKey === event.shiftKey
      );

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
}

/**
 * Show keyboard shortcuts help modal
 */
export function showKeyboardShortcutsHelp(shortcuts: KeyboardShortcut[]) {
  // Group shortcuts by category
  const grouped = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  // Create help text
  let helpText = '⌨️ Keyboard Shortcuts:\n\n';
  
  const categoryLabels = {
    navigation: '🧭 Navigation',
    actions: '⚡ Actions',
    ui: '🎨 User Interface',
    data: '📊 Data',
    other: '📌 Other',
  };

  Object.entries(grouped).forEach(([category, categoryShortcuts]) => {
    helpText += `${categoryLabels[category as keyof typeof categoryLabels] || category}:\n`;
    categoryShortcuts.forEach((shortcut) => {
      const keys = [];
      if (shortcut.ctrlKey) keys.push('Ctrl');
      if (shortcut.altKey) keys.push('Alt');
      if (shortcut.shiftKey) keys.push('Shift');
      keys.push(shortcut.key.toUpperCase());
      
      helpText += `  ${keys.join('+')} - ${shortcut.description}\n`;
    });
    helpText += '\n';
  });

  toast.info(helpText, {
    duration: 10000,
    style: {
      whiteSpace: 'pre-wrap',
      fontFamily: 'monospace',
    },
  });
}

/**
 * Format shortcut key for display
 */
export function formatShortcutKey(shortcut: KeyboardShortcut): string {
  const keys = [];
  if (shortcut.ctrlKey) keys.push('⌘');
  if (shortcut.altKey) keys.push('⌥');
  if (shortcut.shiftKey) keys.push('⇧');
  keys.push(shortcut.key.toUpperCase());
  return keys.join('+');
}
