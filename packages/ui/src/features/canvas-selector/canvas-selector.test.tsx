import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CanvasSelector } from './canvas-selector.js';

afterEach(() => {
  cleanup();
});

describe('CanvasSelector', () => {
  it('renders available canvases and selected option', () => {
    render(
      <CanvasSelector
        canvases={[
          { id: 'canvas-1', name: 'Ventas', kind: 'erd' },
          { id: 'canvas-2', name: 'Arquitectura', kind: 'flow' },
        ]}
        selectedCanvasId="canvas-2"
        onSelect={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Lienzo' }).textContent).toContain(
      'Flow · Arquitectura',
    );
  });

  it('calls onSelect when the selected canvas changes', () => {
    const onSelect = vi.fn();
    render(
      <CanvasSelector
        canvases={[
          { id: 'canvas-1', name: 'Ventas', kind: 'erd' },
          { id: 'canvas-2', name: 'Infra', kind: 'aws' },
        ]}
        selectedCanvasId="canvas-1"
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Lienzo' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'AWS · Infra' }));

    expect(onSelect).toHaveBeenCalledWith('canvas-2');
  });
});
