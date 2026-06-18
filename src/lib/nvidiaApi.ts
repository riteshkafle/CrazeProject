const API_KEY = import.meta.env.VITE_NVIDIA_API_KEY as string;
const BASE_URL = '/api/nvidia';
const MODEL = 'meta/llama-3.1-70b-instruct';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface NvidiaChoice {
  message: {
    content: string | null;
    reasoning_content?: string;
  };
}

interface NvidiaResponse {
  choices: NvidiaChoice[];
}

export interface AIResult {
  content: string;
  reasoning?: string;
}

export async function nvidiaChat(
  messages: Message[],
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<AIResult> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.6,
      top_p: 0.95,
      max_tokens: options.maxTokens ?? 4096,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA API ${res.status}: ${text}`);
  }

  const data: NvidiaResponse = await res.json();
  const choice = data.choices[0];
  const rawContent = choice.message.content ?? '';
  const reasoning = choice.message.reasoning_content ?? '';

  let content = rawContent;
  if (!content.trim() && reasoning) {
    const braceIdx = reasoning.indexOf('{');
    const bracketIdx = reasoning.indexOf('[');
    const candidates = [braceIdx, bracketIdx].filter((i) => i >= 0);
    const start = candidates.length ? Math.min(...candidates) : -1;
    content = start >= 0 ? reasoning.slice(start) : reasoning;
  }

  return { content, reasoning };
}

export function parseJsonFromAI<T>(raw: string): T {
  if (!raw) throw new Error('Empty response from AI — the model returned no content.');
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonStr = (fenced ? fenced[1] : raw).trim();

  // Strip any leading prose before the first JSON structure
  const braceIdx = jsonStr.indexOf('{');
  const bracketIdx = jsonStr.indexOf('[');
  const candidates = [braceIdx, bracketIdx].filter((i) => i >= 0);
  if (candidates.length) {
    jsonStr = jsonStr.slice(Math.min(...candidates));
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    const lastObj = jsonStr.lastIndexOf('},');
    const lastArr = jsonStr.lastIndexOf('],');
    const lastClean = Math.max(lastObj !== -1 ? lastObj + 1 : -1, lastArr !== -1 ? lastArr + 1 : -1);
    if (lastClean > 0) jsonStr = jsonStr.slice(0, lastClean);

    const openBraces = (jsonStr.match(/\{/g) ?? []).length;
    const closeBraces = (jsonStr.match(/\}/g) ?? []).length;
    const openBrackets = (jsonStr.match(/\[/g) ?? []).length;
    const closeBrackets = (jsonStr.match(/\]/g) ?? []).length;

    for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += '}';

    return JSON.parse(jsonStr) as T;
  }
}
