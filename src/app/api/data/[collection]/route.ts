import { NextResponse } from 'next/server';
import { getSchema } from '@data/_schema/registry';
import { create, getAll, getById, remove, update, JsonDBError } from '@/lib/json-db';

interface RouteContext { params: Promise<{ collection: string }> }
const success = (data: unknown, status = 200) => NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
const failure = (error: unknown) => {
  const dbError = error instanceof JsonDBError ? error : null;
  const status = dbError?.code === 'NOT_FOUND' ? 404 : dbError?.code === 'READ_ONLY' ? 503 : 400;
  return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error interno', code: dbError?.code ?? 'INTERNAL', timestamp: new Date().toISOString() }, { status });
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { collection } = await context.params;
    if (!getSchema(collection)) return failure(new JsonDBError('NOT_FOUND', 'Colección no registrada'));
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) return success(await getById(collection, id));
    return success(await getAll(collection, { limit: Number(url.searchParams.get('limit') ?? 50), offset: Number(url.searchParams.get('offset') ?? 0), sortBy: url.searchParams.get('sortBy') ?? undefined, sortOrder: url.searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc' }));
  } catch (error) { return failure(error); }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { collection } = await context.params;
    const schema = getSchema(collection);
    if (!schema) return failure(new JsonDBError('NOT_FOUND', 'Colección no registrada'));
    const body = await request.json() as Record<string, unknown>;
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = body;
    const parsed = schema.safeParse({ ...input, id: 'request-id', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    if (!parsed.success) return failure(new JsonDBError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos'));
    const { id: _parsedId, createdAt: _parsedCreatedAt, updatedAt: _parsedUpdatedAt, ...createInput } = parsed.data as Record<string, unknown>;
    return success(await create(collection, createInput as never), 201);
  } catch (error) { return failure(error); }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { collection } = await context.params;
    const schema = getSchema(collection);
    if (!schema) return failure(new JsonDBError('NOT_FOUND', 'Colección no registrada'));
    const body = await request.json() as { id?: string; [key: string]: unknown };
    if (!body.id) return failure(new JsonDBError('VALIDATION_ERROR', 'El id es obligatorio'));
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = body;
    const parsed = schema.safeParse({ ...input, id: body.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    if (!parsed.success) return failure(new JsonDBError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos'));
    const { id: _parsedId, createdAt: _parsedCreatedAt, updatedAt: _parsedUpdatedAt, ...updateInput } = parsed.data as Record<string, unknown>;
    return success(await update(collection, body.id, updateInput as never));
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { collection } = await context.params;
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return failure(new JsonDBError('VALIDATION_ERROR', 'El id es obligatorio'));
    await remove(collection, id);
    return success({ removed: true });
  } catch (error) { return failure(error); }
}
