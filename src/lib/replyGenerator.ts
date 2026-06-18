import { nvidiaChat, parseJsonFromAI } from './nvidiaApi';
import { fetchCompanyNews, type NewsArticle } from './newsApi';
import type { Company } from '@/types';

export interface GeneratedReply {
  subject: string;
  body: string;
}

function buildNewsContext(articles: NewsArticle[]): string {
  if (articles.length === 0) return 'No recent news available.';
  return articles
    .slice(0, 4)
    .map((a, i) => `${i + 1}. "${a.title}" (${a.source || 'Unknown'})\n   ${a.description ?? ''}`)
    .join('\n');
}

function buildCompanyContext(company: Company): string {
  const gz = company.genZStats;
  const pains = company.pains.map((p) => `• ${p.title}: ${p.desc}`).join('\n');
  const whys = company.why.slice(0, 2).join(' / ');

  return `Company: ${company.name}
Industry: ${company.industry}
HQ: ${company.hq} | Founded: ${company.founded} | Revenue: ${company.revenue}

Gen Z Profile:
- ${gz.customerShare}% of customers are Gen Z
- ${gz.revenueShare}% of revenue from Gen Z
- Top platform: ${gz.topPlatform} (${gz.socialFollowers} followers)
- Campus footprint: ${gz.campusPresence}
- Key stat: ${gz.coldCallStat}
- Internal tension: ${gz.coldCallHook}

Pain Points:
${pains}

Why Craze fits: ${whys}`;
}

export async function generateSmartReply(
  company: Company,
  contactName: string,
  prospectReply: string,
): Promise<GeneratedReply> {
  const firstName = contactName.split(' ')[0] || 'them';

  let news: NewsArticle[] = [];
  try {
    news = await fetchCompanyNews(company.id, company.name, 5);
  } catch {
    // continue without news
  }

  const prompt = `You are a senior B2B sales strategist writing a follow-up email for a rep at Craze — a Gen Z consumer research platform (AI-moderated student interviews, 200+ verified campus panelists, 72-hour turnaround, free pilot available).

══ ACCOUNT INTELLIGENCE ══
${buildCompanyContext(company)}

══ RECENT ${company.name.toUpperCase()} NEWS ══
${buildNewsContext(news)}

══ PROSPECT'S REPLY ══
Contact: ${firstName} ${contactName.split(' ').slice(1).join(' ')} at ${company.name}
---
${prospectReply.trim()}
---

══ YOUR TASK ══
Write a reply email addressed to ${firstName} (use their real name — NEVER write "[Name]" or "[Representative Name]" or any placeholder).

Rules:
1. Open with "Hi ${firstName}," — use the real name, not a placeholder
2. Directly address what they said — mirror their tone and acknowledge their specific point
3. Weave in 1–2 recent news items naturally — proof you understand their world
4. Reference a specific Gen Z stat from their business
5. If objection → reframe with Craze's advantage (speed, authenticity, free pilot)
6. If interest → move to a specific next step (demo, pilot, 15-min call)
7. Keep body under 160 words
8. Close with ONE clear ask
9. Separate each paragraph with \\n\\n (two newlines) — do NOT write the whole email as one block

IMPORTANT: Your entire response must be ONLY this JSON object. Do not write anything before or after it:
{"subject":"Re: [specific subject line]","body":"Hi ${firstName},\\n\\n[paragraph 1]\\n\\n[paragraph 2]\\n\\n[closing]"}`;

  const result = await nvidiaChat(
    [
      {
        role: 'system',
        content: 'You are a JSON-only API. Respond with a single valid JSON object and nothing else. No prose, no markdown fences, no explanation.',
      },
      { role: 'user', content: prompt },
    ],
    { maxTokens: 1200, temperature: 0.7 },
  );

  return parseJsonFromAI<GeneratedReply>(result.content);
}
