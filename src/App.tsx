import { useState, useCallback, useEffect } from 'react';
import type { Company } from '@/types';
import { COMPANIES } from '@/data/companies';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CompanyView } from '@/components/company/CompanyView';
import { AddCompanyModal } from '@/components/AddCompanyModal';
import { InsightAI } from '@/components/insight/InsightAI';

type Theme = 'dark' | 'light';
type AppView = 'companies' | 'insight';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('craze-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

export function App() {
  const [companies, setCompanies] = useState<Company[]>(COMPANIES);
  const [selectedId, setSelectedId] = useState<string | null>(COMPANIES[0].id);
  const [appView, setAppView] = useState<AppView>('companies');
  const [showModal, setShowModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('craze-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const selectedCompany = companies.find((c) => c.id === selectedId) ?? null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setAppView('companies');
  }, []);

  const handleAddCompany = useCallback((company: Company) => {
    setCompanies((prev) => [...prev, company]);
    setSelectedId(company.id);
    setAppView('companies');
  }, []);

  const showToast = useCallback(() => {
    if (toastTimer) clearTimeout(toastTimer);
    setToastVisible(true);
    const t = setTimeout(() => setToastVisible(false), 2200);
    setToastTimer(t);
  }, [toastTimer]);

  useEffect(() => {
    return () => { if (toastTimer) clearTimeout(toastTimer); };
  }, [toastTimer]);

  return (
    <div className="layout">
      <Topbar companies={companies} theme={theme} onToggleTheme={toggleTheme} />

      <Sidebar
        companies={companies}
        selectedId={selectedId}
        onSelect={handleSelect}
        onAddClick={() => setShowModal(true)}
        activeView={appView}
        onInsightClick={() => setAppView('insight')}
      />

      <main className="main">
        {appView === 'insight' ? (
          <InsightAI />
        ) : selectedCompany ? (
          <CompanyView company={selectedCompany} onCopied={showToast} />
        ) : (
          <div className="welcome">
            <h2 className="welcome__title">Craze Outbound System</h2>
            <p className="welcome__desc">
              Select a target brand from the sidebar to view their company profile, buyer
              personas, and AI-drafted outbound sequences.
            </p>
          </div>
        )}
      </main>

      {showModal && (
        <AddCompanyModal onAdd={handleAddCompany} onClose={() => setShowModal(false)} />
      )}

      {toastVisible && <div className="toast">✓ Copied to clipboard</div>}
    </div>
  );
}
