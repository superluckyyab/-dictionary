const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const LEVEL_COLORS: Record<string, { bg: string; text: string; activeBg: string; activeText: string }> = {
  A1: { bg: '#E8F0E0', text: '#3D6B2A', activeBg: '#5C7F3A', activeText: '#fff' },
  A2: { bg: '#E8F0E0', text: '#3D6B2A', activeBg: '#5C7F3A', activeText: '#fff' },
  B1: { bg: '#FBF3DC', text: '#8A6400', activeBg: '#B8860B', activeText: '#fff' },
  B2: { bg: '#FAEADB', text: '#8A4010', activeBg: '#C2702A', activeText: '#fff' },
  C1: { bg: '#F5E0DF', text: '#6B1F1A', activeBg: '#8C2F2A', activeText: '#fff' },
  C2: { bg: '#EDD8D7', text: '#5A1410', activeBg: '#6B1F1A', activeText: '#fff' },
};

interface Props {
  selected: string[];
  onChange: (levels: string[]) => void;
}

export default function LevelFilter({ selected, onChange }: Props) {
  const toggle = (level: string) => {
    if (selected.includes(level)) {
      onChange(selected.filter((l) => l !== level));
    } else {
      onChange([...selected, level]);
    }
  };

  return (
    <div className="px-4 py-1.5 flex gap-1.5 flex-wrap">
      {LEVELS.map((level) => {
        const active = selected.includes(level);
        const colors = LEVEL_COLORS[level];
        return (
          <button
            key={level}
            onClick={() => toggle(level)}
            style={
              active
                ? { backgroundColor: colors.activeBg, color: colors.activeText }
                : { backgroundColor: colors.bg, color: colors.text }
            }
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all border border-transparent hover:opacity-90"
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}
