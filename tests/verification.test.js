// Verification tests added during the 18 to 19 Nov 2026 review.
// Run with: node --test tests/*.test.js
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkDataNotes, windowNote } from '../src/deepDive.js';
import { distanceKm, eligibleOptions, normaliseWeights, rankOptions } from '../src/finderScoring.js';
import { lookupPostal, postalCode } from '../src/finderPostal.js';
import { explanation, lookupLocal, recoveryActions } from '../src/preschoolFinder.js';
import { tableauViews } from '../src/tableauConfig.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const json = (path) => JSON.parse(read(path));
const finder = json('../public/data/preschool-finder.json');
const budget = json('../public/data/budget-options.json');
const paths = json('../public/data/availability-paths.json');
const placeholder = /^(|na|n\/a|nil|null|-)$/i;

const month = '2027-01';
const programme = 'Nursery 1';
const origin = { point: [1.35, 103.8] };
const base = { origin, programme, month, radius: 3, fee: 100000, availableOnly: false, scheme: '' };
const fixture = (centres) => ({ months: [month], programmes: { [programme]: [month] }, centres });
const centre = (fee, status, point = origin.point, scheme = 'Anchor Operator') =>
  ({ point, scheme, programmes: { [programme]: [fee, status] } });

// Satisfies every hard filter of the search.
function satisfiesFilters(option, search) {
  return option.fee > 0 && option.fee <= search.fee
    && option.distance <= search.radius
    && (option.status === 'A' || (!search.availableOnly && option.status === 'L'))
    && (!search.scheme || option.centre.scheme === search.scheme)
    && Array.isArray(option.centre.point);
}

test('placeholder centre codes never become identifiers in the published data', () => {
  for (const code of Object.keys(finder.centres)) assert.doesNotMatch(code, placeholder);
  assert.equal(finder.audit.uncodedListingRows, 88);
  // Two uncoded centres at the same spot must not merge or match each other.
  assert.equal(Object.keys(finder.centres).filter((code) => code.trim() !== code).length, 0);
});

test('postal codes stay six-character strings, including leading zeros', () => {
  assert.equal(postalCode('018916'), '018916');
  assert.equal(postalCode(' S018916 '), '018916');
  assert.equal(postalCode('Singapore 018916'), '018916');
  assert.equal(postalCode('(018916)'), '018916');
  for (const bad of ['18916', '0189160', 'S 01891', '018 916', '']) assert.equal(postalCode(bad), null);
  const postals = Object.values(finder.centres).map((c) => c.postal).filter(Boolean);
  assert.ok(postals.every((p) => typeof p === 'string' && /^\d{6}$/.test(p)));
  assert.ok(postals.some((p) => p.startsWith('0')), 'expected central-area postal codes with a leading zero');
});

test('postal index shards use string keys that match their file prefix', () => {
  const dir = new URL('../public/data/postal/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  assert.deepEqual(files, '012345678'.split('').map((d) => `${d}.json`));
  for (const file of files) {
    const shard = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
    const keys = Object.keys(shard);
    assert.ok(keys.length > 0, file);
    for (const key of keys) {
      assert.match(key, /^\d{6}$/);
      assert.equal(key[0], file[0]);
    }
    for (const [address, lat, lng] of Object.values(shard).slice(0, 2000)) {
      assert.ok(address && lat >= 1.15 && lat <= 1.5 && lng >= 103.55 && lng <= 104.1);
    }
  }
});

test('invalid or unknown locations never yield an origin', async () => {
  assert.equal(await lookupPostal('912345'), null);
  assert.equal(await lookupPostal('12345'), null);
  assert.equal(await lookupPostal('abcdef'), null);
  assert.deepEqual(lookupLocal(finder.centres, ''), []);
  assert.deepEqual(lookupLocal(finder.centres, '!!!'), []);
  assert.deepEqual(lookupLocal(finder.centres, '999999'), []);
  assert.deepEqual(lookupLocal(finder.centres, 'zzqx nowhere road'), []);
  for (const match of lookupLocal(finder.centres, 'punggol')) {
    const [lat, lng] = match.point;
    assert.ok(match.label && lat >= 1.15 && lat <= 1.5 && lng >= 103.55 && lng <= 104.1);
  }
  // A postal code shared by several preschools at one point resolves to one origin.
  assert.equal(lookupLocal(finder.centres, '730848').length, 1);
});

test('programme fees in the finder agree with the separately built budget data', () => {
  // budget-options counts Available options per area from the same source rows,
  // using its own programme-to-fee-level join. Disagreement would reveal a wrong join.
  let compared = 0;
  for (const [label, months] of Object.entries(budget.groups)) {
    for (const [intended, group] of Object.entries(months)) {
      const i = finder.months.indexOf(intended);
      const available = Object.values(finder.centres)
        .map((c) => c.programmes[label]).filter((option) => option && option[1][i] === 'A');
      const known = available.map(([fee]) => fee).filter(Boolean).sort((a, b) => a - b);
      const histogram = group.areas.flatMap(([, , fees]) => fees.flatMap(([fee, n]) => Array(n).fill(fee)));
      const unknownInAreas = group.areas.reduce((sum, [, unknown]) => sum + unknown, 0);
      assert.equal(available.length, histogram.length + unknownInAreas + group.missingLocation, `${label} ${intended}`);
      assert.equal(available.length - known.length, group.missingFee, `${label} ${intended}`);
      const remaining = [...known];
      for (const fee of histogram) {
        const at = remaining.indexOf(fee);
        assert.ok(at >= 0, `${label} ${intended}: fee ${fee} missing from finder`);
        remaining.splice(at, 1);
      }
      compared++;
    }
  }
  assert.equal(compared, 28);
  // Programme fees differ within centres, so a join to the wrong level would show.
  const differing = Object.values(finder.centres).filter((c) =>
    c.programmes['Infant care']?.[0] && c.programmes['Nursery 1']?.[0]
    && c.programmes['Infant care'][0] !== c.programmes['Nursery 1'][0]).length;
  assert.ok(differing > 100);
});

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') quoted = false; else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; } else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, j) => [h.replace(/^﻿/, ''), r[j]])));
}

const affordabilityCsv = new URL('../src/preschool_access/Data/Processed/affordability_availability.csv', import.meta.url);
test('each programme takes the fee of its own service level (needs local source CSV)',
  { skip: !existsSync(affordabilityCsv) && 'source CSV is local only' }, () => {
    const levels = {
      Infant: ['Infant care', 'Infant (2 to 18 mths)'],
      PG: ['Playgroup', 'Playgroup (18 mths to 2 yrs old)'],
      N1: ['Nursery 1', 'Pre-Nursery (3 yrs old)'],
      N2: ['Nursery 2', 'Nursery (4 yrs old)'],
    };
    let checked = 0;
    for (const row of parseCsv(readFileSync(affordabilityCsv, 'utf8'))) {
      if (row.snapshot_date !== finder.snapshot || !levels[row.programme]) continue;
      const code = row.centre_code.trim();
      if (placeholder.test(code)) continue;
      const [label, level] = levels[row.programme];
      assert.ok(finder.centres[code], `${code} missing`);
      const option = finder.centres[code].programmes[label];
      if (!option) {
        // Programmes are omitted only when no month carries a usable status.
        assert.ok(!['Available', 'Limited', 'Full'].includes(row.vacancy_status), `${code} ${label} dropped`);
        continue;
      }
      if (row.citizenship === 'SC' && row.type_of_service === 'Full Day' && row.levels_offered === level && Number(row.fee_amount) > 0) {
        assert.equal(option[0], Math.round(Number(row.fee_amount) * 100), `${code} ${label}`);
        checked++;
      } else {
        assert.equal(option[0], null, `${code} ${label} should have no comparable fee`);
      }
    }
    assert.ok(checked > 39000, `only ${checked} fee rows checked`);
  });

test('boundaries are inclusive for fee ceiling and radius', () => {
  const edge = [1.35, 103.82];
  const radius = distanceKm(origin.point, edge);
  const search = { ...base, radius, fee: 50000 };
  const data = fixture({
    AtBoth: centre(50000, 'A', edge),
    OverFee: centre(50001, 'A', origin.point),
    Beyond: centre(100, 'A', [1.35, 103.8201]),
  });
  assert.deepEqual(eligibleOptions(data, search).eligible.map((x) => x.code), ['AtBoth']);
  const ranked = rankOptions(eligibleOptions(data, search).eligible, search, normaliseWeights({ fee: 1, distance: 1, availability: 1 }, false));
  assert.equal(ranked[0].components.fee, 0);
  assert.equal(ranked[0].components.distance, 0);
});

test('missing fees and coordinates are excluded and counted in the right places', () => {
  const far = [1.45, 103.8];
  const result = eligibleOptions(fixture({
    NoPointA: centre(1000, 'A', null),
    NoPointFull: centre(1000, 'F', null),
    NoPointOtherScheme: centre(1000, 'A', null, 'Partner Operator'),
    NoFeeNear: centre(null, 'L'),
    NoFeeFar: centre(null, 'A', far),
    NoFeeFull: centre(null, 'F'),
    Fine: centre(1000, 'A'),
  }), { ...base, scheme: 'Anchor Operator' });
  assert.deepEqual(result.eligible.map((x) => x.code), ['Fine']);
  assert.equal(result.missingCoordinates, 1, 'only options matching programme, month, status and scheme');
  assert.equal(result.unknownFees, 1, 'only otherwise eligible options within the radius');
});

test('ineligible options cannot reach the top five, however well they would score', () => {
  const centres = {};
  for (let i = 0; i < 6; i++) centres[`Bad${i}`] = centre(100, ['F', '-', 'F', '-', 'F', '-'][i]);
  centres.WrongScheme = centre(100, 'A', origin.point, 'Partner Operator');
  centres.TooFar = centre(100, 'A', [1.4, 103.8]);
  centres.TooDear = centre(100001, 'A');
  for (let i = 0; i < 7; i++) centres[`Ok${i}`] = centre(90000 - i, 'L', [1.35 + i * .002, 103.8]);
  const search = { ...base, scheme: 'Anchor Operator' };
  const { eligible } = eligibleOptions(fixture(centres), search);
  const top = rankOptions(eligible, search, normaliseWeights({ fee: 50, distance: 50, availability: 50 }, false)).slice(0, 5);
  assert.equal(top.length, 5);
  assert.ok(top.every((x) => x.code.startsWith('Ok') && satisfiesFilters(x, search)));
});

test('every ranked result on the real data satisfies the hard filters', () => {
  const origins = [[1.3521, 103.8198], [1.4043, 103.9021], [1.3329, 103.7436], [1.2834, 103.8607], [1.4382, 103.7890], [1.3496, 103.9568]];
  const weights = normaliseWeights({ fee: 30, distance: 80, availability: 10 }, false);
  let shown = 0;
  for (const point of origins) {
    for (const [label, months] of Object.entries(finder.programmes)) {
      for (const intended of [months[0], months[months.length - 1]]) {
        for (const [radius, fee, availableOnly, scheme] of [[1, 61000, false, ''], [3, 129000, true, ''], [5, 200000, false, 'Anchor Operator'], [10, 450000, true, 'Scheme unlisted']]) {
          const search = { origin: { point }, programme: label, month: intended, radius, fee, availableOnly, scheme };
          const { eligible } = eligibleOptions(finder, search);
          const ranked = rankOptions(eligible, search, availableOnly ? normaliseWeights({ fee: 30, distance: 80, availability: 10 }, true) : weights);
          assert.equal(ranked.length, eligible.length);
          for (const option of ranked) assert.ok(satisfiesFilters(option, search), `${option.code} ${label} ${intended}`);
          shown += Math.min(5, ranked.length);
        }
      }
    }
  }
  assert.ok(shown > 300);
});

test('score explanation matches the documented formula', () => {
  const search = { ...base, fee: 120000, radius: 5 };
  const { eligible } = eligibleOptions(fixture({
    Cheap: centre(30000, 'L', [1.37, 103.8]),
    Close: centre(110000, 'L', origin.point),
    Open: centre(100000, 'A', [1.36, 103.8]),
  }), search);
  for (const [raw, availableOnly] of [[{ fee: 50, distance: 50, availability: 50 }, false], [{ fee: 90, distance: 10, availability: 0 }, false], [{ fee: 10, distance: 90, availability: 100 }, true]]) {
    const weights = normaliseWeights(raw, availableOnly);
    const options = availableOnly ? eligible.filter((x) => x.status === 'A') : eligible;
    for (const option of rankOptions(options, search, weights)) {
      const fee = 100 * Math.max(0, 1 - option.fee / search.fee);
      const distance = 100 * Math.max(0, 1 - option.distance / search.radius);
      const availability = option.status === 'A' ? 100 : 50;
      assert.ok(Math.abs(option.components.fee - fee) < 1e-9);
      assert.ok(Math.abs(option.components.distance - distance) < 1e-9);
      assert.equal(option.components.availability, availability);
      const expected = fee * weights.fee + distance * weights.distance + availability * weights.availability;
      assert.ok(Math.abs(option.score - expected) < 1e-9);
      const text = explanation(option, weights);
      const top = Object.keys(weights).filter((k) => weights[k] > 0)
        .sort((a, b) => option.contributions[b] - option.contributions[a])[0];
      const named = { fee: 'Lower fees', distance: 'Shorter distance', availability: 'Reported availability' }[top];
      assert.ok(text.startsWith(`${named} contributed the most points.`), text);
      if (availableOnly) assert.doesNotMatch(text, /^Reported availability/);
    }
  }
});

test('Tableau embeds and fallback links use the three published view paths', () => {
  const expected = {
    geography: '2026-11-16-Visualisation_1_final/PreschoolAvailability',
    affordability: '2026-11-17-Visualisation_2_final/Dashboard2',
    persistence: '2026-11-16-Visualisation_3_final/Dashboard3-PersistentPreschoolConstraints',
  };
  assert.deepEqual(Object.keys(tableauViews), Object.keys(expected));
  for (const [key, path] of Object.entries(expected)) {
    const view = tableauViews[key];
    assert.equal(view.openUrl, `https://public.tableau.com/views/${path}`);
    assert.ok(view.src.startsWith(`${view.openUrl}?`));
    assert.ok(view.width > 0 && view.height > 0);
  }
});

test('browser code has no storage, beacons or unexpected network destinations', () => {
  const files = ['main.js', 'preschoolFinder.js', 'finderPostal.js', 'finderMap.js', 'finderScoring.js', 'finderSection.js', 'deepDive.js', 'tableauEmbed.js'];
  for (const file of files) {
    const source = read(`../src/${file}`);
    assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|sendBeacon|indexedDB|XMLHttpRequest|WebSocket/, file);
    for (const [, target] of source.matchAll(/fetch\(\s*([^,)]+)/g)) {
      assert.match(target, /^`\$\{import\.meta\.env\.BASE_URL\}data\/|^'\/api\/preschool-geocode'$/, `${file}: ${target}`);
    }
  }
  // The OneMap fallback is only reachable behind the explicit build flag.
  const finderSource = read('../src/preschoolFinder.js');
  const call = finderSource.indexOf("fetch('/api/preschool-geocode'");
  assert.ok(finderSource.lastIndexOf("import.meta.env.VITE_ONEMAP_LOOKUP === 'true'", call) > finderSource.lastIndexOf('addEventListener', call));
});

test('deep dive JSON is internally consistent', () => {
  assert.equal(paths.dates.length, 5);
  for (const months of Object.values(paths.groups)) {
    for (const group of Object.values(months)) {
      for (const [key, n] of group.paths) {
        assert.match(key, /^[012]{5}$/);
        assert.ok(Number.isInteger(n) && n > 0);
      }
    }
  }
  for (const months of Object.values(budget.groups)) {
    for (const group of Object.values(months)) {
      for (const [index, unknown, fees] of group.areas) {
        assert.ok(budget.areas[index] && Number.isInteger(unknown));
        assert.ok(fees.every(([fee, n], i) => fee > 0 && n > 0 && (i === 0 || fees[i - 1][0] < fee)));
      }
    }
  }
});

test('no-result recovery suggestions read as one list and match the search', () => {
  assert.equal(recoveryActions({ radius: 3, availableOnly: false, scheme: '' }),
    'widen the radius, revise the fee limit or compare another supported start month');
  assert.equal(recoveryActions({ radius: 10, availableOnly: true, scheme: 'Anchor Operator' }),
    'revise the fee limit, compare another supported start month, include Limited reports or remove the scheme restriction');
});

test('listing month anchors are explicit and the 12 Oct download reads from September 2026', (t) => {
  const python = spawnSync('python3', ['-I', '-B', '-c', [
    'import json, sys', `sys.path.insert(0, ${JSON.stringify(fileURLToPath(new URL('../scripts/', import.meta.url)))})`,
    'import prepare_deep_dive as p',
    "print(json.dumps({'anchors': p.LISTING_MONTHS, 'current': p.month(p.LISTING_MONTHS['2026-10-12'], 0), 'third': p.month(p.LISTING_MONTHS['2026-10-12'], 2)}))",
  ].join('\n')], { encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
  if (python.error) return t.skip('python3 unavailable');
  assert.equal(python.status, 0, python.stderr);
  const { anchors, current, third } = JSON.parse(python.stdout);
  assert.deepEqual(anchors, { '2026-10-12': '2026-09', '2026-10-19': '2026-10', '2026-10-24': '2026-10', '2026-11-01': '2026-11', '2026-11-14': '2026-11' });
  assert.equal(current, '2026-09');
  assert.equal(third, '2026-11');
  assert.deepEqual(paths.dataMonths, paths.dates.map((d) => anchors[d]));
  assert.equal(paths.lastUpdated[0], '2026-09-24');
});

test('availability paths use the realigned five-check window and reproduce the agreed figures', () => {
  for (const months of Object.values(paths.groups)) {
    assert.deepEqual(Object.keys(months), ['2026-11', '2026-12', '2027-01', '2027-02', '2027-03']);
  }
  const total = Object.values(paths.groups).flatMap((m) => Object.values(m))
    .reduce((sum, g) => sum + g.paths.reduce((s, [, n]) => s + n, 0), 0);
  assert.equal(total, 29765);
  const counts = Object.fromEntries(paths.groups.Playgroup['2026-11'].paths);
  const sum = (test) => Object.entries(counts).filter(([key]) => test(key)).reduce((s, [, n]) => s + n, 0);
  assert.equal(sum(() => true), 1652);
  assert.equal(sum((k) => k[0] === '2'), 595);
  assert.deepEqual(['0', '1', '2'].map((s) => sum((k) => k[0] === '2' && k[4] === s)), [13, 41, 541]);
  assert.equal(counts['22222'], 531);
  assert.equal(sum((k) => k[0] === '2' && k[4] === '2' && k !== '22222'), 10);
  assert.equal(sum((k) => !k.includes('0')), 987);
});

test('deep dive labels the September data in the 12 Oct check', () => {
  assert.deepEqual(checkDataNotes(paths), ['ECDA data to 24 Sept', '', '', '', '']);
  const note = windowNote(paths, Object.keys(paths.groups.Playgroup));
  assert.match(note, /downloaded on 12 Oct 2026 reflects ECDA data last updated by 24 September 2026/);
  assert.match(note, /November 2026 to March 2027/);
  assert.equal(checkDataNotes({ dates: ['2026-11-14'], dataMonths: ['2026-11'], lastUpdated: ['2026-11-13'] })[0], '');
});
