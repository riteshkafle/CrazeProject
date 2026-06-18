export default async function handler(req, res) {
  const { ...query } = req.query;
  const qs = new URLSearchParams(query).toString();
  const upstream = await fetch(`https://api.hunter.io/v2/domain-search?${qs}`);
  const text = await upstream.text();
  res.setHeader('Content-Type', 'application/json');
  res.status(upstream.status).send(text);
}
