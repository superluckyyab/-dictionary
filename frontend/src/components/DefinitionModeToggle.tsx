import type { DefinitionMode } from '../types';

interface Props {
  mode: DefinitionMode;
  onChange: (mode: DefinitionMode) => void;
}

const MODES: { key: DefinitionMode; label: string }[] = [
  { key: 'hidden', label: 'Hidden' },
  { key: 'test', label: 'Test' },
  { key: 'shown', label: 'Shown' },
];

export default function DefinitionModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <span className="text-xs text-[#8A857B] font-medium">Definitions:</span>
      <div className="flex bg-[#DDD6C6] rounded-lg p-0.5 gap-0.5">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              mode === m.key
                ? 'bg-[#F2EDE0] text-[#2C2A26] shadow-sm'
                : 'text-[#6A6560] hover:text-[#2C2A26]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <span className="text-xs text-[#8A857B] ml-auto">Manage</span>
    </div>
  );
}
