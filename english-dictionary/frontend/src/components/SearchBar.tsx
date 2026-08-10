import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="px-4 py-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A857B] text-base pointer-events-none">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search a word, part of speech, or meaning..."
          className="w-full bg-[#F2EDE0] border border-[#D4CBB8] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#2C2A26] placeholder-[#B0A898] focus:outline-none focus:border-[#8C2F2A] transition-colors"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A857B] hover:text-[#2C2A26] text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
