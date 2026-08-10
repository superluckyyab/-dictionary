import { api } from './client';
import type { Word, WordListResponse, Stats, Definition } from '../types';

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

export const fetchWords = async (params: WordsParams): Promise<WordListResponse> => {
  const clean: Record<string, string | number | boolean> = {};
  if (params.q) clean.q = params.q;
  if (params.level) clean.level = params.level;
  if (params.letter && params.letter !== 'All') clean.letter = params.letter;
  if (params.status) clean.status = params.status;
  if (params.bookmarked) clean.bookmarked = true;
  if (params.sort) clean.sort = params.sort;
  clean.page = params.page ?? 1;
  clean.page_size = params.page_size ?? 50;
  const res = await api.get<WordListResponse>('/words', { params: clean });
  return res.data;
};

export const fetchWord = async (id: number): Promise<Word> => {
  const res = await api.get<Word>(`/words/${id}`);
  return res.data;
};

export interface CreateWordPayload {
  word: string;
  part_of_speech?: string;
  level?: string;
  phonetic?: string;
  definitions?: Definition[];
}

export const createWord = async (data: CreateWordPayload): Promise<Word> => {
  const res = await api.post<Word>('/words', data);
  return res.data;
};

export interface UpdateWordPayload {
  status?: 'known' | 'unknown';
  is_bookmarked?: boolean;
  level?: string;
  definitions?: Definition[];
  word?: string;
  part_of_speech?: string;
  phonetic?: string;
}

export const updateWord = async (id: number, data: UpdateWordPayload): Promise<Word> => {
  const res = await api.patch<Word>(`/words/${id}`, data);
  return res.data;
};

export const deleteWord = async (id: number): Promise<void> => {
  await api.delete(`/words/${id}`);
};

export const fetchStats = async (): Promise<Stats> => {
  const res = await api.get<Stats>('/stats');
  return res.data;
};

export const importWords = async (file: File): Promise<{ inserted: number; updated: number; total: number }> => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
