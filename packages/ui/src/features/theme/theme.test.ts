import { describe, expect, it } from 'vitest';
import { isTheme, resolveInitialTheme, toggleTheme } from './theme.js';

describe('isTheme', () => {
  it('accepts light and dark', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isTheme('')).toBe(false);
    expect(isTheme('auto')).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
    expect(isTheme(42)).toBe(false);
  });
});

describe('toggleTheme', () => {
  it('light becomes dark', () => {
    expect(toggleTheme('light')).toBe('dark');
  });

  it('dark becomes light', () => {
    expect(toggleTheme('dark')).toBe('light');
  });
});

describe('resolveInitialTheme', () => {
  it('uses stored value when present', () => {
    expect(resolveInitialTheme('dark', 'light')).toBe('dark');
    expect(resolveInitialTheme('light', 'dark')).toBe('light');
  });

  it('falls back to system preference when storage is empty', () => {
    expect(resolveInitialTheme(null, 'dark')).toBe('dark');
    expect(resolveInitialTheme(null, 'light')).toBe('light');
  });
});
