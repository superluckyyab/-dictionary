const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Props {
  selected: string;
  onChange: (letter: string) => void;
}

export default function LetterFilter({ selected, onChange }: Props) {
  const allSelected = !selected || selected === 'All';

  return (
    <div className="px-4 py-2">
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onChange('All')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
            allSelected
              ? 'bg-[#8C2F2A] text-[#F2EDE0]'
              : 'bg-[#F2EDE0] text-[#5A5550] border border-[#D4CBB8] hover:border-[#8C2F2A] hover:text-[#8C2F2A]'
          }`}
        >
          All
        </button>
        {LETTERS.map((letter) => {
          const active = selected === letter;
          return (
            <button
              key={letter}
              onClick={() => onChange(active ? 'All' : letter)}
              className={`w-7 h-7 rounded text-xs font-medium transition-all ${
                active
                  ? 'bg-[#8C2F2A] text-[#F2EDE0]'
                  : 'bg-[#F2EDE0] text-[#5A5550] border border-[#D4CBB8] hover:border-[#8C2F2A] hover:text-[#8C2F2A]'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
