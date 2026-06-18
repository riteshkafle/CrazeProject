export default async function handler(req, res) {
  const { path, ...query } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : (path ?? '');
  const qs = new URLSearchParams(query).toString();
  const url = `https://api.hunter.io/${pathStr}${qs ? `?${qs}` : ''}`;

  try {
    const upstream = await fetch(url);
    const text = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    res.status(upstream.status).send(text);
  } catch (err) {
    res.status(500).json({ error: 'Hunter proxy error', detail: String(err) });
  }
}
