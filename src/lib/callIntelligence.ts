import { nvidiaChat, parseJsonFromAI } from './nvidiaApi';
import type { Company, CallAnalysis } from '@/types';

export async function analyzeCall(
  transcript: string,
  company: Company,
  personaName: string,
  personaRole: string,
  includePitchMetrics = false,
): Promise<CallAnalysis> {
  const pitchBlock = includePitchMetrics ? `
  "pitchMetrics": {
    "pitchScore": 0-100 overall pitch quality,
    "talkRatio": estimated % of time the rep was talking (0-100),
    "questionsAsked": number of questions the rep asked,
    "fillerWords": ["um", "uh", "like", "basically", "you know", ...] (only ones actually detected),
    "strengths": ["specific strength 1", "specific strength 2"],
    "improvements": ["specific actionable improvement 1", "specific improvement 2", "specific improvement 3"],
    "openingStrength": 0-10 score for how strong the opening was,
    "closingStrength": 0-10 score for how strong the close/next-step ask was
  },` : '';

  const prompt = `You are an expert B2B sales coach and deal intelligence analyst for Craze — a Gen Z consumer insights platform that runs AI-moderated interviews with verified college students, delivering insights in 72 hours.

You just reviewed a sales call transcript/notes with ${personaName} (${personaRole}) at ${company.name} (${company.industry}).

CALL TRANSCRIPT / NOTES:
"""
${transcript}
"""

COMPANY CONTEXT:
- Company: ${company.name}
- Industry: ${company.industry}
- Top pain points: ${company.pains.map((p) => p.title).join(', ')}
- Why Craze fits: ${company.why[0]}

Analyze the call and return ONLY valid JSON in this exact format:
\`\`\`json
{
  "summary": "2-3 sentence plain-English summary of the call",
  "sentiment": "interested|neutral|cold",
  "sentimentScore": 0-100,
  "objections": ["exact objection 1", "exact objection 2"],
  "nextStep": "Single most important next action to move this deal forward",
  "dealStage": "discovery|qualified|proposal|negotiation|closed_won|closed_lost",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "followUpEmail": {
    "subject": "email subject line",
    "body": "full follow-up email body, personalized and ready to send"
  },
  "talkTrack": "A specific talk track or reframe to use in the NEXT call based on what you learned"${pitchBlock ? ',' : ''}
${pitchBlock}
}
\`\`\`

Be direct and specific. Prioritize actionable insights over general advice.`;

  const result = await nvidiaChat([{ role: 'user', content: prompt }], { maxTokens: 3500 });
  const parsed = parseJsonFromAI<CallAnalysis>(result.content);
  return { ...parsed, reasoning: result.reasoning };
}
