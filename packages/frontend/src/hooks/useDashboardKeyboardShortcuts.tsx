/**
 * Dashboard with Keyboard Shortcuts Integration Example
 * Shows how to integrate keyboard shortcuts into existing dashboard
 */
import { useState, useEffect } from 'react';
import { useKeyboardShortcuts, showKeyboardShortcutsHelp, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { toast, austrianToast } from '@/lib/toast';

/**
 * Hook to integrate keyboard shortcuts into dashboard
 */
export function useDashboardKeyboardShortcuts(options: {
  onRefresh?: () => void;
  onToggleDarkMode?: () => void;
  onExport?: () => void;
}) {
  const [darkMode, setDarkMode] = useState(false);

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: 'h',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        austrianToast.shortcutUsed('H', 'Scrolled to top');
      },
      description: 'Go to top',
      category: 'navigation',
    },
    {
      key: 'End',
      action: () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        austrianToast.shortcutUsed('End', 'Scrolled to bottom');
      },
      description: 'Go to bottom',
      category: 'navigation',
    },

    // Actions
    {
      key: 'r',
      action: () => {
        if (options.onRefresh) {
          options.onRefresh();
          austrianToast.shortcutUsed('R', 'Refreshing data...');
        } else {
          window.location.reload();
        }
      },
      description: 'Refresh data',
      category: 'actions',
    },
    {
      key: 'e',
      action: () => {
        if (options.onExport) {
          options.onExport();
          austrianToast.shortcutUsed('E', 'Exporting data...');
        } else {
          toast.info('Export feature coming soon!');
        }
      },
      description: 'Export data',
      category: 'actions',
    },

    // UI Controls
    {
      key: 'd',
      action: () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        document.documentElement.classList.toggle('dark', newDarkMode);
        austrianToast.darkModeToggled(newDarkMode);
        
        if (options.onToggleDarkMode) {
          options.onToggleDarkMode();
        }
      },
      description: 'Toggle dark mode',
      category: 'ui',
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals, dropdowns, etc.
        const modals = document.querySelectorAll('[role="dialog"]');
        if (modals.length > 0) {
          austrianToast.shortcutUsed('Esc', 'Closed modal');
        }
      },
      description: 'Close modals/dialogs',
      category: 'ui',
    },

    // Help
    {
      key: '?',
      shiftKey: true,
      action: () => {
        showKeyboardShortcutsHelp(shortcuts);
      },
      description: 'Show keyboard shortcuts',
      category: 'ui',
    },

    // Data shortcuts
    {
      key: '1',
      action: () => {
        const element = document.getElementById('bitcoin-section');
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        austrianToast.shortcutUsed('1', 'Jumped to Bitcoin section');
      },
      description: 'Jump to Bitcoin',
      category: 'navigation',
    },
    {
      key: '2',
      action: () => {
        const element = document.getElementById('gold-section');
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        austrianToast.shortcutUsed('2', 'Jumped to Gold section');
      },
      description: 'Jump to Gold',
      category: 'navigation',
    },
    {
      key: '3',
      action: () => {
        const element = document.getElementById('stocks-section');
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        austrianToast.shortcutUsed('3', 'Jumped to Stocks section');
      },
      description: 'Jump to Stocks',
      category: 'navigation',
    },

    // Copy shortcuts
    {
      key: 'c',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        austrianToast.copiedToClipboard('Dashboard URL');
      },
      description: 'Copy dashboard URL',
      category: 'actions',
    },
  ];

  useKeyboardShortcuts({ shortcuts });

  return { darkMode, setDarkMode };
}

/**
 * Keyboard Shortcuts Legend Component
 * Shows available shortcuts to users
 */
export function KeyboardShortcutsLegend({ className }: { className?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show legend on first visit
    const hasSeenLegend = localStorage.getItem('hasSeenKeyboardLegend');
    if (!hasSeenLegend) {
      setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem('hasSeenKeyboardLegend', 'true');
      }, 2000);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm animate-slide-in-right z-40 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⌨️</span>
          <h3 className="font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Refresh</span>
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">R</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Dark Mode</span>
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">D</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Export</span>
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">E</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Show All</span>
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">?</kbd>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Press <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded">?</kbd> to see all shortcuts
      </p>
    </div>
  );
}
