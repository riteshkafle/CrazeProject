import { useState, useEffect } from 'react';

interface CompanyLogoProps {
  id: string;
  domain: string;
  name: string;
  size?: number;
  className?: string;
}

const EXTS = ['svg', 'png', 'jpg', 'jpeg', 'webp'];

function buildSources(id: string, domain: string): string[] {
  return [
    ...EXTS.map((ext) => `/logos/${id}.${ext}`),
    `https://logo.clearbit.com/${domain}`,
  ];
}

export function CompanyLogo({ id, domain, name, size = 32, className }: CompanyLogoProps) {
  const sources = buildSources(id, domain);
  const [srcIndex, setSrcIndex] = useState(0);

  useEffect(() => { setSrcIndex(0); }, [id]);

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (srcIndex >= sources.length) {
    return (
      <div
        className={className}
        style={{
          width: size, height: size, borderRadius: 8,
          background: 'var(--surface-3)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.35, fontWeight: 700, color: 'var(--text-2)',
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={sources[srcIndex]}
      alt={`${name} logo`}
      width={size}
      height={size}
      onError={() => setSrcIndex((i) => i + 1)}
      className={className}
      style={{
        width: size, height: size, borderRadius: 8,
        objectFit: 'contain', background: '#fff', flexShrink: 0,
      }}
    />
  );
}
