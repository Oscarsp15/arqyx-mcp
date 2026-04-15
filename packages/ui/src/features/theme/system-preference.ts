import type { Theme } from './theme.js';

export type SystemPreference = {
  current(): Theme;
};

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function createMediaQueryPreference(): SystemPreference {
  return {
    current: () => (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'),
  };
}

export function createFixedPreference(theme: Theme): SystemPreference {
  return { current: () => theme };
}
