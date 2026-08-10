import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from './hooks/useDebounce';
import { useInfiniteWords, useStats, useUpdateWord, useDeleteWord } from './hooks/useWords';
import type { TabView, DefinitionMode, Word } from './types';
import TopTabs from './components/TopTabs';
import SearchBar from './components/SearchBar';
import LevelFilter from './components/LevelFilter';
import LetterFilter from './components/LetterFilter';
import DefinitionModeToggle from './components/DefinitionModeToggle';
import WordList from './components/WordList';
import AddWordModal from './components/AddWordModal';
import ImportModal from './components/ImportModal';

export default function App() {
  const [tab, setTab] = useState<TabView>('all');
  const [searchInput, setSearchInput] = useState('');
  const [levels, setLevels] = useState<string[]>([]);
  const [letter, setLetter] = useState('All');
  const [defMode, setDefMode] = useState<DefinitionMode>('hidden');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const debouncedQ = useDebounce(searchInput, 250);

  const params = useMemo(() => {
    const p: Record<string, string | boolean | undefined> = {
      sort: 'alpha',
    };
    if (debouncedQ) p.q = debouncedQ;
    if (levels.length > 0) p.level = levels.join(',');
    if (letter && letter !== 'All') p.letter = letter;
    if (tab === 'known') p.status = 'known';
    if (tab === 'unknown') p.status = 'unknown';
    if (tab === 'bookmarked') p.bookmarked = true;
    return p;
  }, [debouncedQ, levels, letter, tab]);

  const { data: statsData } = useStats();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteWords(params);
  const { mutate: updateWord } = useUpdateWord();
  const { mutate: deleteWord } = useDeleteWord();

  const words: Word[] = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );
  const total = data?.pages[0]?.total ?? 0;

  const handleToggleStatus = useCallback(
    (word: Word) => {
      updateWord({ id: word.id, data: { status: word.status === 'known' ? 'unknown' : 'known' } });
    },
    [updateWord]
  );

  const handleToggleBookmark = useCallback(
    (word: Word) => {
      updateWord({ id: word.id, data: { is_bookmarked: !word.is_bookmarked } });
    },
    [updateWord]
  );

  const handleDelete = useCallback(
    (word: Word) => {
      if (confirm(`Delete "${word.word}"?`)) {
        deleteWord(word.id);
      }
    },
    [deleteWord]
  );

  return (
    <div className="min-h-screen bg-[#EAE3D2]">
      <div className="max-w-2xl mx-auto bg-[#EAE3D2]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#EAE3D2] border-b border-[#D4CBB8] shadow-sm">
          <div className="px-4 pt-4 pb-1">
            <h1 className="word-title text-2xl font-bold text-[#2C2A26]">English Dictionary</h1>
            <p className="text-xs text-[#8A857B] mt-0.5">CEFR A1–C2 vocabulary</p>
          </div>
          <TopTabs
            activeTab={tab}
            onTabChange={setTab}
            stats={statsData}
            onAddWord={() => setShowAddModal(true)}
            onImport={() => setShowImportModal(true)}
          />
          <SearchBar value={searchInput} onChange={setSearchInput} />
          <LevelFilter selected={levels} onChange={setLevels} />
          <LetterFilter selected={letter} onChange={setLetter} />

          {/* Stats + mode row */}
          <div className="px-4 py-1.5 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-[#8A857B]">
              {statsData
                ? `${statsData.known} known · ${statsData.unknown} unknown`
                : '…'}
            </p>
            <DefinitionModeToggle mode={defMode} onChange={setDefMode} />
          </div>
        </div>

        {/* Word list */}
        <div className="pt-2">
          <WordList
            words={words}
            mode={defMode}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
            onToggleStatus={handleToggleStatus}
            onToggleBookmark={handleToggleBookmark}
            onDelete={handleDelete}
            total={total}
            isLoading={isLoading}
          />
        </div>
      </div>

      {showAddModal && <AddWordModal onClose={() => setShowAddModal(false)} />}
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}
    </div>
  );
}
