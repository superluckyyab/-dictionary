import { useState } from 'react';
import type { Word, DefinitionMode } from '../types';

interface Props {
  word: Word;
  mode: DefinitionMode;
}

export default function WordDetail({ word, mode }: Props) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const toggleReveal = (i: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  if (!word.definitions || word.definitions.length === 0) {
    return (
      <div className="px-4 pt-2 pb-3 text-sm text-[#8A857B] italic">
        No definitions available.
      </div>
    );
  }

  return (
    <div className="px-4 pt-1 pb-3 space-y-2.5">
      {word.phonetic && (
        <div className="text-sm text-[#8A857B] font-mono">{word.phonetic}</div>
      )}
      {word.definitions.map((def, i) => {

        if (mode === 'hidden') {
          return null;
        }

        return (
          <div key={i} className="space-y-1">
            <div className="flex items-start gap-2">
              <span className="text-[#8C2F2A] text-xs font-bold mt-0.5 shrink-0">{i + 1}.</span>
              <div className="space-y-0.5 flex-1">
                {mode === 'test' && !revealed.has(i) ? (
                  <button
                    onClick={() => toggleReveal(i)}
                    className="text-sm text-[#8A857B] italic bg-[#DDD6C6] rounded px-2 py-0.5 hover:bg-[#D0C9B8] transition-colors"
                  >
                    Click to reveal definition
                  </button>
                ) : (
                  <>
                    <p className="text-sm text-[#2C2A26]">{def.sense}</p>
                    {def.example && (
                      <p className="text-xs text-[#8A857B] italic">"{def.example}"</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
