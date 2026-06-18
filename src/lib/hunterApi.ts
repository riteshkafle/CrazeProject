const HUNTER_KEY = import.meta.env.VITE_HUNTER_API_KEY as string;

export interface HunterPerson {
  first_name: string;
  last_name: string;
  position: string;
  email: string;
  linkedin: string | null;
  confidence: number;
  department: string;
}

export interface HunterEmailResult {
  email: string;
  score: number;
  first_name: string;
  last_name: string;
  position: string;
  linkedin: string | null;
}

export async function hunterDomainSearch(domain: string, limit = 10): Promise<HunterPerson[]> {
  const url = `/api/hunter-domain?domain=${encodeURIComponent(domain)}&limit=${limit}&api_key=${HUNTER_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Hunter.io ${res.status}${body ? `: ${body}` : ''}`);
  }
  const data = await res.json();
  const emails: HunterPerson[] = (data.data?.emails ?? []).map((e: Record<string, unknown>) => ({
    first_name: (e.first_name as string) ?? '',
    last_name: (e.last_name as string) ?? '',
    position: (e.position as string) ?? '',
    email: (e.value as string) ?? '',
    linkedin: (e.linkedin as string | null) ?? null,
    confidence: (e.confidence as number) ?? 0,
    department: (e.department as string) ?? '',
  }));
  return emails;
}

export async function hunterEmailFinder(
  domain: string,
  firstName: string,
  lastName: string,
): Promise<HunterEmailResult | null> {
  const url = `/api/hunter-email?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${HUNTER_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const d = data.data;
  if (!d?.email) return null;
  return {
    email: d.email,
    score: d.score ?? 0,
    first_name: d.first_name ?? firstName,
    last_name: d.last_name ?? lastName,
    position: d.position ?? '',
    linkedin: d.linkedin ?? null,
  };
}
