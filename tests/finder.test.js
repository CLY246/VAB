import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { distanceKm, eligibleOptions, normaliseWeights, rankOptions } from '../src/finderScoring.js';

const programme = 'Nursery 1';
const month = '2027-01';
const search = { origin: { point: [1.35, 103.8] }, programme, month, radius: 3, fee: 100000, availableOnly: false, scheme: '' };
const centre = (fee, status, point = [1.35, 103.8], scheme = 'Anchor Operator') =>
  ({ point, scheme, programmes: { [programme]: [fee, status] } });
const fixture = (centres) => ({ months: [month], programmes: { [programme]: [month] }, centres });

test('weights normalise and Available only excludes availability from the total', () => {
  assert.deepEqual(normaliseWeights({ fee: 50, distance: 25, availability: 25 }, false), { fee: .5, distance: .25, availability: .25 });
  assert.deepEqual(normaliseWeights({ fee: 1, distance: 3, availability: 100 }, true), { fee: .25, distance: .75, availability: 0 });
  assert.equal(normaliseWeights({ fee: 0, distance: 0, availability: 100 }, true), null);
  assert.equal(normaliseWeights({ fee: 0, distance: 0, availability: 0 }, false), null);
});

test('filters enforce location, month, budget, vacancy, scheme and known fees before scoring', () => {
  const data = fixture({
    A: centre(50000, 'A'), L: centre(100000, 'L', search.origin.point, 'Partner Operator'),
    Full: centre(40000, 'F'), UnknownStatus: centre(40000, '-'), Price: centre(100001, 'A'),
    UnknownFee: centre(null, 'A'), NoLocation: centre(20000, 'A', null),
    Far: centre(100, 'A', [1.35, 103.9]), WrongProgramme: { programmes: {} },
  });
  const result = eligibleOptions(data, search);
  assert.deepEqual(result.eligible.map((x) => x.code), ['A', 'L']);
  assert.equal(result.unknownFees, 1);
  assert.equal(result.missingCoordinates, 1);
  assert.deepEqual(eligibleOptions(data, { ...search, availableOnly: true }).eligible.map((x) => x.code), ['A']);
  assert.deepEqual(eligibleOptions(data, { ...search, scheme: 'Partner Operator' }).eligible.map((x) => x.fee), [100000]);
  assert.equal(eligibleOptions(data, { ...search, fee: 1 }).eligible.length, 0);
  assert.throws(() => eligibleOptions(data, { ...search, month: '2030-01' }), RangeError);
});

test('score uses fixed anchors and reranks trades without changing eligibility', () => {
  const options = eligibleOptions(fixture({
    Cheap: centre(25000, 'L', [1.35, 103.818]),
    Near: centre(70000, 'L', search.origin.point),
    Available: centre(70000, 'A', search.origin.point),
  }), search).eligible;
  const rank = (weights) => rankOptions(options, search, normaliseWeights(weights, false));
  assert.equal(rank({ fee: 100, distance: 0, availability: 0 })[0].code, 'Cheap');
  assert.ok(rank({ fee: 0, distance: 100, availability: 0 })[0].distance < options[0].distance);
  const ranked = rank({ fee: 50, distance: 50, availability: 50 });
  assert.ok(ranked.find((x) => x.code === 'Available').score > ranked.find((x) => x.code === 'Near').score);
  assert.equal(ranked[0].components.distance, 100);
  for (const option of ranked) {
    assert.ok(option.score >= 0 && option.score <= 100);
    assert.ok(Math.abs(option.score - Object.values(option.contributions).reduce((a, b) => a + b, 0)) < 1e-12);
  }
  assert.ok(Math.abs(distanceKm([0, 0], [0, 1]) - 111.195) < .001);
});

test('equal results use distance, fee and then code, independent of scheme', () => {
  const alias = search.origin.point;
  const options = eligibleOptions(fixture({
    Z: centre(50000, 'A', alias, 'Anchor Operator'),
    B: centre(50000, 'A', alias, 'Partner Operator'),
    C: centre(60000, 'A', alias),
    A: centre(40000, 'A', [1.35, 103.801]),
  }), search).eligible;
  const ranked = rankOptions(options, search, { fee: 0, distance: 0, availability: 1 });
  assert.deepEqual(ranked.map((x) => x.code), ['B', 'Z', 'C', 'A']);
  assert.ok(ranked.every((x) => x.score === 100));
});

test('generated real data supports unique ranked options at every programme/month', () => {
  const data = JSON.parse(readFileSync(new URL('../public/data/preschool-finder.json', import.meta.url)));
  assert.match(data.snapshot, /^\d{4}-\d{2}-\d{2}$/);
  for (const [code, centre] of Object.entries(data.centres)) {
    assert.ok(code && code !== 'na');
    assert.match(centre.postal, /^(\d{6})?$/);
    for (const [fee, path] of Object.values(centre.programmes)) {
      assert.equal(path.length, data.months.length);
      assert.match(path, /^[ALF-]+$/);
      assert.ok(fee === null || (Number.isInteger(fee) && fee > 0));
    }
  }
  for (const [programme, months] of Object.entries(data.programmes)) {
    for (const month of months) {
      const input = { ...search, programme, month, radius: 10, fee: 400000, scheme: 'Partner Operator' };
      const { eligible } = eligibleOptions(data, input);
      assert.ok(eligible.length);
      assert.equal(new Set(eligible.map((x) => x.code)).size, eligible.length);
      assert.ok(eligible.every((x) => x.distance <= input.radius && x.fee <= input.fee && x.fee > 0
        && x.centre.scheme === input.scheme && ['A', 'L'].includes(x.status)));
    }
  }
});
