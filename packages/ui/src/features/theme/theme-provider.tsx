import { type ReactNode, useEffect, useState } from 'react';
import { type SystemPreference, createMediaQueryPreference } from './system-preference.js';
import { ThemeContext, type ThemeContextValue } from './theme-context.js';
import { type ThemeStorage, createLocalStorageAdapter } from './theme-storage.js';
import { type Theme, resolveInitialTheme, toggleTheme } from './theme.js';

type ThemeProviderProps = {
  children: ReactNode;
  storage?: ThemeStorage;
  systemPreference?: SystemPreference;
};

export function ThemeProvider({
  children,
  storage = createLocalStorageAdapter(),
  systemPreference = createMediaQueryPreference(),
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() =>
    resolveInitialTheme(storage.read(), systemPreference.current()),
  );

  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
    storage.write(theme);
  }, [theme, storage]);

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggle: () => setTheme(toggleTheme),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
