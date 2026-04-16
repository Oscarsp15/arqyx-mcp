import type { CanvasKind } from '@arqyx/shared';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

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
  return 'AWS';
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

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => {
    const selectedIndex = canvases.findIndex((canvas) => canvas.id === selected?.id);
    return selectedIndex === -1 ? 0 : selectedIndex;
  });

  const dropdownId = useId();
  const labelId = `${dropdownId}-label`;
  const buttonId = `${dropdownId}-button`;
  const menuId = `${dropdownId}-menu`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setIsOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    return () => window.removeEventListener('pointerdown', onPointerDown, { capture: true });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    optionRefs.current[activeIndex]?.focus();
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const selectedIndex = canvases.findIndex((canvas) => canvas.id === selected?.id);
    setActiveIndex(selectedIndex === -1 ? 0 : selectedIndex);
  }, [isOpen, canvases, selected]);

  const selectCanvas = (canvasId: string) => {
    onSelect(canvasId);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const moveActive = (nextIndex: number) => {
    if (canvases.length === 0) return;
    const lastIndex = canvases.length - 1;
    const clamped = Math.max(0, Math.min(lastIndex, nextIndex));
    setActiveIndex(clamped);
  };

  const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
      return;
    }
  };

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(activeIndex + 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(activeIndex - 1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      moveActive(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      moveActive(canvases.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const active = canvases[activeIndex];
      if (active) {
        selectCanvas(active.id);
      }
    }
  };

  const handleOptionPointerEnter = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div ref={rootRef} className="relative flex items-center gap-2">
      <span id={labelId} className="text-muted-foreground text-xs">
        Lienzo
      </span>
      <button
        id={buttonId}
        ref={buttonRef}
        type="button"
        aria-labelledby={labelId}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
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
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={labelId}
          className="absolute top-full right-0 z-50 mt-1 max-h-60 min-w-56 overflow-auto rounded-md border border-border bg-background p-1 shadow"
        >
          {canvases.map((canvas, index) => {
            const isSelected = canvas.id === selected?.id;
            const isActive = index === activeIndex;
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
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
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
