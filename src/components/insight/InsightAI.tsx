import { useState, useEffect } from 'react';
import { analyzeVideoUrl, detectPlatform, type VideoInsight } from '@/lib/insightAnalysis';

const PLATFORM_COLORS: Record<string, string> = {
  TikTok: '#ff0050',
  Instagram: '#e1306c',
  YouTube: '#ff0000',
  Facebook: '#1877f2',
  'Social Media': '#7c3aed',
};

const PLATFORM_ICONS: Record<string, string> = {
  TikTok: '🎵',
  Instagram: '📸',
  YouTube: '▶️',
  Facebook: '📘',
  'Social Media': '📱',
};

function getScoreColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Exceptional';
  if (score >= 65) return 'Strong';
  if (score >= 50) return 'Average';
  return 'Low';
}

function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="ia-bar">
      <div
        className="ia-bar__fill"
        style={{ width: `${width}%`, background: color, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="ia-list">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function InsightCard({
  title, icon, children, accent,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="ia-card" style={accent ? { borderTopColor: accent } : undefined}>
      <div className="ia-card__head">
        <span className="ia-card__icon">{icon}</span>
        <span className="ia-card__title">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Results({
  insight,
  thumbnailUrl,
  onExport,
}: {
  insight: VideoInsight;
  thumbnailUrl?: string;
  onExport: () => void;
}) {
  const platform = insight.videoMeta.platform;
  const pColor = PLATFORM_COLORS[platform] ?? '#7c3aed';
  const pIcon = PLATFORM_ICONS[platform] ?? '📱';

  return (
    <div className="ia-results" id="ia-print-area">
      {/* Action bar */}
      <div className="ia-results__bar no-print">
        <div className="ia-platform-badge" style={{ background: `${pColor}18`, color: pColor }}>
          {pIcon} {platform} Analysis
        </div>
        <button className="ia-export-btn" onClick={onExport}>
          Export PDF
        </button>
      </div>

      {/* Row 1: Video card + Engagement/Sentiment */}
      <div className="ia-grid-2">
        {/* Video metadata */}
        <div className="ia-video-card">
          <div
            className="ia-thumb"
            style={!thumbnailUrl ? { background: `${pColor}18` } : undefined}
          >
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="Thumbnail" className="ia-thumb__img" />
            ) : (
              <span className="ia-thumb__icon">{pIcon}</span>
            )}
          </div>
          <div className="ia-video-meta">
            <div className="ia-video-title">{insight.videoMeta.title}</div>
            <div className="ia-video-creator">by {insight.videoMeta.creator}</div>
            <div className="ia-video-stats">
              <span>👀 {insight.videoMeta.estimatedViews}</span>
              <span>❤️ {insight.videoMeta.estimatedLikes}</span>
              <span>💬 {insight.videoMeta.estimatedComments}</span>
              <span>📤 {insight.videoMeta.estimatedShares}</span>
            </div>
            <div className="ia-video-date">{insight.videoMeta.publishDate}</div>
          </div>
        </div>

        {/* Score + Sentiment */}
        <div className="ia-col-gap">
          <div className="ia-score-card">
            <div className="ia-score-label">Engagement Score</div>
            <div className="ia-score-num" style={{ color: getScoreColor(insight.engagementScore) }}>
              {insight.engagementScore}
              <span className="ia-score-denom">/100</span>
            </div>
            <div className="ia-score-sub">{getScoreLabel(insight.engagementScore)}</div>
          </div>

          <InsightCard title="Sentiment Analysis" icon="💬">
            <div className="ia-sentiment">
              {([
                { label: 'Positive', pct: insight.sentiment.positive, color: '#10b981' },
                { label: 'Neutral', pct: insight.sentiment.neutral, color: '#f59e0b' },
                { label: 'Negative', pct: insight.sentiment.negative, color: '#ef4444' },
              ] as const).map(({ label, pct, color }) => (
                <div key={label} className="ia-sentiment__row">
                  <span className="ia-sentiment__lbl">{label}</span>
                  <AnimatedBar pct={pct} color={color} />
                  <span className="ia-sentiment__pct" style={{ color }}>{pct}%</span>
                </div>
              ))}
            </div>
          </InsightCard>
        </div>
      </div>

      {/* Row 2: Topics, Complaints, Feature Requests */}
      <div className="ia-grid-3">
        <InsightCard title="Top Discussion Topics" icon="🔥">
          <div className="ia-chips">
            {insight.topTopics.map((t, i) => (
              <span key={i} className="ia-chip">{t}</span>
            ))}
          </div>
        </InsightCard>
        <InsightCard title="Common Complaints" icon="⚠️">
          <BulletList items={insight.commonComplaints} />
        </InsightCard>
        <InsightCard title="Feature Requests" icon="✨">
          <BulletList items={insight.featureRequests} />
        </InsightCard>
      </div>

      {/* Gen Z section */}
      <div className="ia-genz-section">
        <div className="ia-genz-head">
          <div className="ia-genz-title">
            Gen Z Insight
            <span className="ia-genz-badge">🧠 AI Analysis</span>
          </div>
          <div className="ia-genz-align">
            Alignment Score:&nbsp;
            <strong style={{ color: '#a855f7' }}>{insight.genZ.alignmentScore}%</strong>
          </div>
        </div>

        <div className="ia-grid-2">
          <InsightCard title="What Gen Z Loves" icon="❤️" accent="#10b981">
            <BulletList items={insight.genZ.likes} />
          </InsightCard>
          <InsightCard title="Pain Points" icon="😤" accent="#ef4444">
            <BulletList items={insight.genZ.dislikes} />
          </InsightCard>
        </div>
        <div className="ia-grid-2">
          <InsightCard title="Content That Resonates" icon="📣" accent="#a855f7">
            <BulletList items={insight.genZ.resonates} />
          </InsightCard>
          <InsightCard title="Product Improvements" icon="🚀" accent="#f59e0b">
            <BulletList items={insight.genZ.productImprovements} />
          </InsightCard>
        </div>
      </div>

      {/* Viral + Purchase Intent */}
      <div className="ia-grid-2">
        <InsightCard title="Viral Indicators" icon="🚀">
          <BulletList items={insight.viralIndicators} />
        </InsightCard>
        <InsightCard title="Purchase Intent Signals" icon="🛒">
          <BulletList items={insight.purchaseIntentIndicators} />
        </InsightCard>
      </div>

      {/* Executive Summary */}
      <div className="ia-summary">
        <div className="ia-summary__head">
          <span>📋</span>
          <span className="ia-summary__title">Executive Summary</span>
        </div>
        <p className="ia-summary__text">{insight.executiveSummary}</p>
      </div>
    </div>
  );
}

export function InsightAI() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ insight: VideoInsight; thumbnailUrl?: string } | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    setPlatform(val.trim() ? detectPlatform(val.trim()) : '');
  };

  const handleAnalyze = async () => {
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeVideoUrl(url.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pColor = PLATFORM_COLORS[platform] ?? '#7c3aed';
  const pIcon = PLATFORM_ICONS[platform] ?? '📱';

  return (
    <div className="ia-page">
      {/* Page header */}
      <div className="ia-header">
        <div className="ia-header__eyebrow">Powered by NVIDIA NIM</div>
        <h1 className="ia-header__title">Gen Z Insight AI</h1>
        <p className="ia-header__sub">
          Paste a TikTok, Instagram Reel, YouTube Short, or Facebook video URL for AI-powered Gen Z audience analysis.
        </p>
      </div>

      {/* URL input */}
      <div className="ia-input-section no-print">
        <div className="ia-input-row">
          <div className="ia-input-wrap">
            <input
              className="ia-url-input"
              type="url"
              placeholder="Paste video URL — TikTok, Instagram Reel, YouTube Short, Facebook…"
              value={url}
              onChange={handleUrlChange}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            {platform && (
              <span
                className="ia-platform-pill"
                style={{ background: `${pColor}18`, color: pColor }}
              >
                {pIcon} {platform}
              </span>
            )}
          </div>
          <button
            className="ia-analyze-btn"
            onClick={handleAnalyze}
            disabled={!url.trim() || loading}
          >
            {loading ? <span className="ia-btn-spinner" /> : 'Analyze'}
          </button>
        </div>

        <div className="ia-platform-row">
          {['TikTok', 'Instagram', 'YouTube', 'Facebook'].map((p) => (
            <span
              key={p}
              className="ia-platform-tag"
              style={{ color: PLATFORM_COLORS[p], background: `${PLATFORM_COLORS[p]}12`, borderColor: `${PLATFORM_COLORS[p]}30` }}
            >
              {PLATFORM_ICONS[p]} {p}
            </span>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="ia-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="ia-loading">
          <div className="ia-loading__ring" />
          <div className="ia-loading__text">Analyzing with NVIDIA NIM…</div>
          <div className="ia-loading__sub">Fetching metadata · Running AI analysis · Generating Gen Z insights</div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <Results
          insight={result.insight}
          thumbnailUrl={result.thumbnailUrl}
          onExport={() => window.print()}
        />
      )}
    </div>
  );
}
