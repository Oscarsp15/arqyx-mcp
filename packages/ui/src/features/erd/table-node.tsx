import { Handle, type NodeProps, Position } from '@xyflow/react';
import { Key, X } from 'lucide-react';
import { useState } from 'react';

export type TableColumnView = {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
};

export type TableNodeData = {
  label: string;
  onRename?: (newName: string) => void;
  onRemove?: () => void;
  columns: readonly TableColumnView[];
};

export function TableNode({ data }: NodeProps) {
  const typed = data as TableNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(typed.label);

  const handleEditSubmit = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed !== typed.label && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
      typed.onRename?.(trimmed);
    } else {
      setEditValue(typed.label);
    }
  };

  return (
    <div className="min-w-52 rounded-md border border-border bg-background shadow-sm">
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center justify-between border-border border-b bg-muted px-3 py-2">
        {isEditing ? (
          <input
            className="nodrag nowheel w-full bg-background px-1 py-0.5 text-sm font-medium text-foreground outline-none ring-1 ring-ring"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditSubmit();
              if (e.key === 'Escape') {
                setEditValue(typed.label);
                setIsEditing(false);
              }
            }}
            // biome-ignore lint/a11y/noAutofocus: input inline editing demands immediate focus
            autoFocus
          />
        ) : (
          <span
            className="font-medium text-foreground text-sm"
            onDoubleClick={() => {
              setEditValue(typed.label);
              setIsEditing(true);
            }}
          >
            {typed.label}
          </span>
        )}
        {typed.onRemove && (
          <button
            type="button"
            className="ml-2 text-muted-foreground hover:text-red-500 cursor-pointer"
            onClick={() => {
              if (window.confirm(`¿Deseas eliminar la tabla "${typed.label}"?`)) {
                typed.onRemove?.();
              }
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {typed.columns.length === 0 ? (
        <div className="px-3 py-2 text-muted-foreground text-xs italic">Sin columnas</div>
      ) : (
        <ul className="divide-y divide-border">
          {typed.columns.map((column) => (
            <li
              key={column.id}
              className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs"
            >
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                {column.isPrimaryKey ? (
                  <Key aria-label="Clave primaria" className="h-3 w-3 text-amber-500" />
                ) : null}
                {column.name}
                {!column.isNullable && !column.isPrimaryKey ? (
                  <span aria-label="No nulo" className="text-red-500">
                    *
                  </span>
                ) : null}
              </span>
              <span className="text-muted-foreground">{column.type}</span>
            </li>
          ))}
        </ul>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
