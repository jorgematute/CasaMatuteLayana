import { NextResponse } from 'next/server';
import { getSchema } from '@data/_schema/registry';
import { create, getAll, getById, remove, update } from '@/lib/supabase/database';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface RouteContext { params: Promise<{ collection: string }> }
const success = (data: unknown, status = 200) => NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
const failure = (message: string, status = 500, code = 'DATABASE_ERROR') => NextResponse.json(
  { success: false, error: message, code, timestamp: new Date().toISOString() },
  { status },
);

async function getAuthenticatedClient() {
  const client = await createSupabaseServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  return user && !error ? client : null;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    const { collection } = await context.params;
    if (!getSchema(collection)) return failure('Colección no registrada', 404, 'NOT_FOUND');
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) return success(await getById(client, collection, id));
    const sortBy = url.searchParams.get('sortBy');
    const options = { limit: Number(url.searchParams.get('limit') ?? 50), offset: Number(url.searchParams.get('offset') ?? 0), sortOrder: url.searchParams.get('sortOrder') === 'desc' ? 'desc' as const : 'asc' as const, ...(sortBy ? { sortBy } : {}) };
    return success(await getAll(client, collection, options));
  } catch { return failure('Error en la base de datos'); }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    const { collection } = await context.params;
    const schema = getSchema(collection);
    if (!schema) return failure('Colección no registrada', 404, 'NOT_FOUND');
    const body = await request.json() as Record<string, unknown>;
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = body;
    const parsed = schema.safeParse({ ...input, id: 'request-id', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400, 'VALIDATION_ERROR');
    const { id: _parsedId, createdAt: _parsedCreatedAt, updatedAt: _parsedUpdatedAt, ...createInput } = parsed.data as Record<string, unknown>;
    return success(await create(client, collection, createInput as never), 201);
  } catch { return failure('Error en la base de datos'); }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    const { collection } = await context.params;
    const schema = getSchema(collection);
    if (!schema) return failure('Colección no registrada', 404, 'NOT_FOUND');
    const body = await request.json() as { id?: string; [key: string]: unknown };
    if (!body.id) return failure('El id es obligatorio', 400, 'VALIDATION_ERROR');
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = body;
    const parsed = schema.safeParse({ ...input, id: body.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400, 'VALIDATION_ERROR');
    const { id: _parsedId, createdAt: _parsedCreatedAt, updatedAt: _parsedUpdatedAt, ...updateInput } = parsed.data as Record<string, unknown>;
    return success(await update(client, collection, body.id, updateInput as never));
  } catch { return failure('Error en la base de datos'); }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    const { collection } = await context.params;
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return failure('El id es obligatorio', 400, 'VALIDATION_ERROR');
    await remove(client, collection, id);
    return success({ removed: true });
  } catch { return failure('Error en la base de datos'); }
}
