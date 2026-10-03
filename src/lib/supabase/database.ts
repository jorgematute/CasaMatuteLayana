import type { SupabaseClient } from '@supabase/supabase-js';
import type { BaseRecord, CreateInput, QueryOptions, QueryResult, UpdateInput } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface StoredRecord {
  id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function toRecord<T extends BaseRecord>(row: StoredRecord): T {
  return { ...row.data, id: row.id, createdAt: row.created_at, updatedAt: row.updated_at } as T;
}

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function getAll<T extends BaseRecord>(client: SupabaseClient, collection: string, options: QueryOptions = {}): Promise<QueryResult<T>> {
  const { data, error } = await client.from('app_records').select('id,data,created_at,updated_at').eq('collection', collection);
  throwIfError(error);

  const records = ((data ?? []) as StoredRecord[]).map(toRecord<T>);
  if (options.sortBy) {
    const sortBy = options.sortBy as keyof T;
    records.sort((left, right) => String(left[sortBy]).localeCompare(String(right[sortBy])) * (options.sortOrder === 'desc' ? -1 : 1));
  }

  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.max(1, options.limit ?? 50);
  return { data: records.slice(offset, offset + limit), total: records.length, limit, offset };
}

export async function getById<T extends BaseRecord>(client: SupabaseClient, collection: string, id: string): Promise<T | null> {
  const { data, error } = await client.from('app_records').select('id,data,created_at,updated_at').eq('collection', collection).eq('id', id).maybeSingle();
  throwIfError(error);
  return data ? toRecord<T>(data as StoredRecord) : null;
}

export async function create<T extends BaseRecord>(client: SupabaseClient, collection: string, input: CreateInput<T>): Promise<T> {
  const id = generateId(collection.slice(0, 3));
  const { data, error } = await client.from('app_records').insert({ id, collection, data: input }).select('id,data,created_at,updated_at').single();
  throwIfError(error);
  return toRecord<T>(data as StoredRecord);
}

export async function update<T extends BaseRecord>(client: SupabaseClient, collection: string, id: string, partial: UpdateInput<T>): Promise<T> {
  const current = await getById<T>(client, collection, id);
  if (!current) throw new Error('Registro no encontrado');

  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...currentData } = current;
  const { data, error } = await client.from('app_records')
    .update({ data: { ...currentData, ...partial }, updated_at: new Date().toISOString() })
    .eq('collection', collection)
    .eq('id', id)
    .select('id,data,created_at,updated_at')
    .single();
  throwIfError(error);
  return toRecord<T>(data as StoredRecord);
}

export async function remove(client: SupabaseClient, collection: string, id: string): Promise<boolean> {
  const { data, error } = await client.from('app_records').delete().eq('collection', collection).eq('id', id).select('id').maybeSingle();
  throwIfError(error);
  if (!data) throw new Error('Registro no encontrado');
  return true;
}

export async function count(client: SupabaseClient, collection: string): Promise<number> {
  const { count: total, error } = await client.from('app_records').select('id', { count: 'exact', head: true }).eq('collection', collection);
  throwIfError(error);
  return total ?? 0;
}