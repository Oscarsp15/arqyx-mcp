import type { SqlType } from '@arqyx/shared';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import { Key, Plus, X } from 'lucide-react';
import { useState } from 'react';

const SQL_TYPES: SqlType[] = [
  'uuid',
  'int',
  'bigint',
  'text',
  'varchar',
  'boolean',
  'timestamp',
  'date',
  'numeric',
  'json',
];

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

type ColumnRowProps = {
  column: TableColumnView;
  onRenameColumn?: (columnId: string, newName: string) => void;
  onEditColumn?: (columnId: string, patch: { colType?: SqlType }) => void;
  onRemoveColumn?: (columnId: string) => void;
};

function ColumnRow({ column, onRenameColumn, onEditColumn, onRemoveColumn }: ColumnRowProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(column.name);

  const submitNameEdit = () => {
    setIsEditingName(false);
    const trimmed = nameValue.trim();
    if (trimmed !== column.name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
      onRenameColumn?.(column.id, trimmed);
    } else {
      setNameValue(column.name);
    }
  };

  return (
    <li className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs group">
      <span className="flex items-center gap-1.5 font-medium text-foreground min-w-0 flex-1">
        {column.isPrimaryKey ? (
          <Key aria-label="Clave primaria" className="h-3 w-3 shrink-0 text-amber-500" />
        ) : null}
        {isEditingName ? (
          <input
            className="nodrag nowheel w-full bg-background px-1 py-0.5 outline-none ring-1 ring-ring text-xs"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={submitNameEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitNameEdit();
              if (e.key === 'Escape') {
                setNameValue(column.name);
                setIsEditingName(false);
              }
            }}
            // biome-ignore lint/a11y/noAutofocus: input inline editing demands immediate focus
            autoFocus
          />
        ) : (
          <span
            className="truncate cursor-text"
            onDoubleClick={() => {
              setNameValue(column.name);
              setIsEditingName(true);
            }}
          >
            {column.name}
            {!column.isNullable && !column.isPrimaryKey ? (
              <span aria-label="No nulo" className="ml-0.5 text-red-500">
                *
              </span>
            ) : null}
          </span>
        )}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        {onEditColumn ? (
          <select
            className="nodrag nowheel bg-transparent text-muted-foreground text-xs cursor-pointer outline-none hover:text-foreground"
            value={column.type}
            onChange={(e) => onEditColumn(column.id, { colType: e.target.value as SqlType })}
          >
            {SQL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-muted-foreground">{column.type}</span>
        )}
        {onRemoveColumn && (
          <button
            type="button"
            className="nodrag opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 cursor-pointer transition-opacity"
            onClick={() => {
              if (window.confirm(`¿Eliminar la columna "${column.name}"?`)) {
                onRemoveColumn(column.id);
              }
            }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </li>
  );
}

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
        <div className="border-border border-t px-3 py-1.5">
          <button
            type="button"
            className="nodrag flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs cursor-pointer transition-colors"
            onClick={handleAddColumn}
          >
            <Plus className="h-3 w-3" />
            Añadir columna
          </button>
        </div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
