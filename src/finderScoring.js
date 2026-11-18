export const factors = { fee: 'Lower fees', distance: 'Shorter distance', availability: 'Reported availability' };
export const statusLabels = { A: 'Available', L: 'Limited' };

export function normaliseWeights(weights, availableOnly) {
  const active = { ...weights, availability: availableOnly ? 0 : weights.availability };
  const total = active.fee + active.distance + active.availability;
  return total ? Object.fromEntries(Object.keys(factors).map((key) => [key, active[key] / total])) : null;
}

export function distanceKm([lat1, lng1], [lat2, lng2]) {
  const rad = (value) => value * Math.PI / 180;
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(h, 1)));
}

export function eligibleOptions(data, search) {
  const month = data.months.indexOf(search.month);
  if (month < 0 || !data.programmes[search.programme]?.includes(search.month)) {
    throw new RangeError('Choose a supported programme and start month.');
  }
  const eligible = [];
  let unknownFees = 0;
  let missingCoordinates = 0;
  for (const [code, centre] of Object.entries(data.centres)) {
    const option = centre.programmes[search.programme];
    if (!option || (search.scheme && centre.scheme !== search.scheme)) continue;
    const [fee, path] = option;
    const status = path[month];
    if (status !== 'A' && (search.availableOnly || status !== 'L')) continue;
    if (!centre.point) {
      missingCoordinates++;
      continue;
    }
    const distance = distanceKm(search.origin.point, centre.point);
    if (distance > search.radius) continue;
    if (!(fee > 0)) {
      unknownFees++;
      continue;
    }
    if (fee > search.fee) continue;
    eligible.push({ code, centre, fee, status, distance });
  }
  return { eligible, unknownFees, missingCoordinates };
}

export function rankOptions(eligible, search, weights) {
  const component = (ratio) => 100 * Math.max(0, Math.min(1, 1 - ratio));
  return eligible.map((option) => {
    const components = {
      fee: component(option.fee / search.fee),
      distance: component(option.distance / search.radius),
      availability: option.status === 'A' ? 100 : 50,
    };
    const contributions = Object.fromEntries(Object.keys(factors).map((key) => [key, components[key] * weights[key]]));
    const score = Math.min(100, Object.values(contributions).reduce((sum, value) => sum + value, 0));
    return { ...option, components, contributions, score };
  }).sort((a, b) => b.score - a.score || a.distance - b.distance || a.fee - b.fee || a.code.localeCompare(b.code, 'en'));
}
