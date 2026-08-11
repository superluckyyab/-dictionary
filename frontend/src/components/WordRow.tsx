import { useState } from 'react';
import type { Word, DefinitionMode } from '../types';
import LevelBadge from './LevelBadge';
import WordDetail from './WordDetail';

interface Props {
  word: Word;
  mode: DefinitionMode;
  onToggleStatus: (word: Word) => void;
  onToggleBookmark: (word: Word) => void;
  onDelete: (word: Word) => void;
  canDelete: boolean;
}

function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find((v) => v.lang.startsWith('en'));
  if (enVoice) utt.voice = enVoice;
  window.speechSynthesis.speak(utt);
}

export default function WordRow({ word, mode, onToggleStatus, onToggleBookmark, onDelete, canDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isKnown = word.status === 'known';

  const autoExpanded = mode === 'shown' || mode === 'test';
  const showExpanded = expanded || autoExpanded;

  return (
    <div className={`border-b border-[#D4CBB8] last:border-b-0 ${isKnown ? 'bg-[#F5F9F2]' : 'bg-[#F2EDE0]'}`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Expand arrow */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`text-[#8A857B] hover:text-[#2C2A26] transition-all text-sm w-4 shrink-0 ${
            showExpanded ? 'rotate-90' : ''
          } transition-transform`}
          aria-label="Toggle definition"
        >
          ▶
        </button>

        {/* Word + pos */}
        <div className="flex items-baseline gap-2 flex-1 min-w-0">
          <span
            className={`word-title font-bold text-base truncate ${
              isKnown ? 'text-[#4F7A3F]' : 'text-[#2C2A26]'
            }`}
          >
            {word.word}
          </span>
          {word.part_of_speech && (
            <span className="text-[#8A857B] text-xs italic shrink-0">{word.part_of_speech}</span>
          )}
          {word.collected_count > 1 && (
            <span className="text-[#8C2F2A] text-[10px] font-medium shrink-0">
              collected ×{word.collected_count}
            </span>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Known/Unknown toggle */}
          <button
            onClick={() => onToggleStatus(word)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              isKnown ? 'bg-[#4F7A3F]' : 'bg-[#C8BFA8]'
            }`}
            title={isKnown ? 'Mark as unknown' : 'Mark as known'}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all flex items-center justify-center text-[9px] font-bold ${
                isKnown ? 'left-5 text-[#4F7A3F]' : 'left-0.5 text-[#8A857B]'
              }`}
            >
              {isKnown ? '✓' : '×'}
            </span>
          </button>

          {/* Level badge */}
          {word.level && <LevelBadge level={word.level} />}

          {/* TTS */}
          <button
            onClick={() => speak(word.word)}
            className="text-[#8A857B] hover:text-[#8C2F2A] transition-colors text-sm p-1"
            title="Pronounce"
          >
            🔊
          </button>

          {/* Bookmark */}
          <button
            onClick={() => onToggleBookmark(word)}
            className={`transition-colors text-sm p-1 relative ${
              word.is_bookmarked ? 'text-[#8C2F2A]' : 'text-[#8A857B] hover:text-[#8C2F2A]'
            }`}
            title={word.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {word.is_bookmarked ? '🔖' : '🔖'}
            {word.is_bookmarked && word.collected_count > 1 && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-[#8C2F2A] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {word.collected_count}
              </span>
            )}
          </button>

          {/* Delete */}
          {canDelete && <button
            onClick={() => onDelete(word)}
            className="text-[#C8BFA8] hover:text-[#8C2F2A] transition-colors text-xs p-1"
            title="Delete"
          >
            ✕
          </button>}
        </div>
      </div>

      {/* Expanded detail */}
      {showExpanded && <WordDetail word={word} mode={mode} />}

      {/* Inline shown definitions */}
      {mode === 'shown' && !showExpanded && (
        <div className="px-9 pb-2">
          {word.definitions.slice(0, 1).map((def, i) => (
            <p key={i} className="text-xs text-[#5A5550] line-clamp-2">{def.sense}</p>
          ))}
        </div>
      )}
    </div>
  );
}
