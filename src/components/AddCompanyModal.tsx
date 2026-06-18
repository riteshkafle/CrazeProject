import { useState } from 'react';
import type { Company } from '@/types';

interface AddCompanyModalProps {
  onAdd: (company: Company) => void;
  onClose: () => void;
}

function buildDefaultCompany(name: string, industry: string, fitReason: string): Company {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const domainSlug = name.toLowerCase().replace(/\s+/g, '');

  return {
    id: slug,
    name,
    domain: `${domainSlug}.com`,
    industry: industry || 'Consumer Brand',
    hq: 'TBD',
    founded: 'TBD',
    size: 'TBD',
    revenue: 'TBD',
    ceo: 'TBD',
    why: [
      fitReason ||
        `${name} targets a Gen Z consumer base and needs fast, authentic insight to stay competitive.`,
      "Rapid product decisions require consumer validation that traditional research can't provide in time.",
      "Craze's verified student panel delivers authentic feedback without the bias of traditional focus groups.",
      'AI-moderated interviews surface deeper motivations than surveys or social listening alone.',
    ],
    pains: [
      {
        icon: '⏱️',
        title: 'Research velocity',
        desc: 'Traditional studies take too long for the speed of Gen Z culture.',
      },
      {
        icon: '🔍',
        title: 'Authenticity gap',
        desc: "Gen Z doesn't trust brands that don't understand them — and the feeling is mutual.",
      },
      {
        icon: '📊',
        title: 'Decision confidence',
        desc: 'Marketing and product teams need validated data before committing budget.',
      },
      {
        icon: '🌍',
        title: 'Cultural relevance',
        desc: 'Staying culturally current with Gen Z requires constant, real-time feedback loops.',
      },
    ],
    tags: ['Gen Z Focus', 'Custom Account'],
    genZStats: {
      customerShare: 60,
      revenueShare: 55,
      socialFollowers: 'TBD',
      topPlatform: 'TikTok',
      campusPresence: 'TBD',
      coldCallStat: `${name} targets a Gen Z consumer base — exact share TBD. Add research to sharpen this before calling.`,
      coldCallHook: `Ask ${name} how they're currently gathering Gen Z insight and how fast they can act on it. Most brands rely on social listening alone — that's your in.`,
    },
  };
}

export function AddCompanyModal({ onAdd, onClose }: AddCompanyModalProps) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [fitReason, setFitReason] = useState('');

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const company = buildDefaultCompany(trimmed, industry.trim(), fitReason.trim());
    onAdd(company);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title">Add Target Company</div>

        <div className="field">
          <label className="field__label">Company Name</label>
          <input
            className="field__input"
            placeholder="e.g. Liquid Death"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="field">
          <label className="field__label">Industry</label>
          <input
            className="field__input"
            placeholder="e.g. Beverage / CPG"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label">Why a good fit for Craze?</label>
          <textarea
            className="field__textarea"
            placeholder="Describe why this brand targets Gen Z..."
            value={fitReason}
            onChange={(e) => setFitReason(e.target.value)}
          />
        </div>

        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={!name.trim()}>
            Add Company
          </button>
        </div>
      </div>
    </div>
  );
}
