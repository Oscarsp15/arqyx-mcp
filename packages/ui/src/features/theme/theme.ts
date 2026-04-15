export type Theme = 'light' | 'dark';

export const THEMES: readonly Theme[] = ['light', 'dark'] as const;

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

export function toggleTheme(current: Theme): Theme {
  return current === 'light' ? 'dark' : 'light';
}

export function resolveInitialTheme(stored: Theme | null, systemPrefers: Theme): Theme {
  if (stored !== null) return stored;
  return systemPrefers;
}
