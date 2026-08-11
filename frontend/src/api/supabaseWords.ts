import { supabase } from '../lib/supabase';
import type { Definition, Stats, Word, WordListResponse } from '../types';
import { filterAndPageWords, mergeDictionaryRows, type DictionaryRow, type UserStateRow } from './wordModel';

export interface WordsParams {
  q?: string;
  level?: string;
  letter?: string;
  status?: string;
  bookmarked?: boolean;
  sort?: string;
  page?: number;
  page_size?: number;
}

async function loadWords(): Promise<Word[]> {
  const [{ data: entries, error: entriesError }, { data: states, error: statesError }] = await Promise.all([
    supabase.from('dictionary_entries').select('id,word,part_of_speech,cefr_level,phonetic,definitions,created_at,updated_at').order('word'),
    supabase.from('user_word_state').select('entry_id,status,is_bookmarked,collect_count'),
  ]);
  if (entriesError) throw entriesError;
  if (statesError) throw statesError;
  return mergeDictionaryRows((entries ?? []) as DictionaryRow[], (states ?? []) as UserStateRow[]);
}

export async function fetchWords(params: WordsParams): Promise<WordListResponse> {
  return filterAndPageWords(await loadWords(), params);
}

export async function fetchStats(): Promise<Stats> {
  const words = await loadWords();
  return {
    total: words.length,
    known: words.filter((word) => word.status === 'known').length,
    unknown: words.filter((word) => word.status === 'unknown').length,
    bookmarked: words.filter((word) => word.is_bookmarked).length,
    by_level: words.reduce<Record<string, number>>((counts, word) => {
      if (word.level) counts[word.level] = (counts[word.level] ?? 0) + 1;
      return counts;
    }, {}),
  };
}

export interface CreateWordPayload {
  word: string;
  part_of_speech?: string;
  level?: string;
  phonetic?: string;
  definitions?: Definition[];
}

export async function createWord(payload: CreateWordPayload): Promise<Word> {
  const { data, error } = await supabase.from('dictionary_entries').insert({
    word: payload.word.trim(),
    part_of_speech: payload.part_of_speech || null,
    cefr_level: payload.level || null,
    phonetic: payload.phonetic || null,
    definitions: payload.definitions ?? [],
  }).select('id,word,part_of_speech,cefr_level,phonetic,definitions,created_at,updated_at').single();
  if (error) throw error;
  return mergeDictionaryRows([data as DictionaryRow], [])[0];
}

export interface UpdateWordPayload {
  status?: 'known' | 'unknown';
  is_bookmarked?: boolean;
  level?: string;
  definitions?: Definition[];
  word?: string;
  part_of_speech?: string;
  phonetic?: string;
}

export async function updateWord(id: string, payload: UpdateWordPayload): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw authError ?? new Error('Authentication required');
  const state: Record<string, unknown> = { user_id: authData.user.id, entry_id: id };
  if (payload.status !== undefined) state.status = payload.status;
  if (payload.is_bookmarked !== undefined) state.is_bookmarked = payload.is_bookmarked;
  if (Object.keys(state).length > 2) {
    const { error } = await supabase.from('user_word_state').upsert(state, { onConflict: 'user_id,entry_id' });
    if (error) throw error;
  }

  const shared: Record<string, unknown> = {};
  if (payload.word !== undefined) shared.word = payload.word.trim();
  if (payload.part_of_speech !== undefined) shared.part_of_speech = payload.part_of_speech || null;
  if (payload.level !== undefined) shared.cefr_level = payload.level || null;
  if (payload.phonetic !== undefined) shared.phonetic = payload.phonetic || null;
  if (payload.definitions !== undefined) shared.definitions = payload.definitions;
  if (Object.keys(shared).length) {
    const { error } = await supabase.from('dictionary_entries').update(shared).eq('id', id);
    if (error) throw error;
  }
}

export async function deleteWord(id: string): Promise<void> {
  const { error } = await supabase.from('dictionary_entries').delete().eq('id', id);
  if (error) throw error;
}

function parseCsv(text: string): CreateWordPayload[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    return { word: row.word, part_of_speech: row.part_of_speech, level: row.level, phonetic: row.phonetic, definitions: row.definition ? [{ sense: row.definition, example: row.example || null }] : [] };
  }).filter((row) => row.word);
}

export async function importWords(file: File): Promise<{ inserted: number; updated: number; total: number }> {
  const text = await file.text();
  const raw = file.name.toLowerCase().endsWith('.json') ? JSON.parse(text) : parseCsv(text);
  const rows: CreateWordPayload[] = Array.isArray(raw) ? raw : [];
  if (!rows.length) return { inserted: 0, updated: 0, total: 0 };
  const payload = rows.map((row) => ({ word: row.word.trim(), part_of_speech: row.part_of_speech || null, cefr_level: row.level || null, phonetic: row.phonetic || null, definitions: row.definitions ?? [] }));
  const { error } = await supabase.from('dictionary_entries').upsert(payload, { onConflict: 'word,part_of_speech' });
  if (error) throw error;
  return { inserted: payload.length, updated: 0, total: payload.length };
}
