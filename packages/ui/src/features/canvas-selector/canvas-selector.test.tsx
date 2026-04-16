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

    expect(screen.getByText('ERD · Ventas')).toBeTruthy();
    expect(screen.getByText('Flow · Arquitectura')).toBeTruthy();
    const selector = screen.getByLabelText('Lienzo') as HTMLSelectElement;
    expect(selector.value).toBe('canvas-2');
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

    fireEvent.change(screen.getByLabelText('Lienzo'), {
      target: { value: 'canvas-2' },
    });

    expect(onSelect).toHaveBeenCalledWith('canvas-2');
  });
});
