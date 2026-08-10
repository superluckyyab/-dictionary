export interface Definition {
  sense: string;
  example?: string | null;
}

export interface Word {
  id: number;
  word: string;
  part_of_speech?: string | null;
  level?: string | null;
  phonetic?: string | null;
  status: 'known' | 'unknown';
  is_bookmarked: boolean;
  collected_count: number;
  definitions: Definition[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface WordListResponse {
  items: Word[];
  total: number;
  page: number;
  page_size: number;
}

export interface Stats {
  total: number;
  known: number;
  unknown: number;
  bookmarked: number;
  by_level: Record<string, number>;
}

export type TabView = 'all' | 'unknown' | 'known' | 'bookmarked';
export type DefinitionMode = 'hidden' | 'test' | 'shown';
export type SortOption = 'alpha' | 'recent' | 'level';

export interface WordFilters {
  q: string;
  level: string[];
  letter: string;
  sort: SortOption;
}
