import { nvidiaChat, parseJsonFromAI } from './nvidiaApi';

export interface VideoInsight {
  videoMeta: {
    title: string;
    platform: string;
    creator: string;
    estimatedViews: string;
    estimatedLikes: string;
    estimatedComments: string;
    estimatedShares: string;
    publishDate: string;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topTopics: string[];
  commonComplaints: string[];
  featureRequests: string[];
  purchaseIntentIndicators: string[];
  viralIndicators: string[];
  engagementScore: number;
  genZ: {
    alignmentScore: number;
    likes: string[];
    dislikes: string[];
    resonates: string[];
    productImprovements: string[];
  };
  executiveSummary: string;
}

export function detectPlatform(url: string): string {
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
  return 'Social Media';
}

async function fetchOEmbed(
  url: string,
  platform: string,
): Promise<{ title?: string; author?: string; thumbnailUrl?: string }> {
  try {
    let oembedUrl = '';
    if (platform === 'YouTube') {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    } else if (platform === 'TikTok') {
      oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    } else {
      return {};
    }
    const res = await fetch(oembedUrl);
    if (!res.ok) return {};
    const data: { title?: string; author_name?: string; thumbnail_url?: string } = await res.json();
    return { title: data.title, author: data.author_name, thumbnailUrl: data.thumbnail_url };
  } catch {
    return {};
  }
}

export async function analyzeVideoUrl(
  url: string,
): Promise<{ insight: VideoInsight; thumbnailUrl?: string }> {
  const platform = detectPlatform(url);
  const oembed = await fetchOEmbed(url, platform);

  const metaContext = oembed.title
    ? `Known video title: "${oembed.title}"\nCreator: ${oembed.author ?? 'Unknown'}`
    : 'No pre-fetched metadata — infer from URL structure, creator identity, and platform context.';

  const prompt = `You are a Gen Z consumer intelligence analyst. Analyze this social media video URL and produce a comprehensive audience intelligence report.

URL: ${url}
Platform: ${platform}
${metaContext}

Base your analysis on:
- The URL, any visible creator handle, and content identifiers
- Platform-specific Gen Z audience behavior (${platform})
- Likely comment sentiment patterns for this content type and creator
- Brand/product/creator recognition if identifiable
- Industry category context

Respond with ONLY a valid JSON object — no markdown, no extra text:
{
  "videoMeta": {
    "title": "exact title if known, otherwise best inference",
    "platform": "${platform}",
    "creator": "creator name or @handle",
    "estimatedViews": "e.g. 2.3M",
    "estimatedLikes": "e.g. 145K",
    "estimatedComments": "e.g. 8.2K",
    "estimatedShares": "e.g. 52K",
    "publishDate": "approximate timeframe e.g. ~3 months ago"
  },
  "sentiment": {
    "positive": 68,
    "neutral": 22,
    "negative": 10
  },
  "topTopics": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"],
  "commonComplaints": ["complaint 1", "complaint 2", "complaint 3"],
  "featureRequests": ["request 1", "request 2", "request 3"],
  "purchaseIntentIndicators": ["signal 1", "signal 2", "signal 3"],
  "viralIndicators": ["indicator 1", "indicator 2", "indicator 3"],
  "engagementScore": 78,
  "genZ": {
    "alignmentScore": 82,
    "likes": ["what Gen Z loves 1", "what Gen Z loves 2", "what Gen Z loves 3"],
    "dislikes": ["pain point 1", "pain point 2"],
    "resonates": ["resonant element 1", "resonant element 2", "resonant element 3"],
    "productImprovements": ["improvement idea 1", "improvement idea 2", "improvement idea 3"]
  },
  "executiveSummary": "2-3 sentence business-friendly summary covering overall content performance, Gen Z alignment strength, and the top strategic opportunity for the brand or creator."
}`;

  const result = await nvidiaChat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 3500, temperature: 0.6 },
  );

  const insight = parseJsonFromAI<VideoInsight>(result.content);
  return { insight, thumbnailUrl: oembed.thumbnailUrl };
}
