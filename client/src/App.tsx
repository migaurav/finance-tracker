import { useState, useEffect } from 'react';
import type { TabId } from './types';
import NavBar from './components/NavBar';
import MonthlyTally from './components/tabs/MonthlyTally';
import EMITab from './components/tabs/EMITab';
import InvestmentsTab from './components/tabs/InvestmentsTab';

export default function App() {
  const [tab, setTab] = useState<TabId>('monthly');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="min-h-screen">
      <NavBar activeTab={tab} onTabChange={setTab} darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />
      <main className="pb-16 sm:pb-0">
        {tab === 'monthly' && <MonthlyTally />}
        {tab === 'emis' && <EMITab />}
        {tab === 'investments' && <InvestmentsTab />}
      </main>
    </div>
  );
}
