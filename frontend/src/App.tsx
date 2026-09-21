import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { StubPage } from './pages/StubPage';
import { useEngineHealth } from './hooks/useEngineHealth';
import { useAnalysis } from './hooks/useAnalysis';
import { cn } from './lib/utils';

function getInitialTheme(): boolean {
  try {
    const stored = localStorage.getItem('ni-theme');
    if (stored) return stored === 'light';
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  } catch { return false; }
}

function applyTheme(isLight: boolean) {
  const html = document.documentElement;
  if (isLight) { html.classList.add('light'); html.classList.remove('dark'); }
  else { html.classList.add('dark'); html.classList.remove('light'); }
  try { localStorage.setItem('ni-theme', isLight ? 'light' : 'dark'); } catch { /* ignore */ }
}

function AppInner() {
  const [isLight, setIsLight] = useState<boolean>(getInitialTheme);

  const toggleTheme = useCallback(() => {
    setIsLight((prev) => { const next = !prev; applyTheme(next); return next; });
  }, []);

  useEffect(() => { applyTheme(isLight); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const engineStatus = useEngineHealth();

  const {
    status, data, error, analysisTime, formattedAnalysisTime,
    fileName, analyze, analyzeNewTraffic, reset,
  } = useAnalysis();

  const [search, setSearch] = useState('');
  const handleClearSearch = useCallback(() => setSearch(''), []);
  const [glowEnabled, setGlowEnabled] = useState(true);

  const handleAnalyze = useCallback(
    (file: File, blockApp?: string) => { setSearch(''); analyze(file, blockApp); },
    [analyze],
  );

  const handleAnalyzeNewTraffic = useCallback(
    (blockApp?: string) => { setSearch(''); analyzeNewTraffic(blockApp); },
    [analyzeNewTraffic],
  );

  return (
    <div className={cn('flex flex-col h-screen', isLight ? 'bg-gray-100' : 'bg-navy-900')}>
      {/* Topbar: logo only */}
      <Topbar isLight={isLight} />

      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar isLight={isLight} />

        <main className={cn('flex-1 overflow-y-auto pl-60', isLight ? 'bg-gray-100' : 'bg-navy-900')}>
          <div className="p-5 min-w-[1024px]">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    data={data}
                    status={status}
                    error={error}
                    analysisTime={analysisTime}
                    formattedAnalysisTime={formattedAnalysisTime}
                    fileName={fileName}
                    search={search}
                    onSearchChange={setSearch}
                    onClearSearch={handleClearSearch}
                    glowEnabled={glowEnabled}
                    onGlowToggle={setGlowEnabled}
                    isLight={isLight}
                    engineStatus={engineStatus}
                    onAnalyze={handleAnalyze}
                    onAnalyzeNewTraffic={handleAnalyzeNewTraffic}
                    isLoading={status === 'loading'}
                    onToggleTheme={toggleTheme}
                  />
                }
              />
              <Route path="/pcap"         element={<StubPage isLight={isLight} />} />
              <Route path="/applications" element={<StubPage isLight={isLight} />} />
              <Route path="/domains"      element={<StubPage isLight={isLight} />} />
              <Route path="/flows"        element={<StubPage isLight={isLight} />} />
              <Route path="/rules"        element={<StubPage isLight={isLight} />} />
              <Route path="/reports"      element={<StubPage isLight={isLight} />} />
              <Route path="/settings"     element={<StubPage isLight={isLight} />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppInner /></BrowserRouter>;
}