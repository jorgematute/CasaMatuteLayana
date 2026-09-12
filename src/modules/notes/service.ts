import { create, getAll, getById, remove, update } from '@/lib/json-db';
import type { Note, NoteInput } from './types';

export const listNotes = () => getAll<Note>('note', { limit: 100, sortBy: 'updatedAt', sortOrder: 'desc' });
export const getNote = (id: string) => getById<Note>('note', id);
export const createNote = (input: NoteInput) => create<Note>('note', input);
export const updateNote = (id: string, input: Partial<NoteInput>) => update<Note>('note', id, input);
export const deleteNote = (id: string) => remove('note', id);
