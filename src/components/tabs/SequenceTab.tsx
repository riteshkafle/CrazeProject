import { useState, useCallback } from 'react';
import type { Company, SequenceStep } from '@/types';
import { generateSequence } from '@/lib/sequenceGenerator';
import { generateSmartReply, type GeneratedReply } from '@/lib/replyGenerator';

interface SequenceTabProps {
  company: Company;
  onCopied: () => void;
}

function StepCard({ step, onCopy }: { step: SequenceStep; onCopy: (text: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const copyText = step.subject ? `Subject: ${step.subject}\n\n${step.body}` : step.body;

  return (
    <div className="step-card">
      <div className="step-card__header" onClick={() => setIsOpen((o) => !o)}>
        <div className="step-card__num">{step.num}</div>
        <div className="step-card__icon">{step.icon}</div>
        <div className="step-card__type">{step.type}</div>
        <div className="step-card__timing">{step.timing}</div>
        <span className={`step-card__chevron ${isOpen ? 'step-card__chevron--open' : ''}`}>▾</span>
      </div>
      {isOpen && (
        <div className="step-card__body">
          {step.subject && (
            <>
              <div className="step-card__subject-label">Subject Line</div>
              <div className="step-card__subject-line">{step.subject}</div>
            </>
          )}
          <pre className="step-card__body-text">{step.body}</pre>
          <div className="mt-16">
            <button className="btn" onClick={() => onCopy(copyText)}>Copy {step.type}</button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ReplyIntelligenceProps {
  company: Company;
  contactName: string;
  onCopied: () => void;
}

function ReplyIntelligence({ company, contactName, onCopied }: ReplyIntelligenceProps) {
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedReply | null>(null);

  const handleGenerate = async () => {
    if (!reply.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await generateSmartReply(company, contactName, reply);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
      onCopied();
    } catch { /* blocked */ }
  }, [result, onCopied]);

  return (
    <div className="reply-intel">
      <div className="reply-intel__header">
        <div className="reply-intel__title">
          <span className="reply-intel__icon">↩️</span>
          Reply Intelligence
        </div>
        <div className="reply-intel__sub">
          Paste their email response — get an AI follow-up using live news, their Gen Z stats, and company context
        </div>
      </div>

      <div className="reply-intel__sources">
        <span className="reply-intel__source-tag">Live News</span>
        <span className="reply-intel__source-tag">NVIDIA NIM</span>
        <span className="reply-intel__source-tag">Gen Z Stats</span>
        <span className="reply-intel__source-tag">Pain Points</span>
      </div>

      <textarea
        className="reply-intel__textarea"
        placeholder={`Paste ${company.name}'s response here…\n\nExample: "Thanks for reaching out, we're currently focused on our Q3 launch and don't have bandwidth for new research vendors right now."`}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={6}
      />

      <button
        className="reply-intel__generate-btn"
        onClick={handleGenerate}
        disabled={!reply.trim() || loading}
      >
        {loading ? (
          <span className="reply-intel__spinner" />
        ) : (
          'Generate Smart Follow-Up'
        )}
      </button>

      {loading && (
        <div className="reply-intel__loading">
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            Fetching live news · Building company context · Writing with NVIDIA NIM…
          </div>
        </div>
      )}

      {error && (
        <div className="reply-intel__error">⚠️ {error}</div>
      )}

      {result && !loading && (
        <div className="reply-intel__result">
          <div className="reply-intel__result-label">
            <span>✅</span> AI-Crafted Follow-Up
          </div>

          <div className="reply-intel__subject-row">
            <span className="reply-intel__field-label">Subject</span>
            <span className="reply-intel__subject-text">{result.subject}</span>
          </div>

          <div className="reply-intel__body">
            {result.body.split(/\n\n+/).map((para, i) => (
              <p key={i} className="reply-intel__para">{para}</p>
            ))}
          </div>

          <button className="btn reply-intel__copy-btn" onClick={handleCopy}>
            Copy Email
          </button>
        </div>
      )}
    </div>
  );
}

export function SequenceTab({ company, onCopied }: SequenceTabProps) {
  const [contactName, setContactName] = useState('');
  const steps: SequenceStep[] = generateSequence(company, contactName);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onCopied();
    } catch {
      // clipboard blocked in some environments
    }
  }, [onCopied]);

  return (
    <div>
      <div className="section-title">7-Touch Outbound Sequence</div>

      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          className="field__input"
          placeholder="Contact name (e.g. Sarah Chen)"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
          Enter a name from Contacts Detail to personalise the sequence
        </div>
      </div>

      <div className="sequence__steps">
        {steps.map((step) => (
          <StepCard key={step.num} step={step} onCopy={handleCopy} />
        ))}
      </div>

      <ReplyIntelligence company={company} contactName={contactName} onCopied={onCopied} />
    </div>
  );
}
