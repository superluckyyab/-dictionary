import { useEffect, useRef } from 'react';
import type { Word, DefinitionMode } from '../types';
import WordRow from './WordRow';

interface Props {
  words: Word[];
  mode: DefinitionMode;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  onToggleStatus: (word: Word) => void;
  onToggleBookmark: (word: Word) => void;
  onDelete: (word: Word) => void;
  canDelete: boolean;
  total: number;
  isLoading?: boolean;
}

export default function WordList({
  words,
  mode,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onToggleStatus,
  onToggleBookmark,
  onDelete,
  canDelete,
  total,
  isLoading,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#8A857B]">
        <div className="w-6 h-6 border-2 border-[#8C2F2A] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading words…</p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#8A857B]">
        <p className="text-4xl mb-3">📖</p>
        <p className="text-sm font-medium">No words found</p>
        <p className="text-xs mt-1">Try adjusting your filters or adding new words</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#D4CBB8] mx-4 mb-4">
      <div className="bg-[#E0D9C8] px-3 py-1.5 flex justify-between items-center">
        <span className="text-xs text-[#8A857B]">{total} words</span>
      </div>
      {words.map((word) => (
        <WordRow
          key={word.id}
          word={word}
          mode={mode}
          onToggleStatus={onToggleStatus}
          onToggleBookmark={onToggleBookmark}
          onDelete={onDelete}
          canDelete={canDelete}
        />
      ))}
      {hasNextPage && (
        <div ref={sentinelRef} className="py-3 text-center text-xs text-[#8A857B]">
          {isFetchingNextPage ? 'Loading more…' : 'Scroll for more'}
        </div>
      )}
    </div>
  );
}
