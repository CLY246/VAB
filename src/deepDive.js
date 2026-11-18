import { axisLeft } from 'd3-axis';
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';

const statuses = ['Available', 'Limited', 'Full'];
const colours = ['var(--teal)', 'var(--limited)', 'var(--full)'];
const monthLabel = new Intl.DateTimeFormat('en-SG', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateLabel = new Intl.DateTimeFormat('en-SG', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const longDate = new Intl.DateTimeFormat('en-SG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortDay = new Intl.DateTimeFormat('en-SG', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const currency = new Intl.NumberFormat('en-SG', { maximumFractionDigits: 2 });
const money = (n) => `S$${currency.format(n)}`;
const count = (n) => n.toLocaleString('en-SG');
const percent = (n, total) => total ? `${(100 * n / total).toFixed(1)}%` : '—';

function panel(container, id, title, description, question, context) {
  const article = select(container).append('article').attr('class', 'dive-panel').attr('aria-labelledby', id);
  article.append('h3').attr('id', id).text(title);
  article.append('p').text(description);
  article.append('p').attr('class', 'dive-question').text(question);
  article.append('p').attr('class', 'dive-note').text(context);
  const controls = article.append('div').attr('class', 'chart-controls');
  const summary = article.append('div').attr('aria-live', 'polite').attr('class', 'dive-summary');
  const detail = article.append('p').attr('class', 'chart-detail').attr('role', 'status');
  const scroll = article.append('div').attr('class', 'chart-scroll').attr('tabindex', 0)
    .attr('role', 'region').attr('aria-label', title);
  const svg = scroll.append('svg').attr('role', 'group').attr('aria-label', title);
  const table = article.append('details');
  table.append('summary').text('View chart data');
  const tableScroll = table.append('div').attr('class', 'chart-scroll').attr('tabindex', 0)
    .attr('role', 'region').attr('aria-label', `${title} data`);
  return { article, controls, summary, detail, svg, table: tableScroll.append('table') };
}

function filters(controls, groups, render) {
  const programme = controls.append('label').text('Programme').append('select');
  programme.selectAll('option').data(Object.keys(groups)).join('option').text((d) => d);
  const month = controls.append('label').text('Intended start month').append('select');
  const current = () => groups[programme.property('value')][month.property('value')];
  const populate = () => {
    const previous = month.property('value');
    const months = Object.keys(groups[programme.property('value')]);
    month.selectAll('option').data(months).join('option').attr('value', (d) => d)
      .text((d) => monthLabel.format(new Date(`${d}-01`)));
    month.property('value', months.includes(previous) ? previous : months[0]);
  };
  populate();
  programme.on('change', () => { populate(); render(current()); });
  month.on('change', () => render(current()));
  return current;
}

function writeTable(table, headers, rows) {
  table.selectAll('*').remove();
  table.append('thead').append('tr').selectAll('th').data(headers).join('th')
    .attr('scope', 'col').text((d) => d);
  table.append('tbody').selectAll('tr').data(rows).join('tr').each(function (row) {
    select(this).selectAll('td').data(row).join('td').text((d) => d);
  });
}

// A check whose listing reflects an earlier month than its download date (the 12 Oct 2026
// download carries ECDA data last updated by 24 Sep 2026) is labelled with that update date.
export function checkDataNotes(data) {
  return data.dates.map((date, i) => {
    const dataMonth = data.dataMonths?.[i];
    if (!dataMonth || dataMonth === date.slice(0, 7)) return '';
    const updated = data.lastUpdated?.[i];
    return updated ? `ECDA data to ${shortDay.format(new Date(updated))}` : `ECDA data for ${monthLabel.format(new Date(`${dataMonth}-01`))}`;
  });
}

export function windowNote(data, windowMonths) {
  const span = `${monthLabel.format(new Date(`${windowMonths[0]}-01`))} to ${monthLabel.format(new Date(`${windowMonths.at(-1)}-01`))}`;
  const early = data.dates.map((date, i) => [date, data.dataMonths?.[i], data.lastUpdated?.[i]])
    .filter(([date, dataMonth]) => dataMonth && dataMonth !== date.slice(0, 7))
    .map(([date, dataMonth, updated]) => `The listing downloaded on ${dateLabel.format(new Date(date))} reflects ECDA data last updated by ${longDate.format(new Date(updated))}, so its months are read from ${monthLabel.format(new Date(`${dataMonth}-01`))}.`);
  return `${early.join(' ')} Intended start months run from ${span}, the months covered by all five listings.`.trim();
}

function availabilityChart(container, data) {
  const ui = panel(container, 'availability-paths-title', 'Preschool availability paths across five listings',
    'Follow the same options (one centre offering one programme) across five ECDA listings to see which stayed Available, which stayed Limited or Full, and which changed status.',
    'For the same programme and intended start month, how did individual options move between Available, Limited and Full?',
    'This extends the Tableau persistence dashboard by showing the direction and sequence of status changes.');
  const current = filters(ui.controls, data.groups, render);
  const reset = ui.controls.append('button').attr('type', 'button').text('Reset selection');
  const legend = ui.controls.append('div').attr('class', 'legend').attr('aria-label', 'Availability legend');
  legend.selectAll('span').data(statuses).join('span').each(function (status, i) {
    select(this).append('i').style('background', colours[i]);
    select(this).append('b').text(status);
  });
  const dates = data.dates.map((date) => dateLabel.format(new Date(date)));
  const checkNotes = checkDataNotes(data);
  const fullDates = dates.map((date, i) => checkNotes[i] ? `${date} (${checkNotes[i]})` : date);
  const windowMonths = Object.keys(Object.values(data.groups)[0]);
  ui.article.append('p').attr('class', 'dive-note').text(windowNote(data, windowMonths));
  const overlap = 'The summaries can overlap. An option that switches between Limited and Full changes exact status and remains constrained throughout.';
  ui.article.append('p').attr('class', 'dive-note').text(overlap);
  const prompt = 'Hover, focus or select a ribbon to read its path across the five listings.';

  function render(group) {
    const paths = group.paths.map(([key, n]) => ({ key, n, codes: Array.from(key, Number), y: [] }))
      .sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
    const total = paths.reduce((sum, d) => sum + d.n, 0);
    const totals = [
      ['Available at every listing', (d) => d.key === '00000'],
      ['Limited or Full at every listing', (d) => !d.key.includes('0')],
      ['Changed exact status at least once', (d) => new Set(d.codes).size > 1],
    ];
    ui.summary.selectAll('*').remove();
    const excluded = Object.entries(group.excluded);
    const reason = excluded.map(([label, n]) => `${count(n)} ${label}`).join(', ');
    ui.summary.append('p').text(`${count(total)} matched options · ${count(excluded.reduce((sum, [, n]) => sum + n, 0))} coded options excluded${reason ? ` (${reason})` : ''}. ${count(group.uncoded)} valid report rows lacked a centre code and could not be matched.`);
    const metrics = ui.summary.append('dl').attr('class', 'dive-metrics').attr('title', overlap);
    for (const [label, predicate] of totals) {
      const n = paths.filter(predicate).reduce((sum, d) => sum + d.n, 0);
      const metric = metrics.append('div');
      metric.append('dt').text(label);
      metric.append('dd').text(`${count(n)} (${percent(n, total)})`);
    }
    ui.detail.text(total ? prompt : 'No options reported a valid status at all five listings.');
    ui.svg.selectAll('*').remove();
    ui.svg.attr('viewBox', '0 0 900 385');
    const xs = dates.map((_, i) => 65 + i * 192.5);
    const unit = total ? 230 / total : 0;
    const blocks = [];
    dates.forEach((date, column) => {
      ui.svg.append('text').attr('x', xs[column]).attr('y', 20).attr('text-anchor', 'middle').text(date);
      if (checkNotes[column]) {
        ui.svg.append('text').attr('class', 'check-note').attr('x', xs[column]).attr('y', 37)
          .attr('text-anchor', 'middle').text(checkNotes[column]);
      }
      let y = 55;
      statuses.forEach((_, code) => {
        const from = y;
        const stack = paths.filter((d) => d.codes[column] === code)
          .sort((a, b) => a.key.localeCompare(b.key));
        for (const path of stack) {
          path.y[column] = y;
          y += path.n * unit;
        }
        blocks.push({ x: xs[column], y: from, height: y - from, code });
        y += 35;
      });
    });
    function ribbon(d) {
      const thickness = d.n * unit;
      const top = d.y.map((y, i) => [xs[i], y]);
      const bottom = top.map(([x, y]) => [x, y + thickness]).reverse();
      const curve = (points) => points.slice(1).map(([x, y], i) => {
        const [px, py] = points[i];
        const mid = (x + px) / 2;
        return `C${mid},${py} ${mid},${y} ${x},${y}`;
      }).join('');
      return `M${top[0]}${curve(top)}L${bottom[0]}${curve(bottom)}Z`;
    }
    const pathLabel = (d) => `${fullDates.map((date, i) => `${date} · ${statuses[d.codes[i]]}`).join(' → ')}. ${count(d.n)} options (${percent(d.n, total)}). ${overlap}`;
    let pinned = null;
    const marks = ui.svg.selectAll('.ribbon').data(paths).join('path').attr('class', 'ribbon')
      .attr('d', ribbon).attr('fill', (d) => colours[d.codes[0]])
      .attr('tabindex', 0).attr('role', 'button').attr('aria-label', pathLabel);
    function highlight(active = pinned) {
      marks.classed('dimmed', (d) => active && d !== active)
        .classed('highlighted', (d) => d === active)
        .attr('aria-pressed', (d) => d === pinned ? 'true' : 'false');
      ui.detail.text(active ? pathLabel(active) : total ? prompt : 'No options reported a valid status at all five listings.');
    }
    function toggle(d) {
      pinned = pinned === d ? null : d;
      highlight();
    }
    marks.on('pointerenter focus', (_, d) => highlight(d))
      .on('pointerleave blur', () => highlight())
      .on('click', (_, d) => toggle(d))
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle(d);
        }
      });
    const columns = ui.svg.append('g').attr('pointer-events', 'none');
    columns.selectAll('rect').data(blocks).join('rect').attr('x', (d) => d.x - 4).attr('width', 8)
      .attr('y', (d) => d.y).attr('height', (d) => d.height).attr('fill', (d) => colours[d.code]);
    columns.selectAll('text').data(blocks).join('text').attr('x', (d) => d.x)
      .attr('y', (d) => d.y + d.height + 15).attr('text-anchor', 'middle')
      .text((d) => `${statuses[d.code]} · ${count(total ? Math.round(d.height / unit) : 0)}`);
    reset.on('click', () => { pinned = null; highlight(); });
    highlight();
    writeTable(ui.table, [...fullDates, 'Options', 'Cohort share'],
      paths.map((d) => [...d.codes.map((code) => statuses[code]), count(d.n), percent(d.n, total)]));
  }

  render(current());
}

function budgetChart(container, data) {
  const ui = panel(container, 'budget-options-title', 'Additional preschool options at a higher monthly budget',
    'Compare two monthly fee limits to see where a higher budget adds centres reporting Available for your selected programme and intended start month.',
    'Which planning areas gain the most Available options when the monthly fee limit increases?',
    `This extends the Tableau affordability dashboard by comparing two fee limits within the same ${dateLabel.format(new Date(data.date))} listing. Fees are listed Singapore Citizen full day monthly fees before subsidy and GST.`);
  const current = filters(ui.controls, data.groups, render);
  const budget = (label, value) => ui.controls.append('label').text(label).append('input')
    .attr('type', 'number').attr('min', 0).attr('step', '.01').attr('required', true).property('value', value);
  const lower = budget('Lower monthly budget (S$)', 1300);
  const higher = budget('Higher monthly budget (S$)', 1900);
  const showAll = ui.controls.append('label').attr('class', 'show-areas');
  const checkbox = showAll.append('input').attr('type', 'checkbox');
  showAll.append('span').text('View all areas');
  ui.article.append('p').attr('class', 'dive-note').text('The starting limits of S$1,300 and S$1,900 sit near the median and at the upper quartile of listed fees for November 2026 infant care options with a known area. The median is S$1,290 and the 75th percentile is S$1,900.');
  for (const input of [lower, higher, checkbox]) input.on('input', () => render(current()));

  function render(group) {
    const low = lower.node().valueAsNumber;
    const high = higher.node().valueAsNumber;
    const valid = lower.node().validity.valid && higher.node().validity.valid && low <= high;
    higher.attr('aria-invalid', low > high ? 'true' : null);
    ui.summary.selectAll('*').remove();
    ui.svg.selectAll('*').remove();
    ui.svg.attr('viewBox', '0 0 900 420').attr('display', valid ? null : 'none');
    if (!valid) {
      ui.summary.append('p').text('Enter two nonnegative budgets with the lower budget at or below the higher budget.');
      ui.detail.text('');
      writeTable(ui.table, ['Planning area', 'Lower count', 'Higher count', 'Gain', 'Fee unknown'], []);
      return;
    }
    const ceilings = [Math.round(low * 100), Math.round(high * 100)];
    const areas = group.areas.map(([index, unknown, fees]) => {
      const known = fees.reduce((sum, [, n]) => sum + n, 0);
      const [left, right] = ceilings.map((ceiling) => fees.reduce((sum, [fee, n]) => sum + (fee <= ceiling ? n : 0), 0));
      return { name: data.areas[index], unknown, known, left, right, gain: right - left };
    }).sort((a, b) => b.gain - a.gain || a.name.localeCompare(b.name, 'en-SG'));
    const visible = checkbox.property('checked') ? areas : areas.slice(0, 10);
    const totalGain = areas.reduce((sum, area) => sum + area.gain, 0);
    const leaders = areas.filter((area) => area.gain > 0 && area.gain === areas[0].gain);
    ui.summary.append('p').text(totalGain
      ? `${count(totalGain)} additional options across ${areas.filter((area) => area.gain > 0).length} areas. Largest gain: ${leaders.map((area) => area.name).join(', ')} (+${leaders[0].gain}). Showing ${visible.length} of ${areas.length} areas.`
      : 'No planning area gains options between these two fee limits. Try a wider budget range or another programme or start month.');
    ui.summary.append('p').text(`${count(group.missingFee)} coded Available options had no single qualifying positive fee. ${count(group.missingLocation)} coded Available options lacked a usable planning area; these counts can overlap. ${count(group.uncoded)} uncoded Available rows and ${count(group.statusConflict)} conflicting status keys were also excluded.`);

    const prompt = 'Hover or focus an area to see its budget counts and fee coverage.';
    ui.detail.text(visible.length ? prompt : 'No Available options with a coded centre and known area in this selection.');
    const height = Math.max(400, visible.length * 20 + 100);
    const y = scaleLinear().domain([0, Math.max(1, ...areas.map((d) => d.right))]).nice().range([height - 35, 55]);
    const xs = [270, 630];
    ui.svg.attr('viewBox', `0 0 900 ${height}`);
    for (const [i, x] of xs.entries()) {
      const ticks = y.ticks(6).filter(Number.isInteger);
      ui.svg.append('g').attr('transform', `translate(${x},0)`).call(axisLeft(y).tickValues(ticks).tickFormat(count));
      ui.svg.append('text').attr('x', x).attr('y', 24).attr('text-anchor', 'middle').text(money(i ? high : low));
    }
    // Place labels in endpoint order with leaders so equal counts stay readable.
    function labelPositions(field) {
      const positions = new Map();
      const ordered = [...visible].sort((a, b) => b[field] - a[field] || a.name.localeCompare(b.name, 'en-SG'));
      let previous = 36;
      ordered.forEach((d, i) => {
        const position = Math.min(height - 24 - 18 * (ordered.length - 1 - i), Math.max(previous + 18, y(d[field])));
        positions.set(d, position);
        previous = position;
      });
      return positions;
    }
    const leftLabels = labelPositions('left');
    const rightLabels = labelPositions('right');
    const description = (d) => `${d.name}. ${money(low)}: ${d.left}; ${money(high)}: ${d.right}; gain +${d.gain}. Fee unknown for ${d.unknown} of ${d.known + d.unknown} Available options in this area (${percent(d.unknown, d.known + d.unknown)}).`;
    const marks = ui.svg.selectAll('.slope').data(visible).join('g').attr('class', 'slope')
      .attr('tabindex', 0).attr('role', 'group').attr('aria-label', description);
    function highlight(active) {
      marks.classed('dimmed', (d) => active && d !== active).classed('highlighted', (d) => d === active);
      ui.detail.text(active ? description(active) : prompt);
    }
    marks.on('pointerenter focus', (_, d) => highlight(d)).on('pointerleave blur', () => highlight());
    marks.append('line').attr('class', 'slope-hit').attr('x1', xs[0]).attr('x2', xs[1])
      .attr('y1', (d) => y(d.left)).attr('y2', (d) => y(d.right));
    marks.append('line').attr('class', 'slope-line').attr('x1', xs[0]).attr('x2', xs[1])
      .attr('y1', (d) => y(d.left)).attr('y2', (d) => y(d.right));
    for (const [i, field] of ['left', 'right'].entries()) {
      const x = xs[i];
      const edge = x + (i ? 26 : -26);
      const positions = i ? rightLabels : leftLabels;
      marks.append('line').attr('class', 'slope-leader').attr('x1', x).attr('x2', edge)
        .attr('y1', (d) => y(d[field])).attr('y2', (d) => positions.get(d));
      marks.append('circle').attr('cx', x).attr('cy', (d) => y(d[field])).attr('r', 3);
      marks.append('text').attr('x', edge + (i ? 5 : -5)).attr('y', (d) => positions.get(d))
        .attr('dy', '.35em').attr('text-anchor', i ? 'start' : 'end')
        .text((d) => i ? `${d.right} (+${d.gain})` : `${d.name} · ${d.left}`);
    }
    writeTable(ui.table, ['Planning area', money(low), money(high), 'Gain', 'Fee unknown', 'Available options'],
      visible.map((d) => [d.name, d.left, d.right, `+${d.gain}`, d.unknown, d.known + d.unknown]));
  }

  render(current());
}

const charts = {
  'availability-paths': availabilityChart,
  'budget-options': budgetChart,
};

export function renderDeepDive(target, file) {
  if (target.dataset.initialized) return;
  target.dataset.initialized = 'true';
  target.textContent = 'Loading chart data…';
  fetch(`${import.meta.env.BASE_URL}data/${file}.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`Chart data request returned ${response.status}`);
      return response.json();
    })
    .then((data) => {
      target.replaceChildren();
      charts[file](target, data);
    })
    .catch((error) => {
      console.error(error);
      target.textContent = 'This chart could not load. Reload the page to try again.';
    });
}
