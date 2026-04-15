import type { Column, ErdCanvas, SqlType, Table } from '@arqyx/shared';

const postgresTypeMap: Record<SqlType, string> = {
  uuid: 'UUID',
  int: 'INTEGER',
  bigint: 'BIGINT',
  text: 'TEXT',
  varchar: 'VARCHAR',
  boolean: 'BOOLEAN',
  timestamp: 'TIMESTAMP',
  date: 'DATE',
  numeric: 'NUMERIC',
  json: 'JSONB',
};

export function generatePostgresDdl(canvas: ErdCanvas): string {
  const statements: string[] = [];

  for (const table of canvas.tables) {
    statements.push(generateTable(table, canvas));
  }

  return statements.join('\n\n');
}

function generateTable(table: Table, canvas: ErdCanvas): string {
  const lines: string[] = [];
  lines.push(`CREATE TABLE "${table.name}" (`);

  const columnLines: string[] = [];

  for (const column of table.columns) {
    columnLines.push(`  ${generateColumn(column)}`);
  }

  // Find relations where this table is the "fromTable" (where the foreign key resides)
  const fks = canvas.relations.filter((r) => r.fromTable === table.id);
  for (const fk of fks) {
    const parentTable = canvas.tables.find((t) => t.id === fk.toTable);
    const parentColumn = parentTable?.columns.find((c) => c.id === fk.toColumn);
    const childColumn = table.columns.find((c) => c.id === fk.fromColumn);

    if (parentTable && parentColumn && childColumn) {
      columnLines.push(
        `  FOREIGN KEY ("${childColumn.name}") REFERENCES "${parentTable.name}" ("${parentColumn.name}")`,
      );
    }
  }

  lines.push(columnLines.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

function generateColumn(column: Column): string {
  const parts: string[] = [`"${column.name}"`, postgresTypeMap[column.type]];

  if (column.isPrimaryKey) {
    parts.push('PRIMARY KEY');
  }

  if (!column.isNullable && !column.isPrimaryKey) {
    parts.push('NOT NULL');
  }

  if (column.isUnique && !column.isPrimaryKey) {
    parts.push('UNIQUE');
  }

  return parts.join(' ');
}
