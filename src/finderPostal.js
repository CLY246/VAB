export function postalCode(query) {
  return query.trim().match(/^(?:(?:Singapore|S)\s*)?\(?([0-9]{6})\)?$/i)?.[1] ?? null;
}

const postalFiles = new Map();

export async function lookupPostal(code) {
  if (!/^[0-8][0-9]{5}$/.test(code)) return null;
  const prefix = code[0];
  if (!postalFiles.has(prefix)) {
    postalFiles.set(prefix, fetch(`${import.meta.env.BASE_URL}data/postal/${prefix}.json`, {
      signal: AbortSignal.timeout(8000),
    }).then((response) => {
      if (!response.ok) throw new Error('Postal index unavailable');
      return response.json();
    }).catch((error) => {
      postalFiles.delete(prefix);
      throw error;
    }));
  }
  const file = await postalFiles.get(prefix);
  const location = file[code];
  if (!location) return null;
  const [address, lat, lng] = location;
  return { label: `${address}, Singapore ${code}`, point: [lat, lng], source: 'April 2026 OneMap address snapshot' };
}
