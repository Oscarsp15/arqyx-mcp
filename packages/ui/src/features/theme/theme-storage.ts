import { type Theme, isTheme } from './theme.js';

export type ThemeStorage = {
  read(): Theme | null;
  write(theme: Theme): void;
};

const STORAGE_KEY = 'arqyx:theme';

export function createLocalStorageAdapter(): ThemeStorage {
  return {
    read: () => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return isTheme(raw) ? raw : null;
    },
    write: (theme: Theme) => {
      window.localStorage.setItem(STORAGE_KEY, theme);
    },
  };
}

export function createMemoryAdapter(initial: Theme | null = null): ThemeStorage {
  let current: Theme | null = initial;
  return {
    read: () => current,
    write: (theme: Theme) => {
      current = theme;
    },
  };
}
