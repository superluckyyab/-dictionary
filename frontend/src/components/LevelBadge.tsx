const LEVEL_STYLES: Record<string, { bg: string; text: string }> = {
  A1: { bg: '#E8F0E0', text: '#3D6B2A' },
  A2: { bg: '#D8ECD0', text: '#2D5A1A' },
  B1: { bg: '#FBF3DC', text: '#8A6400' },
  B2: { bg: '#FAEADB', text: '#8A4010' },
  C1: { bg: '#F5E0DF', text: '#6B1F1A' },
  C2: { bg: '#EDD8D7', text: '#5A1410' },
};

interface Props {
  level: string;
  size?: 'sm' | 'xs';
}

export default function LevelBadge({ level, size = 'xs' }: Props) {
  const styles = LEVEL_STYLES[level] ?? { bg: '#E8E0D0', text: '#5A5550' };
  return (
    <span
      style={{ backgroundColor: styles.bg, color: styles.text }}
      className={`rounded font-semibold ${size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}
    >
      {level}
    </span>
  );
}
