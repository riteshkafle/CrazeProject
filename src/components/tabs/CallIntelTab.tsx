import { useState, useRef, useEffect } from 'react';
import type { Company, CallAnalysis, CallSentiment, DealStage, PitchMetrics } from '@/types';
import { analyzeCall } from '@/lib/callIntelligence';

interface CallIntelTabProps {
  company: Company;
  onCopied: () => void;
}

const SENTIMENT_CONFIG: Record<CallSentiment, { label: string; color: string; bg: string }> = {
  interested: { label: 'Interested', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  neutral:    { label: 'Neutral',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  cold:       { label: 'Cold',       color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
};

const STAGE_CONFIG: Record<DealStage, { label: string; step: number }> = {
  discovery:    { label: 'Discovery',    step: 1 },
  qualified:    { label: 'Qualified',    step: 2 },
  proposal:     { label: 'Proposal',     step: 3 },
  negotiation:  { label: 'Negotiation',  step: 4 },
  closed_won:   { label: 'Closed Won',   step: 5 },
  closed_lost:  { label: 'Closed Lost',  step: 0 },
};

// ── Web Speech API types ──
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

// ── Sub-components ──

function DealPipeline({ stage }: { stage: DealStage }) {
  const stages: DealStage[] = ['discovery', 'qualified', 'proposal', 'negotiation', 'closed_won'];
  const current = STAGE_CONFIG[stage].step;
  return (
    <div style={{ display: 'flex', gap: 0, marginTop: 8 }}>
      {stages.map((s, i) => {
        const isActive = STAGE_CONFIG[s].step === current;
        const isPast = STAGE_CONFIG[s].step < current;
        return (
          <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: '100%',
                height: 4,
                background: isPast || isActive ? 'var(--accent)' : 'var(--border)',
                borderRadius: i === 0 ? '2px 0 0 2px' : i === stages.length - 1 ? '0 2px 2px 0' : 0,
              }}
            />
            <span style={{ fontSize: 10, color: isActive ? 'var(--accent-2)' : isPast ? 'var(--text-2)' : 'var(--text-3)', fontWeight: isActive ? 600 : 400 }}>
              {STAGE_CONFIG[s].label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const fill = (score / 10) * circ;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={32} cy={32} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
        <circle
          cx={32} cy={32} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: -46, marginBottom: 30 }}>{score}</div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function PitchDashboard({ metrics }: { metrics: PitchMetrics }) {
  const scoreColor = metrics.pitchScore >= 80 ? 'var(--green)' : metrics.pitchScore >= 60 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div className="fit-analysis__card" style={{ marginTop: 16 }}>
      <div className="fit-analysis__card-title">Pitch Quality Analysis</div>

      {/* Scores row */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <ScoreRing score={Math.round(metrics.pitchScore / 10)} label="PITCH SCORE" color={scoreColor} />
        <ScoreRing score={metrics.openingStrength} label="OPENING" color="var(--accent-2)" />
        <ScoreRing score={metrics.closingStrength} label="CLOSING" color="var(--blue)" />
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div className="pitch-stat">
          <div className="pitch-stat__value">{metrics.talkRatio}%</div>
          <div className="pitch-stat__label">You Talked</div>
        </div>
        <div className="pitch-stat">
          <div className="pitch-stat__value">{metrics.questionsAsked}</div>
          <div className="pitch-stat__label">Questions Asked</div>
        </div>
        <div className="pitch-stat">
          <div className="pitch-stat__value" style={{ color: metrics.fillerWords.length > 5 ? 'var(--red)' : 'var(--green)' }}>
            {metrics.fillerWords.length}
          </div>
          <div className="pitch-stat__label">Filler Words</div>
        </div>
      </div>

      {metrics.fillerWords.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
            Detected Fillers
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {metrics.fillerWords.map((w, i) => (
              <span key={i} style={{ fontSize: 11, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 99, padding: '2px 8px', color: 'var(--red)' }}>
                "{w}"
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
            What You Did Well
          </div>
          {metrics.strengths.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ color: 'var(--green)', flexShrink: 0, fontSize: 12 }}>✓</span>
              <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
            Improvement Areas
          </div>
          {metrics.improvements.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ color: 'var(--yellow)', flexShrink: 0, fontSize: 12 }}>→</span>
              <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ analysis, onCopied }: { analysis: CallAnalysis; onCopied: () => void }) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const sentiment = SENTIMENT_CONFIG[analysis.sentiment];

  async function copyEmail() {
    const text = `Subject: ${analysis.followUpEmail.subject}\n\n${analysis.followUpEmail.body}`;
    await navigator.clipboard.writeText(text);
    onCopied();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
        <div className="fit-analysis__card">
          <div className="fit-analysis__card-title">Call Summary</div>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{analysis.summary}</p>
        </div>
        <div
          style={{
            background: sentiment.bg,
            border: `1px solid ${sentiment.color}44`,
            borderRadius: 12,
            padding: '18px 24px',
            textAlign: 'center',
            minWidth: 140,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: sentiment.color }}>{analysis.sentimentScore}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: sentiment.color, marginTop: 2 }}>SENTIMENT</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 6 }}>{sentiment.label}</div>
        </div>
      </div>

      {analysis.pitchMetrics && <PitchDashboard metrics={analysis.pitchMetrics} />}

      <div className="fit-analysis__card">
        <div className="fit-analysis__card-title">Deal Stage</div>
        <DealPipeline stage={analysis.dealStage} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="fit-analysis__card">
          <div className="fit-analysis__card-title">Key Insights</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analysis.keyInsights.map((insight, i) => (
              <div key={i} className="fit-item" style={{ padding: '10px 12px' }}>
                <div className="fit-item__bullet">✓</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{insight}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="fit-analysis__card">
          <div className="fit-analysis__card-title">Objections Raised</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analysis.objections.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No objections identified</p>
            ) : (
              analysis.objections.map((obj, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 12,
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                  }}
                >
                  {obj}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>→</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--accent-2)', marginBottom: 4 }}>
            Recommended Next Step
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{analysis.nextStep}</div>
        </div>
      </div>

      <div className="fit-analysis__card">
        <div className="fit-analysis__card-title">Next Call Talk Track</div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, fontStyle: 'italic' }}>
          "{analysis.talkTrack}"
        </p>
      </div>

      <div className="step-card">
        <div className="step-card__header" onClick={() => setShowEmail((v) => !v)}>
          <div className="step-card__icon">📧</div>
          <div className="step-card__type">Ready-to-Send Follow-Up Email</div>
          <span className={`step-card__chevron ${showEmail ? 'step-card__chevron--open' : ''}`}>▾</span>
        </div>
        {showEmail && (
          <div className="step-card__body">
            <div className="step-card__subject-label">Subject Line</div>
            <div className="step-card__subject-line">{analysis.followUpEmail.subject}</div>
            <pre className="step-card__body-text">{analysis.followUpEmail.body}</pre>
            <div className="mt-16" style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={copyEmail}>Copy Email</button>
              <a
                href={`https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(analysis.followUpEmail.subject)}&body=${encodeURIComponent(analysis.followUpEmail.body)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
                style={{ textDecoration: 'none', fontSize: 12 }}
              >
                Open in Gmail
              </a>
            </div>
          </div>
        )}
      </div>

      {analysis.reasoning && (
        <div>
          <button className="btn btn--ghost" style={{ fontSize: 11 }} onClick={() => setShowReasoning((v) => !v)}>
            {showReasoning ? 'Hide' : 'Show'} AI Reasoning
          </button>
          {showReasoning && (
            <div
              style={{
                marginTop: 10,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 16,
                fontSize: 12,
                color: 'var(--text-3)',
                lineHeight: 1.7,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: 300,
                overflowY: 'auto',
              }}
            >
              {analysis.reasoning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const EXAMPLE_TRANSCRIPT = `Rep: Hi Maya, thanks for making time. I wanted to follow up on our chat last week about consumer research.

Maya: Yes, hi. We're actually in the middle of Q3 planning and I only have about 15 minutes.

Rep: Perfect, I'll keep it tight. Quick question — when you need to understand how Gen Z is reacting to a new Red Bull line, how are you currently getting that data?

Maya: We use a mix of panel vendors and some internal surveys. The challenge is turnaround — it takes us 6–8 weeks to get clean data back, which is way too slow for our product cadence.

Rep: That's exactly what we hear. Craze can do that same study in 72 hours with verified college students. We did something similar for a beverage brand last month — 100 students, AI-moderated interviews, results in 3 days.

Maya: That's interesting. What's the quality like compared to a traditional panel? Our concern is depth — we need real answers, not just star ratings.

Rep: Fair concern. The difference is we use AI-moderated conversations, not surveys. Students actually talk through their reasoning. You get verbatims, not just numbers.

Maya: Budget is going to be a question. We've already allocated most of our research budget for the year.

Rep: Understood. We do offer a free pilot — one study, 50 students, no cost. You'd see the quality before any commitment.

Maya: That could work. Let me talk to my team lead. Can you send me a case study from a beverage brand?

Rep: Absolutely. I'll send that today. Can we set a follow-up call for next week to walk through the pilot scope?

Maya: Sure, Thursday works. Send me a calendar invite.`;

// ── Main component ──

type InputMode = 'mic' | 'text';

export function CallIntelTab({ company, onCopied }: CallIntelTabProps) {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [transcript, setTranscript] = useState('');
  const [personaName, setPersonaName] = useState('');
  const [personaRole, setPersonaRole] = useState('');
  const [analysis, setAnalysis] = useState<CallAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mic state
  const [micActive, setMicActive] = useState(false);
  const [micInterim, setMicInterim] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');

  // Keep ref in sync with state (for closure capture in speech events)
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Reset when company changes
  const [prevId, setPrevId] = useState(company.id);
  if (company.id !== prevId) {
    setPrevId(company.id);
    setPersonaName('');
    setPersonaRole('');
    setTranscript('');
    setAnalysis(null);
    setMicInterim('');
  }

  function loadExample() {
    setTranscript(EXAMPLE_TRANSCRIPT);
    setPersonaName('Contact');
    setPersonaRole('Decision Maker');
  }

  function startMic() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      setMicError('Speech recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }
    setMicError(null);
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += text + ' ';
        } else {
          interim += text;
        }
      }
      if (finalChunk) {
        setTranscript((prev) => prev + finalChunk);
      }
      setMicInterim(interim);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        setMicError(`Mic error: ${event.error}`);
      }
      setMicActive(false);
    };

    rec.onend = () => {
      setMicActive(false);
      setMicInterim('');
    };

    recognitionRef.current = rec;
    rec.start();
    setMicActive(true);
  }

  function stopMic() {
    recognitionRef.current?.stop();
    setMicActive(false);
    setMicInterim('');
  }

  async function handleAnalyze() {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeCall(
        transcript,
        company,
        personaName,
        personaRole,
        inputMode === 'mic',
      );
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const liveTranscript = transcript + (micInterim ? micInterim : '');

  return (
    <div>
      <div className="section-title">Call Intelligence</div>

      {/* Input mode switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={`btn ${inputMode === 'text' ? 'btn--primary' : ''}`}
          onClick={() => setInputMode('text')}
        >
          Paste Transcript
        </button>
        <button
          className={`btn ${inputMode === 'mic' ? 'btn--primary' : ''}`}
          onClick={() => setInputMode('mic')}
        >
          🎙 Live Mic Recording
        </button>
      </div>

      {/* Persona fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="field">
          <label className="field__label">Contact Name</label>
          <input
            className="field__input"
            value={personaName}
            onChange={(e) => setPersonaName(e.target.value)}
            placeholder="e.g. Maya Chen"
          />
        </div>
        <div className="field">
          <label className="field__label">Contact Role</label>
          <input
            className="field__input"
            value={personaRole}
            onChange={(e) => setPersonaRole(e.target.value)}
            placeholder="e.g. Consumer Insights Manager"
          />
        </div>
      </div>

      {/* ── MIC MODE ── */}
      {inputMode === 'mic' && (
        <div>
          <div
            style={{
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: 12,
              color: 'var(--text-2)',
              lineHeight: 1.6,
            }}
          >
            Press <strong style={{ color: 'var(--accent-2)' }}>Start Recording</strong> and have your sales conversation.
            The AI will transcribe it live, then analyze your pitch quality, talk ratio, filler words, and give you a score.
          </div>

          {/* Mic button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <button
              className={`mic-btn ${micActive ? 'mic-btn--active' : ''}`}
              onClick={micActive ? stopMic : startMic}
            >
              <span className="mic-btn__icon">{micActive ? '⏹' : '🎙'}</span>
              <span>{micActive ? 'Stop Recording' : 'Start Recording'}</span>
              {micActive && <span className="mic-btn__pulse" />}
            </button>
            {micActive && (
              <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="mic-recording-dot" />
                Recording live…
              </div>
            )}
          </div>

          {micError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
              {micError}
            </div>
          )}

          {liveTranscript && (
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 16,
                marginBottom: 16,
                minHeight: 120,
                maxHeight: 260,
                overflowY: 'auto',
                fontSize: 13,
                lineHeight: 1.7,
                color: 'var(--text-2)',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 8 }}>
                Live Transcript
              </div>
              <span>{transcript}</span>
              {micInterim && <span style={{ color: 'var(--text-3)' }}>{micInterim}</span>}
            </div>
          )}

          {transcript && !micActive && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                className="btn btn--primary"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? 'Analyzing Pitch…' : 'Analyze Pitch with AI'}
              </button>
              <button className="btn btn--ghost" onClick={() => { setTranscript(''); setAnalysis(null); }}>
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TEXT MODE ── */}
      {inputMode === 'text' && (
        <div>
          <div className="field">
            <label className="field__label">
              Call Transcript or Notes
              <button
                className="btn"
                style={{ marginLeft: 8, fontSize: 10, padding: '2px 8px' }}
                onClick={loadExample}
              >
                Load Example
              </button>
            </label>
            <textarea
              className="field__textarea"
              style={{ minHeight: 220, fontSize: 12, lineHeight: 1.7 }}
              placeholder="Paste your call transcript, call recording notes, or a summary of what was discussed..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            <button
              className="btn btn--primary"
              onClick={handleAnalyze}
              disabled={loading || !transcript.trim()}
            >
              {loading ? 'Analyzing…' : 'Analyze Call with AI'}
            </button>
            {transcript && (
              <button className="btn btn--ghost" onClick={() => { setTranscript(''); setAnalysis(null); }}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-2)', fontSize: 13 }}>
          <div className="ai-spinner" style={{ margin: '0 auto 16px' }} />
          {inputMode === 'mic' ? 'AI is scoring your pitch and generating insights…' : 'AI is analyzing your call and drafting follow-ups…'}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {analysis && !loading && <InsightCard analysis={analysis} onCopied={onCopied} />}

      {!analysis && !loading && !transcript && inputMode === 'text' && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--text-3)', fontSize: 13 }}>
          Paste a call transcript or notes above, then hit Analyze to get instant follow-up suggestions,
          objection handling, a ready-to-send email, and deal stage assessment.
        </div>
      )}
    </div>
  );
}
