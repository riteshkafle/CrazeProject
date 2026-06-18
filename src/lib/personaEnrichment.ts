import { nvidiaChat, parseJsonFromAI } from './nvidiaApi';
import { hunterDomainSearch, type HunterPerson } from './hunterApi';
import type { Company } from '@/types';

export interface EnrichedPersona {
  name: string;
  role: string;
  priority: 'p1' | 'p2';
  email: string;
  linkedin: string;
  focus: string;
  coldCallAngle: string;
  confidence: number;
}

const SENIOR_KEYWORDS = [
  'vp', 'vice president', 'director', 'chief', 'cmo', 'ceo', 'cco', 'coo', 'cto',
  'head of', 'president', 'founder', 'svp', 'evp', 'managing director', 'general manager',
];

const RELEVANT_KEYWORDS = [
  'marketing', 'brand', 'growth', 'insight', 'research', 'consumer', 'digital',
  'social', 'content', 'creative', 'communications', 'product', 'strategy', 'innovation',
];

function isSenior(title: string): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  return SENIOR_KEYWORDS.some((kw) => t.includes(kw));
}

function isRelevant(title: string): boolean {
  if (!title) return true; // include if no title rather than exclude
  const t = title.toLowerCase();
  return RELEVANT_KEYWORDS.some((kw) => t.includes(kw));
}

function resolveLinkedIn(person: HunterPerson, companyName: string): string {
  if (person.linkedin) {
    return person.linkedin.startsWith('http') ? person.linkedin : `https://${person.linkedin}`;
  }
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${person.first_name} ${person.last_name} ${companyName}`)}`;
}

interface NIMRow {
  priority: 'p1' | 'p2';
  focus: string;
  coldCallAngle: string;
}

async function nimEnrich(people: HunterPerson[], company: Company): Promise<EnrichedPersona[]> {
  const list = people
    .map((p, i) => `${i + 1}. ${p.first_name} ${p.last_name} — ${p.position || p.department || 'Marketing'}`)
    .join('\n');

  const prompt = `You are a B2B sales intelligence expert helping a sales rep at Craze — a Gen Z consumer research platform (AI-moderated student interviews, 200+ verified campus panelists, 72-hour turnaround).

Company: ${company.name}
Industry: ${company.industry}
Pain points: ${company.pains.map((p) => p.title).join(' · ')}
Core pitch: ${company.why[0]}

Contacts (verified from company domain):
${list}

For each contact in the EXACT same order (${people.length} total):
- priority: "p1" if they control research or marketing budget / direct decision-maker; "p2" if influencer or secondary stakeholder
- focus: 1–2 sentences on their professional focus and why Craze directly applies to their role at ${company.name}
- coldCallAngle: one sharp, specific cold call opening line tailored to their title and ${company.name}'s pain points — not generic

Return ONLY a JSON array of exactly ${people.length} objects:
\`\`\`json
[{ "priority": "p1", "focus": "...", "coldCallAngle": "..." }]
\`\`\``;

  const result = await nvidiaChat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 4096, temperature: 0.5 },
  );

  const rows = parseJsonFromAI<NIMRow[]>(result.content);

  return people.map((p, i) => ({
    name: `${p.first_name} ${p.last_name}`.trim() || 'Unknown',
    role: p.position || p.department || 'Marketing',
    priority: rows[i]?.priority ?? 'p2',
    email: p.email,
    linkedin: resolveLinkedIn(p, company.name),
    focus: rows[i]?.focus ?? '',
    coldCallAngle: rows[i]?.coldCallAngle ?? '',
    confidence: p.confidence,
  }));
}

export async function buildPersonaPipeline(company: Company): Promise<EnrichedPersona[]> {
  const raw = await hunterDomainSearch(company.domain, 10);
  if (raw.length === 0) throw new Error('No contacts found for this domain.');

  // Filter to marketing/brand relevant roles, widen if too few
  const relevant = raw.filter((p) => isRelevant(p.position));
  const pool = relevant.length >= 2 ? relevant : raw;

  // Prefer senior within that pool
  const senior = pool.filter((p) => isSenior(p.position));
  const candidates = senior.length >= 3 ? senior : pool;

  const top = candidates
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);

  return nimEnrich(top, company);
}
