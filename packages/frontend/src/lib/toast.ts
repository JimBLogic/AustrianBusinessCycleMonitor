import { toast } from 'sonner';

const SHORTCUT_TOAST_DURATION_MS = 1800;

/** Dashboard-specific toast helpers kept separate from the Sonner UI mount. */
export const austrianToast = {
  shortcutUsed(shortcut: string, message: string): void {
    toast(message, {
      description: `Keyboard shortcut: ${shortcut}`,
      duration: SHORTCUT_TOAST_DURATION_MS,
    });
  },

  darkModeToggled(enabled: boolean): void {
    toast.success(enabled ? 'Dark mode enabled' : 'Dark mode disabled', {
      duration: SHORTCUT_TOAST_DURATION_MS,
    });
  },

  copiedToClipboard(label: string): void {
    toast.success(`${label} copied to clipboard`, {
      duration: SHORTCUT_TOAST_DURATION_MS,
    });
  },
};

export { toast };
