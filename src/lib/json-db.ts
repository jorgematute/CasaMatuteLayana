import { mkdir, readFile, rename, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import type { CollectionFile, CreateInput, QueryOptions, QueryResult, UpdateInput, BaseRecord } from './types';
import { generateId, now } from './utils';

export class JsonDBError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'DUPLICATE_ID' | 'VALIDATION_ERROR' | 'IO_ERROR' | 'READ_ONLY', message: string) {
    super(message);
    this.name = 'JsonDBError';
  }
}

const locks = new Map<string, Promise<void>>();
const dataRoot = path.resolve(/* turbopackIgnore: true */ process.env.DATA_DIR ?? './data');

function resolveCollectionPath(name: string): string {
  if (!/^[a-z0-9-]+$/.test(name)) throw new JsonDBError('VALIDATION_ERROR', 'Nombre de colección inválido');
  return path.join(dataRoot, `${name}.json`);
}

async function readCollection<T extends BaseRecord>(name: string): Promise<CollectionFile<T>> {
  try {
    const raw = await readFile(resolveCollectionPath(name), 'utf8');
    return JSON.parse(raw) as CollectionFile<T>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new JsonDBError('NOT_FOUND', `Colección no encontrada: ${name}`);
    throw new JsonDBError('IO_ERROR', 'No se pudo leer la colección');
  }
}

async function writeCollection<T extends BaseRecord>(name: string, data: CollectionFile<T>): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new JsonDBError('READ_ONLY', 'Las escrituras están deshabilitadas en producción');
  const filePath = resolveCollectionPath(name);
  const previous = locks.get(name) ?? Promise.resolve();
  const next = previous.then(async () => {
    await mkdir(path.join(dataRoot, '_backups'), { recursive: true });
    try { await copyFile(filePath, path.join(dataRoot, '_backups', `${name}_${Date.now()}.json`)); } catch { /* first write */ }
    const temporary = `${filePath}.tmp`;
    await writeFile(temporary, JSON.stringify({ ...data, _meta: { ...data._meta, lastModified: now() } }, null, 2), 'utf8');
    await rename(temporary, filePath);
  });
  locks.set(name, next);
  try { await next; } finally { if (locks.get(name) === next) locks.delete(name); }
}

export async function getAll<T extends BaseRecord>(name: string, options: QueryOptions = {}): Promise<QueryResult<T>> {
  const collection = await readCollection<T>(name);
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.max(1, options.limit ?? 50);
  const sorted = [...collection.records];
  if (options.sortBy) {
    const sortBy = options.sortBy as keyof T;
    sorted.sort((a, b) => String(a[sortBy]).localeCompare(String(b[sortBy])) * (options.sortOrder === 'desc' ? -1 : 1));
  }
  return { data: sorted.slice(offset, offset + limit), total: sorted.length, limit, offset };
}

export async function getById<T extends BaseRecord>(name: string, id: string): Promise<T | null> {
  const collection = await readCollection<T>(name);
  return collection.records.find((record) => record.id === id) ?? null;
}

export async function create<T extends BaseRecord>(name: string, input: CreateInput<T>): Promise<T> {
  const collection = await readCollection<T>(name);
  const record = { ...input, id: generateId(name.slice(0, 3)), createdAt: now(), updatedAt: now() } as T;
  collection.records.push(record);
  await writeCollection(name, collection);
  return record;
}

export async function update<T extends BaseRecord>(name: string, id: string, partial: UpdateInput<T>): Promise<T> {
  const collection = await readCollection<T>(name);
  const index = collection.records.findIndex((record) => record.id === id);
  if (index < 0) throw new JsonDBError('NOT_FOUND', `Registro no encontrado: ${id}`);
  const current = collection.records[index];
  if (!current) throw new JsonDBError('NOT_FOUND', `Registro no encontrado: ${id}`);
  const record = { ...current, ...partial, id, updatedAt: now() } as T;
  collection.records[index] = record;
  await writeCollection(name, collection);
  return record;
}

export async function remove(name: string, id: string): Promise<boolean> {
  const collection = await readCollection(name);
  const next = collection.records.filter((record) => record.id !== id);
  if (next.length === collection.records.length) throw new JsonDBError('NOT_FOUND', `Registro no encontrado: ${id}`);
  collection.records = next;
  await writeCollection(name, collection);
  return true;
}

export async function query<T extends BaseRecord>(name: string, filter: (record: T) => boolean): Promise<T[]> {
  const collection = await readCollection<T>(name);
  return collection.records.filter(filter);
}

export async function count(name: string): Promise<number> {
  const collection = await readCollection(name);
  return collection.records.length;
}
