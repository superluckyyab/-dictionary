import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { fetchWords, fetchStats, updateWord, createWord, deleteWord, importWords } from '../api/words';
import type { WordsParams, UpdateWordPayload, CreateWordPayload } from '../api/words';
import type { Word } from '../types';

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
    mutationFn: ({ id, data }: { id: number; data: UpdateWordPayload }) => updateWord(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: [WORDS_KEY] });
      const snapshots = qc.getQueriesData<{ items: Word[]; total: number }>({ queryKey: [WORDS_KEY] });
      qc.setQueriesData<{ items: Word[]; total: number }>({ queryKey: [WORDS_KEY] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: data.status ?? w.status,
                  is_bookmarked: data.is_bookmarked ?? w.is_bookmarked,
                }
              : w
          ),
        };
      });
      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshots) {
        for (const [queryKey, snapshot] of context.snapshots) {
          qc.setQueryData(queryKey, snapshot);
        }
      }
    },
    onSettled: () => {
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
    mutationFn: (id: number) => deleteWord(id),
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
