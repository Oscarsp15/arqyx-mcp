import type { CanvasKind } from '@arqyx/shared';

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

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="canvas-selector" className="text-muted-foreground text-xs">
        Lienzo
      </label>
      <select
        id="canvas-selector"
        value={selectedCanvasId ?? canvases[0]?.id ?? ''}
        onChange={(event) => onSelect(event.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {canvases.map((canvas) => (
          <option key={canvas.id} value={canvas.id}>
            {canvasKindLabel(canvas.kind)} · {canvas.name}
          </option>
        ))}
      </select>
    </div>
  );
}
