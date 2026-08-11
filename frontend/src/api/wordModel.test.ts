import { describe, expect, it } from 'vitest';
import { filterAndPageWords, mergeDictionaryRows } from './wordModel';

const entries = [
  { id: '1', word: 'Apple', part_of_speech: 'noun', cefr_level: 'A1', phonetic: null, definitions: [{ sense: 'fruit' }], created_at: null, updated_at: null },
  { id: '2', word: 'brave', part_of_speech: 'adjective', cefr_level: 'B1', phonetic: null, definitions: [{ sense: 'showing courage' }], created_at: null, updated_at: null },
];

describe('Supabase word model', () => {
  it('merges only the current user state and defaults missing state to unknown', () => {
    const words = mergeDictionaryRows(entries, [{ entry_id: '2', status: 'known', is_bookmarked: true, collect_count: 3 }]);
    expect(words[0]).toMatchObject({ id: '1', level: 'A1', status: 'unknown', is_bookmarked: false, collected_count: 0 });
    expect(words[1]).toMatchObject({ id: '2', status: 'known', is_bookmarked: true, collected_count: 3 });
  });

  it('filters and paginates locally without changing the shared dictionary', () => {
    const words = mergeDictionaryRows(entries, [{ entry_id: '2', status: 'known', is_bookmarked: true, collect_count: 0 }]);
    const result = filterAndPageWords(words, { q: 'bra', level: 'B1', status: 'known', bookmarked: true, page: 1, page_size: 1 });
    expect(result).toMatchObject({ total: 1, page: 1, page_size: 1 });
    expect(result.items.map((word) => word.word)).toEqual(['brave']);
  });
});
