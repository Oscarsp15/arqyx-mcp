import type { SqlType } from '@arqyx/shared';
import { ChevronDown, Key, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

// §22.7: dropdown custom con button + div posicionado
type TypeSelectProps = {
  value: SqlType;
  onChange: (value: SqlType) => void;
};

function TypeSelect({ value, onChange }: TypeSelectProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // null = cerrado, {top, left, width} = abierto con posición calculada
  const [dropdown, setDropdown] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const isOpen = dropdown !== null;

  const openDropdown = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdown({ top: rect.bottom + 2, left: rect.left, width: rect.width });
  };

  const closeDropdown = () => setDropdown(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = () => setDropdown(null);
    // Cerrar al hacer click fuera del dropdown
    const handleMouseDown = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    // Cerrar al mover el canvas (wheel)
    const handleWheel = () => close();
    // Cerrar al arrastrar (drag) fuera del dropdown - detecta drag de la tabla
    const handleDrag = (e: PointerEvent) => {
      // Solo cierra si se está arrastrando (botón presionado) y fuera del dropdown
      if (
        e.buttons > 0 &&
        listRef.current &&
        !listRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('wheel', handleWheel, { passive: true });
    document.addEventListener('pointermove', handleDrag);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('wheel', handleWheel);
      document.removeEventListener('pointermove', handleDrag);
    };
  }, [isOpen]);

  const handleSelect = (type: SqlType) => {
    onChange(type);
    closeDropdown();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        className="nodrag nowheel flex w-[85px] cursor-pointer items-center justify-between rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground outline-none transition-colors hover:bg-muted focus:ring-1 focus:ring-primary"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {value}
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={listRef}
            style={{ top: dropdown.top, left: dropdown.left, width: dropdown.width }}
            className="nodrag nowheel fixed z-50 flex flex-col rounded border border-border bg-background py-1 shadow-lg"
          >
            {SQL_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleSelect(t)}
                className={`cursor-pointer px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted ${
                  t === value ? 'bg-muted font-medium text-foreground' : 'text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

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
            // color semáforo: clave primaria
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
            <TypeSelect
              value={column.type}
              onChange={(newType) => onEditColumn(column.id, { colType: newType })}
            />
          ) : (
            <span className="text-muted-foreground">{column.type}</span>
          )}
          {onRemoveColumn && (
            <button
              type="button"
              // color semáforo: acción destructiva
              className="nodrag nowheel cursor-pointer text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
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
