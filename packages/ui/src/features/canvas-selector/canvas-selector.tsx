import type { CanvasKind } from '@arqyx/shared';
import { useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { useCanvasDropdown } from './use-canvas-dropdown.js';

export type CanvasOption = {
  id: string;
  name: string;
  kind: CanvasKind;
};

type CanvasSelectorProps = {
  canvases: readonly CanvasOption[];
  selectedCanvasId: string | null;
  onSelect: (canvasId: string) => void;
};

function canvasKindLabel(kind: CanvasKind): string {
  if (kind === 'erd') return 'ERD';
  if (kind === 'flow') return 'Flow';
  if (kind === 'aws') return 'AWS';
  const exhaustive: never = kind;
  return exhaustive;
}

export function CanvasSelector({ canvases, selectedCanvasId, onSelect }: CanvasSelectorProps) {
  if (canvases.length === 0) {
    return <span className="text-muted-foreground text-xs">Sin lienzos</span>;
  }

  const selected = useMemo(() => {
    const explicit = canvases.find((canvas) => canvas.id === selectedCanvasId);
    if (explicit) return explicit;
    return canvases[0] ?? null;
  }, [canvases, selectedCanvasId]);

  const dropdown = useCanvasDropdown({
    options: canvases,
    selectedId: selected?.id ?? null,
  });

  const selectCanvas = (canvasId: string) => {
    onSelect(canvasId);
    dropdown.close();
    dropdown.buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dropdown.open();
      return;
    }
  };

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dropdown.close();
      dropdown.buttonRef.current?.focus();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      dropdown.setActiveIndex(dropdown.activeIndex + 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      dropdown.setActiveIndex(dropdown.activeIndex - 1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      dropdown.setActiveIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      dropdown.setActiveIndex(canvases.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const active = canvases[dropdown.activeIndex];
      if (active) {
        selectCanvas(active.id);
      }
    }
  };

  const handleOptionPointerEnter = (index: number) => {
    dropdown.setActiveIndex(index);
  };

  return (
    <div ref={dropdown.rootRef} className="relative flex items-center gap-2">
      <span id={dropdown.labelId} className="text-muted-foreground text-xs">
        Lienzo
      </span>
      <button
        id={dropdown.buttonId}
        ref={dropdown.buttonRef}
        type="button"
        aria-labelledby={dropdown.labelId}
        aria-haspopup="menu"
        aria-controls={dropdown.menuId}
        aria-expanded={dropdown.isOpen}
        onClick={dropdown.toggle}
        onKeyDown={handleButtonKeyDown}
        className="rounded-md border border-border bg-background px-2 py-1 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {selected ? (
          <>
            {canvasKindLabel(selected.kind)} · {selected.name}
          </>
        ) : (
          'Sin lienzos'
        )}
      </button>
      {dropdown.isOpen && (
        <div
          id={dropdown.menuId}
          role="menu"
          aria-labelledby={dropdown.labelId}
          className="absolute top-full right-0 z-50 mt-1 max-h-60 min-w-56 overflow-auto rounded-md border border-border bg-background p-1 shadow"
        >
          {canvases.map((canvas, index) => {
            const isSelected = canvas.id === selected?.id;
            const isActive = index === dropdown.activeIndex;
            return (
              <button
                key={canvas.id}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                tabIndex={isActive ? 0 : -1}
                onKeyDown={handleOptionKeyDown}
                onPointerEnter={() => handleOptionPointerEnter(index)}
                onClick={() => selectCanvas(canvas.id)}
                ref={dropdown.getOptionRef(index)}
                className="w-full cursor-pointer rounded-sm px-2 py-1 text-left text-foreground text-xs focus:bg-muted focus:outline-none data-[selected='true']:font-medium"
                data-selected={isSelected}
              >
                {canvasKindLabel(canvas.kind)} · {canvas.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
