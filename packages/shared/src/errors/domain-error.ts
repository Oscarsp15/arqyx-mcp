export type DomainErrorCode =
  | 'CANVAS_NOT_FOUND'
  | 'CANVAS_WRONG_KIND'
  | 'TABLE_DUPLICATE_NAME'
  | 'TABLE_NOT_FOUND'
  | 'COLUMN_DUPLICATE_NAME'
  | 'COLUMN_NOT_FOUND'
  | 'COLUMN_REFERENCED_BY_RELATION'
  | 'RELATION_NOT_FOUND'
  | 'RELATION_DUPLICATE'
  | 'FLOW_NODE_NOT_FOUND'
  | 'FLOW_EDGE_NOT_FOUND'
  | 'FLOW_EDGE_DUPLICATE'
  | 'INVALID_INPUT';

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'DomainError';
  }
}
