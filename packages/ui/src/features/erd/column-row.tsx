import type { SqlType } from '@arqyx/shared';
import { Key, X } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from './confirm-dialog.js';
import type { TableColumnView } from './table-node.js';

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

export type ColumnRowProps = {
  column: TableColumnView;
  onRenameColumn?: (columnId: string, newName: string) => void;
  onEditColumn?: (columnId: string, patch: { colType?: SqlType }) => void;
  onRemoveColumn?: (columnId: string) => void;
};

export function ColumnRow({
  column,
  onRenameColumn,
  onEditColumn,
  onRemoveColumn,
}: ColumnRowProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(column.name);
  const [confirmRemove, setConfirmRemove] = useState(false);

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
    <>
      <li className="group flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 font-medium text-foreground">
          {column.isPrimaryKey ? (
            <Key aria-label="Clave primaria" className="h-3 w-3 shrink-0 text-amber-500" />
          ) : null}
          {isEditingName ? (
            <input
              className="nodrag nowheel w-full bg-background px-1 py-0.5 text-xs outline-none ring-1 ring-ring"
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
              className="cursor-text truncate"
              onDoubleClick={() => {
                setNameValue(column.name);
                setIsEditingName(true);
              }}
            >
              {column.name}
              {!column.isNullable && !column.isPrimaryKey ? (
                // color semáforo: campo obligatorio
                <span aria-label="No nulo" className="ml-0.5 text-red-500">
                  *
                </span>
              ) : null}
            </span>
          )}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {onEditColumn ? (
            <select
              className="nodrag nowheel cursor-pointer rounded border border-border bg-background px-1 py-0.5 text-xs text-muted-foreground outline-none hover:text-foreground"
              value={column.type}
              onChange={(e) => onEditColumn(column.id, { colType: e.target.value as SqlType })}
            >
              {SQL_TYPES.map((t) => (
                <option key={t} value={t} className="bg-background text-foreground">
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
              // color semáforo: acción destructiva
              className="nodrag cursor-pointer text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              onClick={() => setConfirmRemove(true)}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </li>
      {confirmRemove && onRemoveColumn && (
        <ConfirmDialog
          message={`¿Eliminar la columna "${column.name}"?`}
          confirmLabel="Eliminar columna"
          onConfirm={() => {
            setConfirmRemove(false);
            onRemoveColumn(column.id);
          }}
          onCancel={() => setConfirmRemove(false)}
        />
      )}
    </>
  );
}
