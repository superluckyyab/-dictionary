import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { fetchWords, fetchStats, updateWord, createWord, deleteWord, importWords } from '../api/supabaseWords';
import type { WordsParams, UpdateWordPayload, CreateWordPayload } from '../api/supabaseWords';

export const WORDS_KEY = 'words';
export const STATS_KEY = 'stats';

export function useWords(params: WordsParams) {
  return useQuery({
    queryKey: [WORDS_KEY, params],
    queryFn: () => fetchWords(params),
    staleTime: 30_000,
  });
}

export function useInfiniteWords(params: Omit<WordsParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: [WORDS_KEY, 'infinite', params],
    queryFn: ({ pageParam = 1 }) => fetchWords({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / (lastPage.page_size || 50));
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: 30_000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: [STATS_KEY],
    queryFn: fetchStats,
    staleTime: 10_000,
  });
}

export function useUpdateWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWordPayload }) => updateWord(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WORDS_KEY] });
      qc.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}

export function useCreateWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWordPayload) => createWord(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WORDS_KEY] });
      qc.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}

export function useDeleteWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WORDS_KEY] });
      qc.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}

export function useImportWords() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importWords(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WORDS_KEY] });
      qc.invalidateQueries({ queryKey: [STATS_KEY] });
    },
  });
}
