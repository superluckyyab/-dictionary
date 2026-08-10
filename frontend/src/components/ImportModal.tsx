import { useState, useRef } from 'react';
import { useImportWords } from '../hooks/useWords';

interface Props {
  onClose: () => void;
}

export default function ImportModal({ onClose }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ inserted: number; updated: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending, error } = useImportWords();

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.json')) {
      alert('Only .csv or .json files are supported.');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = () => {
    if (!file) return;
    mutate(file, {
      onSuccess: (data) => setResult(data),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F2EDE0] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4CBB8]">
          <h2 className="word-title text-lg font-bold text-[#2C2A26]">Import Words</h2>
          <button onClick={onClose} className="text-[#8A857B] hover:text-[#2C2A26] text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-[#8C2F2A] bg-[#F5E0DF]' : 'border-[#D4CBB8] hover:border-[#8C2F2A]'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-3xl mb-2">📂</p>
            {file ? (
              <p className="text-sm font-medium text-[#2C2A26]">{file.name}</p>
            ) : (
              <>
                <p className="text-sm text-[#5A5550]">Drag & drop a file here, or click to select</p>
                <p className="text-xs text-[#8A857B] mt-1">.csv or .json</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          <div className="bg-[#EAE3D2] rounded-lg p-3 text-xs text-[#5A5550] space-y-1">
            <p className="font-medium text-[#2C2A26]">Expected formats:</p>
            <p><span className="font-mono">CSV</span>: columns — word, part_of_speech, level, phonetic, definition, example</p>
            <p><span className="font-mono">JSON</span>: array of objects with same fields (definitions as array)</p>
          </div>

          {error && (
            <p className="text-xs text-[#8C2F2A] bg-[#F5E0DF] rounded-lg px-3 py-2">
              Error: {(error as Error).message}
            </p>
          )}

          {result && (
            <div className="bg-[#E8F0E0] rounded-lg px-3 py-2 text-sm text-[#3D6B2A]">
              ✓ Imported {result.total} words — {result.inserted} new, {result.updated} updated
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[#D4CBB8] text-sm text-[#5A5550] hover:border-[#8C2F2A] transition-colors"
            >
              {result ? 'Done' : 'Cancel'}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={!file || isPending}
                className="flex-1 py-2 rounded-lg bg-[#8C2F2A] text-[#F2EDE0] text-sm font-medium hover:bg-[#6B1F1A] disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Importing…' : 'Import'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
