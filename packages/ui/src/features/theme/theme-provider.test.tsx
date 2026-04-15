import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createFixedPreference } from './system-preference.js';
import { useTheme } from './theme-context.js';
import { ThemeProvider } from './theme-provider.js';
import { createMemoryAdapter } from './theme-storage.js';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
});

function Probe() {
  const { theme, toggle } = useTheme();
  return (
    <div>
      <span data-testid="current">{theme}</span>
      <button type="button" onClick={toggle}>
        toggle
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  it('uses stored theme when provided', () => {
    const storage = createMemoryAdapter('dark');
    render(
      <ThemeProvider storage={storage} systemPreference={createFixedPreference('light')}>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('current').textContent).toBe('dark');
  });

  it('falls back to system preference when storage is empty', () => {
    const storage = createMemoryAdapter(null);
    render(
      <ThemeProvider storage={storage} systemPreference={createFixedPreference('dark')}>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('current').textContent).toBe('dark');
  });

  it('toggles theme and persists to storage', () => {
    const storage = createMemoryAdapter('light');
    render(
      <ThemeProvider storage={storage} systemPreference={createFixedPreference('light')}>
        <Probe />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByText('toggle'));

    expect(screen.getByTestId('current').textContent).toBe('dark');
    expect(storage.read()).toBe('dark');
  });

  it('writes theme to document data attribute', () => {
    const storage = createMemoryAdapter('dark');
    render(
      <ThemeProvider storage={storage} systemPreference={createFixedPreference('light')}>
        <Probe />
      </ThemeProvider>,
    );

    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
