import type { Company } from '@/types';
import { CompanyLogo } from '@/components/ui/CompanyLogo';

interface SidebarProps {
  companies: Company[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddClick: () => void;
  activeView: 'companies' | 'insight';
  onInsightClick: () => void;
}

export function Sidebar({
  companies, selectedId, onSelect, onAddClick, activeView, onInsightClick,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__label">Target Accounts</div>

      {companies.map((company) => (
        <button
          key={company.id}
          className={`sidebar__item ${activeView === 'companies' && selectedId === company.id ? 'sidebar__item--active' : ''}`}
          onClick={() => onSelect(company.id)}
        >
          <CompanyLogo id={company.id} domain={company.domain} name={company.name} size={28} />
          <div>
            <div className="sidebar__name">{company.name}</div>
            <div className="sidebar__industry">
              {company.industry.split('/')[0].trim()}
            </div>
          </div>
        </button>
      ))}

      <button className="sidebar__add-btn" onClick={onAddClick}>
        + Add Company
      </button>

      <div className="sidebar__divider" />
      <div className="sidebar__label">AI Tools</div>

      <button
        className={`sidebar__item ${activeView === 'insight' ? 'sidebar__item--active' : ''}`}
        onClick={onInsightClick}
      >
        {/* TODO: replace with your Gen Z Insight icon — swap the SVG below for an <img src="/your-icon.png"> */}
        <div className="sidebar__tool-icon sidebar__tool-icon--placeholder">
          <img src="/logos/genz.jpeg" width={34} height={34} />

          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <div>
          <div className="sidebar__name">Gen Z Insight AI</div>
          <div className="sidebar__industry">Video analysis</div>
        </div>
      </button>
    </aside>
  );
}
