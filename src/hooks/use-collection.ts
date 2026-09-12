'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BaseRecord, CreateInput, UpdateInput } from '@/lib/types';

export function useCollection<T extends BaseRecord>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/data/${collectionName}`);
      const payload = await response.json() as { success: boolean; data?: { data: T[] }; error?: string };
      if (!payload.success) throw new Error(payload.error ?? 'No se pudo cargar la colección');
      setData(payload.data?.data ?? []);
      setError(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado'); }
    finally { setIsLoading(false); }
  }, [collectionName]);
  useEffect(() => { void refetch(); }, [refetch]);
  const mutate = async (method: 'POST' | 'PUT' | 'DELETE', body?: unknown, id?: string) => {
    const response = await fetch(`/api/data/${collectionName}${id ? `?id=${id}` : ''}`, { method, headers: { 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const payload = await response.json() as { success: boolean; data: T; error?: string };
    if (!payload.success) throw new Error(payload.error ?? 'La operación falló');
    await refetch();
    return payload.data;
  };
  return { data, isLoading, error, refetch, create: (input: CreateInput<T>) => mutate('POST', input) as Promise<T>, update: (id: string, partial: UpdateInput<T>) => mutate('PUT', { id, ...partial }) as Promise<T>, remove: async (id: string) => { await mutate('DELETE', undefined, id); return true; } };
}
