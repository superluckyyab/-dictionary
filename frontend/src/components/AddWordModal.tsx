import { useState } from 'react';
import type { Definition } from '../types';
import { useCreateWord } from '../hooks/useWords';

interface Props {
  onClose: () => void;
}

const POS_OPTIONS = ['verb', 'noun', 'adjective', 'adverb', 'preposition', 'pronoun', 'conjunction', 'determiner', 'interjection'];
const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function AddWordModal({ onClose }: Props) {
  const [word, setWord] = useState('');
  const [pos, setPos] = useState('');
  const [level, setLevel] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [definitions, setDefinitions] = useState<Definition[]>([{ sense: '', example: '' }]);
  const { mutate, isPending } = useCreateWord();

  const addDef = () => setDefinitions([...definitions, { sense: '', example: '' }]);
  const removeDef = (i: number) => setDefinitions(definitions.filter((_, idx) => idx !== i));
  const updateDef = (i: number, field: keyof Definition, val: string) => {
    setDefinitions(definitions.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    const defs = definitions.filter((d) => d.sense.trim());
    mutate(
      {
        word: word.trim(),
        part_of_speech: pos || undefined,
        level: level || undefined,
        phonetic: phonetic || undefined,
        definitions: defs.length > 0 ? defs : undefined,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F2EDE0] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4CBB8]">
          <h2 className="word-title text-lg font-bold text-[#2C2A26]">Add New Word</h2>
          <button onClick={onClose} className="text-[#8A857B] hover:text-[#2C2A26] text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#5A5550] mb-1">Word *</label>
            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. abandon"
              required
              className="w-full bg-[#EAE3D2] border border-[#D4CBB8] rounded-lg px-3 py-2 text-sm text-[#2C2A26] focus:outline-none focus:border-[#8C2F2A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#5A5550] mb-1">Part of Speech</label>
              <select
                value={pos}
                onChange={(e) => setPos(e.target.value)}
                className="w-full bg-[#EAE3D2] border border-[#D4CBB8] rounded-lg px-3 py-2 text-sm text-[#2C2A26] focus:outline-none focus:border-[#8C2F2A]"
              >
                <option value="">Select…</option>
                {POS_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A5550] mb-1">CEFR Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-[#EAE3D2] border border-[#D4CBB8] rounded-lg px-3 py-2 text-sm text-[#2C2A26] focus:outline-none focus:border-[#8C2F2A]"
              >
                <option value="">Select…</option>
                {LEVEL_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A5550] mb-1">Phonetic (IPA)</label>
            <input
              value={phonetic}
              onChange={(e) => setPhonetic(e.target.value)}
              placeholder="e.g. /əˈbændən/"
              className="w-full bg-[#EAE3D2] border border-[#D4CBB8] rounded-lg px-3 py-2 text-sm text-[#2C2A26] focus:outline-none focus:border-[#8C2F2A] font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#5A5550]">Definitions</label>
              <button type="button" onClick={addDef} className="text-xs text-[#8C2F2A] hover:underline">
                + Add definition
              </button>
            </div>
            <div className="space-y-3">
              {definitions.map((def, i) => (
                <div key={i} className="bg-[#EAE3D2] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8A857B]">Definition {i + 1}</span>
                    {definitions.length > 1 && (
                      <button type="button" onClick={() => removeDef(i)} className="text-xs text-[#8A857B] hover:text-[#8C2F2A]">
                        Remove
                      </button>
                    )}
                  </div>
                  <textarea
                    value={def.sense}
                    onChange={(e) => updateDef(i, 'sense', e.target.value)}
                    placeholder="Meaning / sense"
                    rows={2}
                    className="w-full bg-[#F2EDE0] border border-[#D4CBB8] rounded px-2 py-1.5 text-sm text-[#2C2A26] focus:outline-none focus:border-[#8C2F2A] resize-none"
                  />
                  <input
                    value={def.example || ''}
                    onChange={(e) => updateDef(i, 'example', e.target.value)}
                    placeholder="Example sentence (optional)"
                    className="w-full bg-[#F2EDE0] border border-[#D4CBB8] rounded px-2 py-1.5 text-sm text-[#2C2A26] focus:outline-none focus:border-[#8C2F2A]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[#D4CBB8] text-sm text-[#5A5550] hover:border-[#8C2F2A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !word.trim()}
              className="flex-1 py-2 rounded-lg bg-[#8C2F2A] text-[#F2EDE0] text-sm font-medium hover:bg-[#6B1F1A] disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Adding…' : 'Add Word'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
