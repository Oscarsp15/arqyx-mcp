import { Handle, type NodeProps, Position } from '@xyflow/react';
import { Key } from 'lucide-react';

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
  columns: readonly TableColumnView[];
};

export function TableNode({ data }: NodeProps) {
  const typed = data as TableNodeData;
  return (
    <div className="min-w-52 rounded-md border border-border bg-background shadow-sm">
      <Handle type="target" position={Position.Left} />
      <div className="border-border border-b bg-muted px-3 py-2">
        <span className="font-medium text-foreground text-sm">{typed.label}</span>
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
