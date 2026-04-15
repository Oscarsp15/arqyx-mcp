import {
  type Column,
  type ColumnId,
  DomainError,
  type ErdCanvas,
  type Relation,
  type RelationKind,
  type SqlType,
  type Table,
  type TableId,
} from '@arqyx/shared';

export type NewTableInput = {
  id: TableId;
  name: string;
  position: { x: number; y: number };
};

export type NewColumnInput = {
  id: ColumnId;
  name: string;
  type: SqlType;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
};

export function createEmptyErdCanvas(id: ErdCanvas['id'], name: string): ErdCanvas {
  return {
    id,
    kind: 'erd',
    name,
    tables: [],
    relations: [],
  };
}

export function addTableToCanvas(canvas: ErdCanvas, input: NewTableInput): ErdCanvas {
  const nameExists = canvas.tables.some((table) => table.name === input.name);
  if (nameExists) {
    throw new DomainError(
      'TABLE_DUPLICATE_NAME',
      `Ya existe una tabla con el nombre "${input.name}" en este lienzo.`,
    );
  }

  const table: Table = {
    id: input.id,
    name: input.name,
    columns: [],
    position: input.position,
  };

  return {
    ...canvas,
    tables: [...canvas.tables, table],
  };
}

export function addColumnToTable(
  canvas: ErdCanvas,
  tableId: TableId,
  input: NewColumnInput,
): ErdCanvas {
  const table = findTable(canvas, tableId);
  const nameExists = table.columns.some((column) => column.name === input.name);
  if (nameExists) {
    throw new DomainError(
      'COLUMN_DUPLICATE_NAME',
      `Ya existe una columna con el nombre "${input.name}" en la tabla "${table.name}".`,
    );
  }

  const column: Column = {
    id: input.id,
    name: input.name,
    type: input.type,
    isPrimaryKey: input.isPrimaryKey,
    isNullable: input.isNullable,
    isUnique: input.isUnique,
  };

  return mapTable(canvas, tableId, (current) => ({
    ...current,
    columns: [...current.columns, column],
  }));
}

export function removeColumnFromTable(
  canvas: ErdCanvas,
  tableId: TableId,
  columnId: ColumnId,
): ErdCanvas {
  const table = findTable(canvas, tableId);
  const column = table.columns.find((candidate) => candidate.id === columnId);
  if (!column) {
    throw new DomainError(
      'COLUMN_NOT_FOUND',
      `No se encontró la columna solicitada en la tabla "${table.name}".`,
    );
  }

  const isReferenced = canvas.relations.some(
    (relation) =>
      (relation.fromTable === tableId && relation.fromColumn === columnId) ||
      (relation.toTable === tableId && relation.toColumn === columnId),
  );
  if (isReferenced) {
    throw new DomainError(
      'COLUMN_REFERENCED_BY_RELATION',
      `La columna "${column.name}" no se puede eliminar porque participa en una relación. Elimina la relación primero.`,
    );
  }

  return mapTable(canvas, tableId, (current) => ({
    ...current,
    columns: current.columns.filter((candidate) => candidate.id !== columnId),
  }));
}

export function moveTableInCanvas(
  canvas: ErdCanvas,
  tableId: TableId,
  position: { x: number; y: number },
): ErdCanvas {
  findTable(canvas, tableId);
  return mapTable(canvas, tableId, (current) => ({
    ...current,
    position: { x: position.x, y: position.y },
  }));
}

export function removeTableFromCanvas(canvas: ErdCanvas, tableId: TableId): ErdCanvas {
  findTable(canvas, tableId);
  return {
    ...canvas,
    tables: canvas.tables.filter((table) => table.id !== tableId),
    relations: canvas.relations.filter(
      (relation) => relation.fromTable !== tableId && relation.toTable !== tableId,
    ),
  };
}

export type NewRelationInput = {
  fromTable: TableId;
  fromColumn: ColumnId;
  toTable: TableId;
  toColumn: ColumnId;
  kind: RelationKind;
};

export function addRelationToCanvas(canvas: ErdCanvas, input: NewRelationInput): ErdCanvas {
  requireColumn(canvas, input.fromTable, input.fromColumn);
  requireColumn(canvas, input.toTable, input.toColumn);

  const alreadyExists = canvas.relations.some((relation) => isSameRelation(relation, input));
  if (alreadyExists) {
    throw new DomainError(
      'RELATION_DUPLICATE',
      'Ya existe una relación con los mismos extremos en este lienzo.',
    );
  }

  const relation: Relation = {
    fromTable: input.fromTable,
    fromColumn: input.fromColumn,
    toTable: input.toTable,
    toColumn: input.toColumn,
    kind: input.kind,
  };

  return {
    ...canvas,
    relations: [...canvas.relations, relation],
  };
}

export function removeRelationFromCanvas(
  canvas: ErdCanvas,
  target: Omit<NewRelationInput, 'kind'>,
): ErdCanvas {
  const exists = canvas.relations.some((relation) => isSameRelationEndpoints(relation, target));
  if (!exists) {
    throw new DomainError(
      'RELATION_NOT_FOUND',
      'No se encontró una relación con los extremos indicados.',
    );
  }

  return {
    ...canvas,
    relations: canvas.relations.filter((relation) => !isSameRelationEndpoints(relation, target)),
  };
}

function isSameRelation(relation: Relation, input: NewRelationInput): boolean {
  return (
    relation.fromTable === input.fromTable &&
    relation.fromColumn === input.fromColumn &&
    relation.toTable === input.toTable &&
    relation.toColumn === input.toColumn
  );
}

function isSameRelationEndpoints(
  relation: Relation,
  target: Omit<NewRelationInput, 'kind'>,
): boolean {
  return (
    relation.fromTable === target.fromTable &&
    relation.fromColumn === target.fromColumn &&
    relation.toTable === target.toTable &&
    relation.toColumn === target.toColumn
  );
}

function requireColumn(canvas: ErdCanvas, tableId: TableId, columnId: ColumnId): Column {
  const table = findTable(canvas, tableId);
  const column = table.columns.find((candidate) => candidate.id === columnId);
  if (!column) {
    throw new DomainError(
      'COLUMN_NOT_FOUND',
      `No se encontró la columna "${columnId}" en la tabla "${table.name}".`,
    );
  }
  return column;
}

function findTable(canvas: ErdCanvas, tableId: TableId): Table {
  const table = canvas.tables.find((candidate) => candidate.id === tableId);
  if (!table) {
    throw new DomainError('TABLE_NOT_FOUND', 'No se encontró la tabla solicitada.');
  }
  return table;
}

function mapTable(
  canvas: ErdCanvas,
  tableId: TableId,
  transform: (table: Table) => Table,
): ErdCanvas {
  return {
    ...canvas,
    tables: canvas.tables.map((table) => (table.id === tableId ? transform(table) : table)),
  };
}
