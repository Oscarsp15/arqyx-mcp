import { randomUUID } from 'node:crypto';

export type IdGenerator = {
  next(): string;
};

export function createUuidGenerator(): IdGenerator {
  return { next: () => randomUUID() };
}

export function createSequentialGenerator(prefix = 'id'): IdGenerator {
  let counter = 0;
  return {
    next: () => {
      counter += 1;
      return `${prefix}-${counter}`;
    },
  };
}
