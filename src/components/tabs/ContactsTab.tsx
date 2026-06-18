import { useState, useEffect, useRef } from 'react';
import type { Company, EnrichedPersona } from '@/types';
import { buildPersonaPipeline } from '@/lib/personaEnrichment';
import { getInitials } from '@/lib/sequenceGenerator';

interface ContactsTabProps {
  company: Company;
}

function openGmailCompose(to: string, subject = '', body = '') {
  const url = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, '_blank');
}

function PriorityBadge({ priority }: { priority: 'p1' | 'p2' }) {
  return (
    <span className={`persona-card__priority persona-card__priority--${priority}`}>
      {priority === 'p1' ? '⚡ P1' : '○ P2'}
    </span>
  );
}

function ConfidencePill({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)';
  return (
    <span style={{
      fontSize: 10, padding: '2px 7px', borderRadius: 99,
      background: `${color}18`, border: `1px solid ${color}44`,
      color, fontWeight: 600, flexShrink: 0,
    }}>
      {score}%
    </span>
  );
}

function ContactCard({ contact }: { contact: EnrichedPersona }) {
  const initials = getInitials(contact.name);
  const firstName = contact.name.split(' ')[0];
  const defaultSubject = `Quick question re: Gen Z consumer insights`;
  const defaultBody = `Hi ${firstName},\n\nI wanted to reach out about how Craze could help your team get faster Gen Z consumer insights.\n\nWould love to connect for a quick chat.\n\nBest,`;

  return (
    <div className="persona-card">
      <div className="persona-card__header">
        <div
          className="persona-card__avatar"
          style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--accent-2)' }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="persona-card__name">{contact.name}</div>
          <div className="persona-card__role">{contact.role}</div>
        </div>
        <PriorityBadge priority={contact.priority} />
      </div>

      <div className="persona-card__field">
        <span className="persona-card__field-label">Email</span>
        <span style={{ wordBreak: 'break-all', flex: 1 }}>📧 {contact.email}</span>
        <ConfidencePill score={contact.confidence} />
      </div>

      <div className="persona-card__field">
        <span className="persona-card__field-label">LinkedIn</span>
        <a
          href={contact.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="hero__news-link"
        >
          🔗 View Profile
        </a>
      </div>

      <div className="persona-card__focus">
        <div className="persona-card__focus-label">Focus Areas</div>
        <div className="persona-card__focus-text">{contact.focus}</div>
      </div>

      <div className="persona-card__hook">
        <div className="persona-card__hook-label">Cold Call Angle</div>
        <div className="persona-card__hook-text">{contact.coldCallAngle}</div>
      </div>

      <div className="persona-card__actions mt-12" style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn--primary"
          style={{ fontSize: 11 }}
          onClick={() => openGmailCompose(contact.email, defaultSubject, defaultBody)}
        >
          Send Email
        </button>
        <a
          href={contact.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{ fontSize: 11, textDecoration: 'none' }}
        >
          LinkedIn
        </a>
      </div>
    </div>
  );
}

export function ContactsTab({ company }: ContactsTabProps) {
  const [contacts, setContacts] = useState<EnrichedPersona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Map<string, EnrichedPersona[]>>(new Map());

  useEffect(() => {
    const cached = cache.current.get(company.id);
    if (cached) {
      setContacts(cached);
      return;
    }
    setLoading(true);
    setError(null);
    setContacts([]);
    buildPersonaPipeline(company)
      .then((results) => {
        cache.current.set(company.id, results);
        setContacts(results);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Contact lookup failed.');
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id]);

  async function handleRefresh() {
    cache.current.delete(company.id);
    setLoading(true);
    setError(null);
    setContacts([]);
    try {
      const results = await buildPersonaPipeline(company);
      cache.current.set(company.id, results);
      setContacts(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Contact lookup failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section-title">Contact Discovery</div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-2)', fontSize: 14 }}>
          <div className="ai-spinner" style={{ margin: '0 auto 16px' }} />
          Finding contacts and generating sales intelligence…
        </div>
      )}

      {!loading && error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--red)',
          marginBottom: 16,
        }}>
          {error}
          <button className="btn" style={{ marginTop: 12, display: 'block' }} onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      )}

      {!loading && contacts.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {contacts.length} contacts found
            </span>
            <button className="btn" onClick={handleRefresh} disabled={loading}>
              Refresh
            </button>
          </div>
          <div className="personas-grid">
            {contacts.map((c, i) => (
              <ContactCard key={i} contact={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
