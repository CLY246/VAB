import { eligibleOptions, factors, normaliseWeights, rankOptions, statusLabels } from './finderScoring.js';

import { lookupPostal, postalCode } from './finderPostal.js';

const equalWeights = { fee: 50, distance: 50, availability: 50 };
const displayDate = new Intl.DateTimeFormat('en-SG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const displayMonth = new Intl.DateTimeFormat('en-SG', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const displayFee = new Intl.NumberFormat('en-SG', { maximumFractionDigits: 2 });
const money = (cents) => `S$${displayFee.format(cents / 100)}`;
const monthName = (month) => displayMonth.format(new Date(`${month}-01`));
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function lookupLocal(centres, query) {
  const normalized = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const target = normalized(query);
  if (!target) return [];
  const postal = /^\d{6}$/.test(target);
  const matches = new Map();
  for (const centre of Object.values(centres)) {
    if (!centre.point || !centre.address) continue;
    const label = centre.postal && !centre.address.includes(centre.postal)
      ? `${centre.address}, Singapore ${centre.postal}` : centre.address;
    const address = normalized(label);
    if (postal ? centre.postal !== target : !target.split(' ').every((word) => address.split(' ').includes(word))) continue;
    // A postal code names one location, so preschools sharing it collapse to one choice.
    const key = postal ? centre.point.join(',') : `${address}|${centre.point.join(',')}`;
    matches.set(key, { label, point: centre.point });
  }
  return [...matches.values()].slice(0, 8);
}

export function explanation(option, weights) {
  const reasons = {
    fee: option.components.fee > 0 ? `Its listed fee is ${money(option.fee)}` : 'Its listed fee is at your limit',
    distance: `It is ${option.distance.toFixed(2)} km away in a straight line`,
    availability: `It reported ${statusLabels[option.status]}`,
  };
  const strongest = Object.keys(factors).filter((key) => weights[key] > 0)
    .sort((a, b) => option.contributions[b] - option.contributions[a])[0];
  if (!option.contributions[strongest]) return 'This centre meets your requirements. The selected priorities contributed zero points.';
  return `${factors[strongest]} contributed the most points. ${reasons[strongest]}.${strongest !== 'availability' ? ` It reported ${statusLabels[option.status]}.` : ''}`;
}

export function recoveryActions(search) {
  const actions = [
    search.radius < 10 ? 'widen the radius' : '',
    'revise the fee limit',
    'compare another supported start month',
    search.availableOnly ? 'include Limited reports' : '',
    search.scheme ? 'remove the scheme restriction' : '',
  ].filter(Boolean);
  return `${actions.slice(0, -1).join(', ')} or ${actions.at(-1)}`;
}

function renderOption(option, index, search, weights, date, basis) {
  const { code, centre, fee, status, distance, score, components, contributions } = option;
  const contacts = [
    /^\+?\d[\d ()-]{5,}$/.test(centre.phone) ? `<a href="tel:${centre.phone.replace(/[^+\d]/g, '')}">${esc(centre.phone)}</a>` : '',
    /^[^\s<>@"']+@[^\s<>@"']+\.[^\s<>@"']+$/.test(centre.email) ? `<a href="mailto:${esc(centre.email)}">Email centre</a>` : '',
    /^https?:\/\//i.test(centre.website) ? `<a href="${esc(centre.website)}" target="_blank" rel="noopener">Centre website</a>` : '',
  ].filter(Boolean);
  return `<article class="finder-result" data-centre="${esc(code)}">
    <div class="finder-result-heading">
      <h4><span>${index + 1}</span> ${esc(centre.name)}</h4>
      <strong class="finder-score">${score.toFixed(1)} <small>/ 100</small></strong>
    </div>
    <p>${esc(search.programme)} · ${monthName(search.month)}<br>
      <strong>${statusLabels[status]}</strong> reported on ${date}</p>
    <p><strong>${money(fee)} / month</strong> · ${distance.toFixed(2)} km in a straight line<br><small>${basis}</small></p>
    <p>${esc(centre.address || 'Address unavailable')}${centre.postal && !centre.address.includes(centre.postal) ? ` · ${esc(centre.postal)}` : ''}<br>${esc(centre.scheme)}</p>
    ${contacts.length ? `<p class="finder-contact">${contacts.join(' · ')}</p>` : ''}
    <div class="finder-bar" aria-hidden="true">${Object.keys(factors).map((key) => `<span class="finder-bar-${key}" style="width:${contributions[key]}%"></span>`).join('')}</div>
    <dl class="finder-breakdown">${Object.entries(factors).map(([key, label]) =>
      `<div><dt>${label}</dt><dd>${components[key].toFixed(1)}/100 · ${weights[key] ? `${contributions[key].toFixed(1)} weighted pts` : '0 weighted pts (inactive)'}</dd></div>`).join('')}</dl>
    <p class="finder-tradeoff">${explanation(option, weights)}</p>
    <button type="button" data-show-map aria-pressed="false">Show on map</button>
  </article>`;
}

export function mountPreschoolFinder(root) {
  const form = root.querySelector('form');
  const fields = form.elements;
  const q = (selector) => root.querySelector(selector);
  const show = (node, message) => { node.textContent = message; };
  const addressStatus = q('[data-address-status]');
  const resultsStatus = q('[data-search-status]');
  const addressChoices = q('[data-address-choices]');
  const mapNode = q('[data-map]');
  const resultSummary = q('[data-results-summary]');
  const resultList = q('[data-result-list]');
  const lookupButton = q('[data-lookup]');
  const pinButton = q('[data-pin]');
  const centreButton = q('[data-map-centre]');
  let data, map, origin, current;
  let lookupGeneration = 0;
  let pinMode = false;

  const weights = () => normaliseWeights(Object.fromEntries(Object.keys(factors).map((key) => [key, Number(fields[key].value)])), fields.status.value === 'A');
  const isMappedPoint = ([lat, lng]) => lat >= 1.15 && lat <= 1.50 && lng >= 103.55 && lng <= 104.10;

  function highlight(code, fromMap = false) {
    for (const card of resultList.children) {
      const active = card.dataset.centre === code;
      card.classList.toggle('selected', active);
      card.querySelector('[data-show-map]').setAttribute('aria-pressed', String(active));
      if (active && fromMap) card.scrollIntoView({ block: 'nearest' });
    }
    if (fromMap) show(q('[data-map-selection]'), 'Matching result highlighted.');
  }

  function invalidate() {
    if (current) show(resultsStatus, 'Search requirements changed. Select Find my matches to apply them.');
    current = null;
    resultSummary.replaceChildren();
    resultList.replaceChildren();
    q('[data-results]').hidden = true;
    q('[data-map-selection]').textContent = '';
    map?.drawResults([]);
  }

  function togglePin(enabled) {
    pinMode = enabled;
    pinButton.setAttribute('aria-pressed', String(enabled));
    centreButton.hidden = !enabled;
    map?.setPinMode(enabled);
  }

  function setOrigin(value) {
    lookupGeneration++;
    togglePin(false);
    addressChoices.replaceChildren();
    lookupButton.disabled = false;
    origin = value;
    invalidate();
    show(addressStatus, `Search origin: ${origin.label}${origin.source ? ` · ${origin.source}` : ''}`);
    map?.drawOrigin(origin, Number(fields.radius.value));
  }

  function pin(point) {
    if (!isMappedPoint(point)) {
      show(addressStatus, 'Choose a point within the Singapore search area.');
      return;
    }
    fields.location.value = '';
    setOrigin({ point, label: `Map pin (${point.map((n) => n.toFixed(5)).join(', ')})` });
  }

  function syncMonth() {
    const supported = data.programmes[fields.programme.value];
    const previous = fields.month.value;
    fields.month.replaceChildren(...supported.map((value) => new Option(monthName(value), value)));
    if (supported.includes(previous)) fields.month.value = previous;
    show(q('[data-month-warning]'), data.provisionalMonths.includes(fields.month.value)
      ? 'This start month had just been added in the source listing. Its reports were provisional.' : '');
  }

  function syncWeights() {
    fields.availability.disabled = fields.status.value === 'A';
    q('[data-availability-note]').hidden = !fields.availability.disabled;
    q('[data-availability-example]').hidden = fields.availability.disabled;
    const normalized = weights();
    for (const key of Object.keys(factors)) {
      show(q(`[data-weight="${key}"]`), fields[key].disabled ? '0% of match score · requirement only' : `${fields[key].value}/100 slider · ${normalized ? (normalized[key] * 100).toFixed(1) : '0'}% of match score`);
    }
    show(q('[data-weight-error]'), normalized ? '' : 'Give at least one active priority a weight above zero.');
    if (current) renderResults();
  }

  const popup = (option) => `<strong>${esc(option.centre.name)}</strong><br>${money(option.fee)} / month<br>
    ${option.distance.toFixed(2)} km in a straight line · ${statusLabels[option.status]}<br>Match score ${option.score.toFixed(1)} / 100`;

  function renderResults() {
    const normalized = weights();
    const { search, eligible, unknownFees, missingCoordinates } = current;
    const ranked = normalized ? rankOptions(eligible, search, normalized) : [];
    const status = search.availableOnly ? 'Available only' : 'Available or Limited';
    q('[data-results]').hidden = false;
    const date = displayDate.format(new Date(data.snapshot));
    const effective = normalized ? Object.entries(factors).map(([key, label]) =>
      `${label} ${(normalized[key] * 100).toFixed(1)}%`).join(' · ') : 'Set at least one active priority to see rankings.';
    resultSummary.innerHTML = `<p><strong>${esc(search.origin.label)}</strong><br>
      ${esc(search.programme)} · ${monthName(search.month)} · ${search.radius} km · up to ${money(search.fee)}/month<br>
      ${status} · ${esc(search.scheme || 'All schemes')} · Reports from ${date}</p>
      <p><strong>${eligible.length} eligible ${eligible.length === 1 ? 'option' : 'options'}</strong> · ${effective}</p>
      <p>${unknownFees} otherwise eligible nearby ${unknownFees === 1 ? 'option lacks a' : 'options lack a'} comparable fee.</p>
      ${missingCoordinates ? `<p>${missingCoordinates} ${missingCoordinates === 1 ? 'option matching the programme, month, status and scheme lacks' : 'options matching the programme, month, status and scheme lack'} coordinates. Their distance is unknown.</p>` : ''}
      ${!eligible.length ? `<p>No options met these requirements. You can ${recoveryActions(search)}. Then select Find my matches again.</p>` : ''}`;
    resultList.innerHTML = ranked.slice(0, 5).map((option, index) => renderOption(option, index, search, normalized, date, data.feeBasis)).join('');
    if (!map) resultList.querySelectorAll('[data-show-map]').forEach((button) => { button.disabled = true; });
    map?.drawResults(ranked);
  }

  fields.location.addEventListener('input', () => {
    lookupGeneration++;
    if (data) lookupButton.disabled = false;
    origin = null;
    addressChoices.replaceChildren();
    show(addressStatus, 'Look up the address or choose a map pin before searching.');
    invalidate();
    map?.drawOrigin(null, Number(fields.radius.value));
  });

  fields.location.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      lookupButton.click();
    }
  });

  lookupButton.addEventListener('click', async () => {
    const entered = fields.location.value.trim();
    const code = postalCode(entered);
    const query = code ?? entered;
    if (query.length < 3 || (/^\d+$/.test(query) && query.length !== 6)) {
      show(addressStatus, 'Enter a six-digit Singapore postal code or a street address.');
      return;
    }
    const generation = ++lookupGeneration;
    lookupButton.disabled = true;
    togglePin(false);
    addressChoices.replaceChildren();
    show(addressStatus, 'Looking up your location…');
    let matches = lookupLocal(data.centres, query);
    let networkError = false;
    if (!matches.length && code) {
      try {
        const match = await lookupPostal(code);
        if (match) matches = [match];
      } catch {
        networkError = true;
      }
    }
    if (generation !== lookupGeneration) return;
    if (!matches.length && import.meta.env.VITE_ONEMAP_LOOKUP === 'true') {
      try {
        const response = await fetch('/api/preschool-geocode', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }), signal: AbortSignal.timeout(18000),
        });
        if (!response.ok) throw new Error('Address lookup unavailable');
        matches = await response.json();
        networkError = false;
      } catch {
        networkError = true;
      }
    }
    if (generation !== lookupGeneration) return;
    lookupButton.disabled = false;
    if (matches.length === 1) {
      setOrigin(matches[0]);
      return;
    }
    if (matches.length) {
      show(addressStatus, 'Choose the address you want to use.');
      matches.forEach((match) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = match.label;
        button.addEventListener('click', () => setOrigin(match));
        addressChoices.append(button);
      });
      return;
    }
    show(addressStatus, networkError ? 'Address lookup is unavailable. Try again or choose a map pin.'
      : code ? 'This postal code is missing from the address index. Try a nearby postal code or choose a map pin.'
        : 'No matching address was found. Try its six-digit postal code or choose a map pin.');
  });

  pinButton.addEventListener('click', () => {
    togglePin(!pinMode);
    if (pinMode) {
      show(addressStatus, 'Click a point on the map, or pan the map and use its centre.');
      mapNode.focus();
    } else if (origin) {
      show(addressStatus, `Search origin: ${origin.label}${origin.source ? ` · ${origin.source}` : ''}`);
    } else {
      show(addressStatus, 'Look up an address or choose a map pin to set an origin.');
    }
  });
  centreButton.addEventListener('click', () => map?.useCentre());

  form.addEventListener('input', (event) => {
    if (event.target.name in factors) syncWeights();
  });
  form.addEventListener('change', (event) => {
    const name = event.target.name;
    if (!['programme', 'month', 'radius', 'status', 'scheme', 'feeLimit'].includes(name)) return;
    invalidate();
    if (name === 'programme' || name === 'month') syncMonth();
    if (name === 'radius') map?.drawOrigin(origin, Number(fields.radius.value));
    if (name === 'status') syncWeights();
  });
  q('[data-reset-priorities]').addEventListener('click', () => {
    for (const key of Object.keys(factors)) fields[key].value = equalWeights[key];
    syncWeights();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!data) return;
    if (!origin) {
      show(resultsStatus, 'Set a search origin above before finding matches.');
      fields.location.focus();
      return;
    }
    if (!weights()) return;
    const search = {
      origin, programme: fields.programme.value, month: fields.month.value,
      radius: Number(fields.radius.value), fee: Number(fields.feeLimit.value),
      availableOnly: fields.status.value === 'A', scheme: fields.scheme.value,
    };
    if (!(search.fee > 0) || ![1, 3, 5, 10].includes(search.radius)) {
      show(resultsStatus, 'Choose a monthly fee limit and a supported radius.');
      return;
    }
    try {
      current = { search, ...eligibleOptions(data, search) };
    } catch (error) {
      show(resultsStatus, error.message);
      return;
    }
    show(resultsStatus, `Search complete. ${current.eligible.length} eligible options.`);
    map?.drawOrigin(origin, search.radius);
    renderResults();
  });

  resultList.addEventListener('click', (event) => {
    const card = event.target.closest('[data-centre]');
    if (!card || event.target.closest('a') || !map) return;
    highlight(card.dataset.centre);
    map.showResult(card.dataset.centre);
  });

  fetch(`${import.meta.env.BASE_URL}data/preschool-finder.json`)
    .then((response) => {
      if (!response.ok) throw new Error('Finder data unavailable');
      return response.json();
    })
    .then((dataset) => {
      data = dataset;
      show(q('[data-snapshot]'), `ECDA listing · ${displayDate.format(new Date(data.snapshot))}${data.feeSourceMonth ? ` · Fee listing ${monthName(data.feeSourceMonth)}` : ''}`);
      fields.programme.replaceChildren(...Object.keys(data.programmes).map((label) => new Option(label, label)));
      const schemes = new Set(Object.values(data.centres).map((centre) => centre.scheme));
      for (const scheme of ['Anchor Operator', 'Partner Operator', 'Scheme unlisted']) {
        if (schemes.has(scheme)) fields.scheme.add(new Option(scheme, scheme));
      }
      syncMonth();
      syncWeights();
      q('[data-requirements]').disabled = false;
      q('[data-priorities]').disabled = false;
      q('[data-search]').disabled = false;
    })
    .catch(() => show(q('[data-snapshot]'), 'Finder data could not load. Reload the page to try again.'));

  import('./finderMap.js').then(({ createFinderMap }) => {
    map = createFinderMap(mapNode, {
      onPin: pin,
      onSelect: (code, ranked) => highlight(ranked ? code : null, ranked),
      onTileError: () => show(q('[data-tile-status]'), 'Some map tiles could not load. The radius, markers and ranked list can still be used.'),
      popup,
    });
    pinButton.disabled = false;
    map.drawOrigin(origin, Number(fields.radius.value));
    if (current) renderResults();
  }).catch(() => {
    show(q('[data-tile-status]'), 'The interactive map could not load. Address lookup and the ranked list can still be used.');
    mapNode.hidden = true;
  });
}
