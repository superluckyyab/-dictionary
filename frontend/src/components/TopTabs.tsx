import type { TabView } from '../types';
import type { Stats } from '../types';

interface Props {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  stats?: Stats;
  onAddWord: () => void;
  onImport: () => void;
  owner: boolean;
}

export default function TopTabs({ activeTab, onTabChange, stats, onAddWord, onImport, owner }: Props) {
  const tabs: { key: TabView; label: string; icon?: string; count?: number }[] = [
    { key: 'all', label: 'All', count: stats?.total },
    { key: 'unknown', label: 'Unknown', icon: '×', count: stats?.unknown },
    { key: 'known', label: 'Known', icon: '✓', count: stats?.known },
    { key: 'bookmarked', label: 'Bookmarked', icon: '⊕', count: stats?.bookmarked },
  ];

  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2 flex-wrap gap-y-2">
      <div className="flex gap-1 flex-wrap">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                active
                  ? 'bg-[#8C2F2A] text-[#F2EDE0] border-[#8C2F2A]'
                  : 'bg-[#F2EDE0] text-[#5A5550] border-[#D4CBB8] hover:border-[#8C2F2A] hover:text-[#8C2F2A]'
              }`}
            >
              {tab.icon && (
                <span className={active ? 'text-[#F2EDE0]' : tab.key === 'known' ? 'text-[#4F7A3F]' : 'text-[#8A857B]'}>
                  {tab.icon}
                </span>
              )}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-[#6B1F1A] text-[#F2EDE0]' : 'bg-[#D4CBB8] text-[#5A5550]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {owner && <div className="flex gap-2">
        <button
          onClick={onAddWord}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8C2F2A] text-[#F2EDE0] rounded-lg text-sm font-medium hover:bg-[#6B1F1A] transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Add Word
        </button>
        <button
          onClick={onImport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2EDE0] text-[#5A5550] border border-[#D4CBB8] rounded-lg text-sm font-medium hover:border-[#8C2F2A] hover:text-[#8C2F2A] transition-colors"
        >
          <span className="text-base leading-none">↑</span>
          Import
        </button>
      </div>}
    </div>
  );
}
