import { SaveManager } from './SaveManager';

/** Short phone vibrations on big moments (ignored on devices without vibration, or when turned off). */
export function buzz(pattern: number | number[]) {
  try {
    if (!SaveManager.data.haptics) return;
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    nav.vibrate?.(pattern);
  } catch { /* not supported */ }
}
