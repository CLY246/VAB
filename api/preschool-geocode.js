// Optional Vercel endpoint. Credentials remain server-side.
let credentials;

async function token() {
  if (credentials && credentials.expires > Date.now() + 60000) return credentials.token;
  const response = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ONEMAP_EMAIL, password: process.env.ONEMAP_EMAIL_PASSWORD }),
    signal: AbortSignal.timeout(8000),
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error('OneMap authentication unavailable');
  credentials = { token: result.access_token, expires: Number(result.expiry_timestamp) * 1000 };
  return credentials.token;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!process.env.ONEMAP_EMAIL || !process.env.ONEMAP_EMAIL_PASSWORD) return res.status(503).end();
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  if (query.length < 3 || query.length > 160) return res.status(400).end();

  try {
    const params = new URLSearchParams({ searchVal: query, returnGeom: 'Y', getAddrDetails: 'Y', pageNum: '1' });
    const response = await fetch(`https://www.onemap.gov.sg/api/common/elastic/search?${params}`, {
      headers: { Authorization: await token() },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) credentials = null;
      return res.status(502).end();
    }
    const result = await response.json();
    const matches = (result.results || []).filter((item) => !/^\d{6}$/.test(query) || item.POSTAL === query)
      .slice(0, 8).map((item) => ({
        label: item.ADDRESS,
        point: [Number(item.LATITUDE), Number(item.LONGITUDE)],
      })).filter(({ label, point: [lat, lng] }) => label && lat >= 1.15 && lat <= 1.5 && lng >= 103.55 && lng <= 104.1);
    return res.status(200).json(matches);
  } catch {
    return res.status(502).end();
  }
}
