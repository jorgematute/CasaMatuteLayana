import type { ZodType } from 'zod';
import { exampleRecordSchema } from './example.schema';
import { noteRecordSchema } from './note.schema';

export const schemaRegistry: Record<string, ZodType> = {
  example: exampleRecordSchema,
  note: noteRecordSchema,
};

export function getSchema(collection: string): ZodType | null {
  return schemaRegistry[collection] ?? null;
}
