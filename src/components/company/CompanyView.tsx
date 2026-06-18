import { useState } from 'react';
import type { Company, TabId } from '@/types';
import { CompanyHero } from './CompanyHero';
import { ContactsTab } from '@/components/tabs/ContactsTab';
import { SequenceTab } from '@/components/tabs/SequenceTab';
import { CallIntelTab } from '@/components/tabs/CallIntelTab';

interface CompanyViewProps {
  company: Company;
  onCopied: () => void;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'contacts',  label: 'Contacts Detail',   icon: '🔍' },
  { id: 'sequence',  label: 'Outbound Sequence',  icon: '📬' },
  { id: 'callintel', label: 'Call Intelligence',  icon: '🎙' },
];

export function CompanyView({ company, onCopied }: CompanyViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('contacts');

  const [prevId, setPrevId] = useState(company.id);
  if (company.id !== prevId) {
    setPrevId(company.id);
    setActiveTab('contacts');
  }

  return (
    <div>
      <CompanyHero company={company} />

      <div className="tabs">
        <div className="tabs__tray">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tabs__btn ${activeTab === tab.id ? 'tabs__btn--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tabs__btn-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'contacts'  && <ContactsTab  company={company} />}
        {activeTab === 'sequence'  && (
          <SequenceTab company={company} onCopied={onCopied} />
        )}
        {activeTab === 'callintel' && <CallIntelTab company={company} onCopied={onCopied} />}
      </div>
    </div>
  );
}
