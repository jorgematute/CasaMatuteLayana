import type { BaseRecord } from '@/lib/types';

export type NoteCategory = 'general' | 'importante' | 'pendiente';
export interface Note extends BaseRecord { title: string; content: string; category: NoteCategory; pinned: boolean }
export type NoteInput = Omit<Note, keyof BaseRecord>;
