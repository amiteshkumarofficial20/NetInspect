import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { StubPage } from './pages/StubPage';
import { useEngineHealth } from './hooks/useEngineHealth';
import { useAnalysis } from './hooks/useAnalysis';
import { cn } from './lib/utils';

// ── Persist theme preference ─────────────────────────────────────────────────
function getInitialTheme(): boolean {
  try {
    const stored = localStorage.getItem('ni-theme');
    if (stored) return stored === 'light';
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  } catch {
    return false;
  }
}

function applyTheme(isLight: boolean) {
  const html = document.documentElement;
  if (isLight) {
    html.classList.add('light');
    html.classList.remove('dark');
  } else {
    html.classList.add('dark');
    html.classList.remove('light');
  }
  try {
    localStorage.setItem('ni-theme', isLight ? 'light' : 'dark');
  } catch {
    // ignore
  }
}

// ── App root ─────────────────────────────────────────────────────────────────
function AppInner() {
  // Theme
  const [isLight, setIsLight] = useState<boolean>(getInitialTheme);
  const toggleTheme = useCallback(() => {
    setIsLight((prev) => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  }, []);

  // Apply theme on mount
  useEffect(() => {
    applyTheme(isLight);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Engine health
  const engineStatus = useEngineHealth();

  // Analysis state machine
  const {
    status,
    data,
    error,
    analysisTime,
    formattedAnalysisTime,
    fileName,
    analyze,
    reset,
  } = useAnalysis();

  // Search
  const [search, setSearch] = useState('');
  const handleClearSearch = useCallback(() => setSearch(''), []);

  // Glow toggle
  const [glowEnabled, setGlowEnabled] = useState(true);

  // Handle file upload from Topbar
  const handleAnalyze = useCallback(
  (file: File, blockApp?: string) => {
    setSearch('');
    analyze(file, blockApp);
  },
  [analyze],
);

  // Handle chip clear
  const handleClearFile = useCallback(() => {
    reset();
    setSearch('');
  }, [reset]);

  return (
    <div className={cn('flex flex-col h-screen', isLight ? 'bg-gray-100' : 'bg-navy-900')}>
      {/* Fixed top bar */}
      <Topbar
        engineStatus={engineStatus}
        search={search}
        onSearchChange={setSearch}
        onAnalyze={handleAnalyze}
        isLoading={status === 'loading'}
        isLight={isLight}
        onToggleTheme={toggleTheme}
        selectedFile={fileName}
        onClearFile={handleClearFile}
      />

      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Fixed sidebar */}
        <Sidebar isLight={isLight} />

        {/* Main scrollable content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto pl-60',
            isLight ? 'bg-gray-100' : 'bg-navy-900',
          )}
        >
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
                    onClearSearch={handleClearSearch}
                    glowEnabled={glowEnabled}
                    onGlowToggle={setGlowEnabled}
                    isLight={isLight}
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
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}