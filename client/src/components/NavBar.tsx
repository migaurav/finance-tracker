import type { TabId } from '../types';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'monthly', label: 'Monthly Tally', icon: '📅' },
  { id: 'emis', label: 'EMIs & Receivables', icon: '💳' },
  { id: 'investments', label: 'Investments', icon: '📈' },
];

export default function NavBar({ activeTab, onTabChange, darkMode, onToggleDark }: Props) {
  return (
    <>
      <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-lg mr-4">💰 Finance</span>
            {/* Desktop tabs — hidden on mobile */}
            <div className="hidden sm:flex items-center gap-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onTabChange(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === t.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg"
            title="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav — hidden on sm+ */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                activeTab === t.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="text-xl mb-0.5">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
