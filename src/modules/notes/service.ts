import { createSupabaseServerClient } from '@/lib/supabase/server';
import { create, getAll, getById, remove, update } from '@/lib/supabase/database';
import type { Note, NoteInput } from './types';

export async function listNotes() {
	return getAll<Note>(await createSupabaseServerClient(), 'note', { limit: 100, sortBy: 'updatedAt', sortOrder: 'desc' });
}

export async function getNote(id: string) {
	return getById<Note>(await createSupabaseServerClient(), 'note', id);
}

export async function createNote(input: NoteInput) {
	return create<Note>(await createSupabaseServerClient(), 'note', input);
}

export async function updateNote(id: string, input: Partial<NoteInput>) {
	return update<Note>(await createSupabaseServerClient(), 'note', id, input);
}

export async function deleteNote(id: string) {
	return remove(await createSupabaseServerClient(), 'note', id);
}
