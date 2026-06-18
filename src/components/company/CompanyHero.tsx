import { useState, useEffect } from 'react';
import type { Company } from '@/types';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { fetchCompanyNews, type NewsArticle } from '@/lib/newsApi';

interface CompanyHeroProps {
  company: Company;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  return `${m}mo ago`;
}

function DonutRing({ share, key: _k }: { share: number; key?: string }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(0);

  useEffect(() => {
    setDash(0);
    const id = setTimeout(() => setDash((share / 100) * circ), 80);
    return () => clearTimeout(id);
  }, [share, circ]);

  return (
    <div className="donut-ring">
      <svg viewBox="0 0 100 100" className="donut-ring__svg">
        <defs>
          <linearGradient id="donutGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" className="donut-ring__track" strokeWidth="7" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke="url(#donutGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="donut-ring__center">
        <div className="donut-ring__num">{share}%</div>
        <div className="donut-ring__sub">Gen Z</div>
      </div>
    </div>
  );
}

const PLATFORM_COLOR: Record<string, string> = {
  TikTok: '#f43f5e',
  Instagram: '#a855f7',
  YouTube: '#ef4444',
};

function StatBar({ pct }: { pct: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(id);
  }, [pct]);
  return (
    <div className="stat-bar">
      <div
        className="stat-bar__fill"
        style={{ width: `${width}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </div>
  );
}

export function CompanyHero({ company }: CompanyHeroProps) {
  const [liveNews, setLiveNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(false);
  const gz = company.genZStats;
  const platformColor = PLATFORM_COLOR[gz.topPlatform] ?? '#7c3aed';

  useEffect(() => {
    setLiveNews([]);
    setNewsError(false);
    setNewsLoading(true);
    fetchCompanyNews(company.id, company.name, 4)
      .then(setLiveNews)
      .catch(() => setNewsError(true))
      .finally(() => setNewsLoading(false));
  }, [company.id]);

  return (
    <div className="hero">
      {/* Company identity row */}
      <div className="hero__top">
        <CompanyLogo key={company.id} id={company.id} domain={company.domain} name={company.name} size={60} />
        <div className="hero__info">
          <div className="hero__name">{company.name}</div>
          <div className="hero__meta">
            <span className="hero__meta-item">Founded {company.founded}</span>
            <span className="hero__meta-sep">·</span>
            <span className="hero__meta-item">{company.hq}</span>
            <span className="hero__meta-sep">·</span>
            <span className="hero__meta-item">{company.size}</span>
            <span className="hero__meta-sep">·</span>
            <span className="hero__meta-item">{company.revenue}</span>
          </div>
          <div className="hero__ceo">CEO — {company.ceo}</div>
          <div className="hero__tags">
            {company.tags.map((tag) => (
              <span key={tag} className="tag tag--purple">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Gen Z Intelligence Dashboard */}
      <div className="genz-dash">
        <div className="genz-dash__label">Gen Z Intelligence</div>

        <div className="genz-dash__main">
          {/* Donut ring */}
          <DonutRing key={company.id} share={gz.customerShare} />

          {/* Stats grid */}
          <div className="genz-dash__stats">
            {/* Revenue share */}
            <div className="genz-stat genz-stat--accent">
              <div className="genz-stat__top">
                <span className="genz-stat__val">{gz.revenueShare}%</span>
                <span className="genz-stat__badge" style={{ background: 'rgba(124,58,237,0.12)', color: '#a855f7' }}>Revenue</span>
              </div>
              <div className="genz-stat__key">Est. Gen Z Revenue Share</div>
              <StatBar pct={gz.revenueShare} />
            </div>

            {/* Social reach */}
            <div className="genz-stat">
              <div className="genz-stat__top">
                <span className="genz-stat__val">{gz.socialFollowers}</span>
                <span
                  className="genz-stat__badge"
                  style={{ background: `${platformColor}18`, color: platformColor }}
                >
                  {gz.topPlatform}
                </span>
              </div>
              <div className="genz-stat__key">Social Reach</div>
              <div className="genz-stat__bar-accent" style={{ background: platformColor }} />
            </div>

            {/* Campus */}
            <div className="genz-stat">
              <div className="genz-stat__top">
                <span className="genz-stat__val genz-stat__val--sm">{gz.campusPresence}</span>
              </div>
              <div className="genz-stat__key">Campus Footprint</div>
              <div className="genz-stat__bar-accent" style={{ background: '#10b981' }} />
            </div>

          </div>
        </div>

        {/* Cold call hook */}
        <div className="genz-dash__hook">
          <div className="genz-dash__hook-label">
            Cold Call Angle
          </div>
          <p className="genz-dash__hook-text">{gz.coldCallHook}</p>
        </div>

        {/* Key data callout */}
        <div className="genz-dash__callout">
          <span className="genz-dash__callout-icon">📊</span>
          <span className="genz-dash__callout-text">{gz.coldCallStat}</span>
        </div>
      </div>

      {/* Recent News */}
      <div className="hero__news">
        <div className="hero__news-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Recent News
          {newsLoading && <span className="news-live-dot" />}
          {!newsLoading && liveNews.length > 0 && <span className="news-live-badge">LIVE</span>}
        </div>

        {newsLoading && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>
            Fetching latest news…
          </div>
        )}

        {!newsLoading && newsError && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>
            Could not load news right now. Try refreshing the page.
          </div>
        )}

        {!newsLoading && !newsError && liveNews.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>
            No recent news found for {company.name}.
          </div>
        )}

        {!newsLoading && liveNews.length > 0 && (
          <ul className="hero__news-list">
            {liveNews.map((article, i) => (
              <li key={i} className="hero__news-item">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="hero__news-link">
                  {article.title}
                </a>
                <span className="hero__news-meta">
                  {article.source && <span>{article.source}</span>}
                  {article.published_at && <span>{timeAgo(article.published_at)}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
