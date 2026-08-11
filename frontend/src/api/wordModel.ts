import type { Word, WordListResponse } from '../types';

type FilterParams = {
  q?: string;
  level?: string;
  letter?: string;
  status?: string;
  bookmarked?: boolean;
  page?: number;
  page_size?: number;
};

export type DictionaryRow = {
  id: string;
  word: string;
  part_of_speech: string | null;
  cefr_level: string | null;
  phonetic: string | null;
  definitions: Word['definitions'] | null;
  created_at: string | null;
  updated_at: string | null;
};

export type UserStateRow = {
  entry_id: string;
  status: 'known' | 'unknown' | null;
  is_bookmarked: boolean | null;
  collect_count: number | null;
};

export function mergeDictionaryRows(entries: DictionaryRow[], states: UserStateRow[]): Word[] {
  const stateByEntry = new Map(states.map((state) => [state.entry_id, state]));
  return entries.map((entry) => {
    const state = stateByEntry.get(entry.id);
    return {
      id: entry.id,
      word: entry.word,
      part_of_speech: entry.part_of_speech,
      level: entry.cefr_level,
      phonetic: entry.phonetic,
      definitions: Array.isArray(entry.definitions) ? entry.definitions : [],
      status: state?.status === 'known' ? 'known' : 'unknown',
      is_bookmarked: Boolean(state?.is_bookmarked),
      collected_count: state?.collect_count ?? 0,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    };
  });
}

export function filterAndPageWords(words: Word[], params: FilterParams): WordListResponse {
  const levels = params.level?.split(',').filter(Boolean) ?? [];
  const query = params.q?.trim().toLocaleLowerCase();
  const filtered = words.filter((word) => {
    if (query && !word.word.toLocaleLowerCase().includes(query)) return false;
    if (levels.length && (!word.level || !levels.includes(word.level))) return false;
    if (params.letter && params.letter !== 'All' && !word.word.toLocaleUpperCase().startsWith(params.letter.toLocaleUpperCase())) return false;
    if (params.status && word.status !== params.status) return false;
    if (params.bookmarked && !word.is_bookmarked) return false;
    return true;
  });

  filtered.sort((left, right) => left.word.localeCompare(right.word, 'en', { sensitivity: 'base' }));
  const page = params.page ?? 1;
  const pageSize = params.page_size ?? 50;
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, page_size: pageSize };
}
