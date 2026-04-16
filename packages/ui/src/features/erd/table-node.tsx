import type { SqlType } from '@arqyx/shared';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { ColumnRow } from './column-row.js';
import { ConfirmDialog } from './confirm-dialog.js';

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
  onAddColumn?: (name: string, colType: SqlType) => void;
  onRenameColumn?: (columnId: string, newName: string) => void;
  onEditColumn?: (columnId: string, patch: { colType?: SqlType }) => void;
  onRemoveColumn?: (columnId: string) => void;
  columns: readonly TableColumnView[];
};

export function TableNode({ data }: NodeProps) {
  const typed = data as TableNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(typed.label);
  const [confirmRemoveTable, setConfirmRemoveTable] = useState(false);

  const handleEditSubmit = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed !== typed.label && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
      typed.onRename?.(trimmed);
    } else {
      setEditValue(typed.label);
    }
  };

  const handleAddColumn = () => {
    const existing = typed.columns.map((c) => c.name);
    let index = 1;
    let name = `nueva_col_${index}`;
    while (existing.includes(name)) {
      index++;
      name = `nueva_col_${index}`;
    }
    typed.onAddColumn?.(name, 'varchar');
  };

  return (
    <>
      <div className="min-w-52 rounded-md border border-border bg-background shadow-sm">
        <Handle type="target" position={Position.Left} />
        <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-2">
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
              className="text-sm font-medium text-foreground"
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
              // color semáforo: acción destructiva
              className="nodrag nowheel ml-2 cursor-pointer text-muted-foreground hover:text-red-500"
              onClick={() => setConfirmRemoveTable(true)}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {typed.columns.length === 0 ? (
          <div className="px-3 py-2 text-xs italic text-muted-foreground">Sin columnas</div>
        ) : (
          <ul className="divide-y divide-border">
            {typed.columns.map((column) => (
              <ColumnRow
                key={column.id}
                column={column}
                {...(typed.onRenameColumn ? { onRenameColumn: typed.onRenameColumn } : {})}
                {...(typed.onEditColumn ? { onEditColumn: typed.onEditColumn } : {})}
                {...(typed.onRemoveColumn ? { onRemoveColumn: typed.onRemoveColumn } : {})}
              />
            ))}
          </ul>
        )}
        {typed.onAddColumn && (
          <div className="border-t border-border px-3 py-1.5">
            <button
              type="button"
              className="nodrag nowheel flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={handleAddColumn}
            >
              <Plus className="h-3 w-3" />
              Añadir columna
            </button>
          </div>
        )}
        <Handle type="source" position={Position.Right} />
      </div>
      {confirmRemoveTable && typed.onRemove && (
        <ConfirmDialog
          message={`¿Deseas eliminar la tabla "${typed.label}"?`}
          confirmLabel="Eliminar tabla"
          onConfirm={() => {
            setConfirmRemoveTable(false);
            typed.onRemove?.();
          }}
          onCancel={() => setConfirmRemoveTable(false)}
        />
      )}
    </>
  );
}
