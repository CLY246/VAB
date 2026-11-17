import './style.css';
import { findings, recommendations } from './content.js';
import { tableauViews } from './tableauConfig.js';
import { renderDeepDivePlaceholder } from './deepDive.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="site-header">
    <a class="wordmark" href="#top" aria-label="Preschool Access in Singapore home">PA<span>/</span>SG</a>
    <nav aria-label="Primary navigation">
      <a href="#problem">Problem</a>
      <a href="#findings">Findings</a>
      <a href="#dashboards">Dashboards</a>
      <a href="#deep-dive">Deep dive</a>
      <a href="#recommendations">So what?</a>
    </nav>
  </header>

  <main id="top">
    <section class="hero section-shell">
      <div class="hero-copy">
        <p class="kicker">A visual frame for Singapore</p>
        <h1>Preschool access<br /><em>is a place-based question.</em></h1>
        <p class="lede">How close is a place? What does it cost? And will a centre report availability for the programme and start month a family needs?</p>
        <a class="button button-dark" href="#dashboards">Explore dashboards <span aria-hidden="true">↓</span></a>
      </div>
      <div class="hero-stamp" aria-hidden="true">
        <span>LOCATION</span><span>FEES</span><span>AVAILABILITY</span>
        <b>SG</b>
      </div>
    </section>

    <section id="problem" class="section-shell section-grid">
      <div class="section-intro">
        <p class="kicker">01 / The problem</p>
        <h2>One family.<br />Three filters.</h2>
      </div>
      <div class="body-copy">
        <p>Families searching for preschool must make several decisions at once. A centre can be nearby but outside the household budget, or affordable but unable to report a place for the intended programme and start month.</p>
        <div class="filter-list">
          <div><span>01</span><strong>Where</strong><p>Centres are not evenly distributed across neighbourhoods.</p></div>
          <div><span>02</span><strong>What it costs</strong><p>Fees shape which options are realistic for a household.</p></div>
          <div><span>03</span><strong>Whether a place is reported</strong><p>Availability depends on programme and enrolment period.</p></div>
        </div>
      </div>
    </section>

    <section id="findings" class="section-shell findings-section">
      <div class="section-heading">
        <div><p class="kicker">02 / Key findings</p><h2>Three lenses on access.</h2></div>
        <p class="section-note">Editable placeholders — replace with approved findings and figures.</p>
      </div>
      <div class="finding-grid">
        ${findings.map((item) => `<article class="finding-card"><p class="kicker">${item.eyebrow}</p><h3>${item.title}</h3><p>${item.text}</p><span class="card-mark" aria-hidden="true">↗</span></article>`).join('')}
      </div>
    </section>

    <section id="dashboards" class="dashboard-section">
      <div class="section-shell">
        <div class="section-heading">
          <div><p class="kicker">03 / Explore dashboards</p><h2>See the patterns by place.</h2></div>
          <p class="section-note">Each view loads when you open its tab.</p>
        </div>
        <div class="tabs" data-tabs>
          <div class="tab-list" role="tablist" aria-label="Preschool access dashboards">
            <button id="tab-geography" role="tab" aria-selected="true" aria-controls="panel-geography" tabindex="0" data-tab="geography">Where places are available</button>
            <button id="tab-affordability" role="tab" aria-selected="false" aria-controls="panel-affordability" tabindex="-1" data-tab="affordability">Affordability and access</button>
            <button id="tab-constraints" role="tab" aria-selected="false" aria-controls="panel-constraints" tabindex="-1" data-tab="constraints">Persistent constraints</button>
          </div>
          ${[
            ['geography', 'Where places are available', 'Explore how reported availability varies across Singapore’s planning areas.'],
            ['affordability', 'Affordability and access', 'Compare fee levels with the places families can realistically reach.'],
            ['constraints', 'Persistent availability constraints', 'Trace where reported constraints remain across snapshots.'],
          ].map(([key, title, intro], index) => `<div id="panel-${key}" class="tab-panel" role="tabpanel" aria-labelledby="tab-${key}" ${index ? 'hidden' : ''} data-panel="${key}"><p class="kicker">${title}</p><p class="panel-intro">${intro}</p><div class="tableau-frame" data-tableau="${key}"><span class="loader">Dashboard loading area</span></div></div>`).join('')}
        </div>
      </div>
    </section>

    <section id="deep-dive" class="section-shell deep-dive">
      <div class="section-heading">
        <div><p class="kicker">04 / Deep dive</p><h2>Did the same preschool options open up or fill up?</h2></div>
        <p class="section-note">A matched centre–programme view across reporting dates.</p>
      </div>
      <div class="chart-controls">
        <label>Programme<select><option>All programmes</option><option>Infant care</option><option>Child care</option> </select></label>
        <label>Intended start month<select><option>All months</option><option>January</option><option>July</option></select></label>
        <div class="legend" aria-label="Availability legend"><span><i class="available"></i>Available</span><span><i class="limited"></i>Limited</span><span><i class="full"></i>Full</span></div>
      </div>
      <div id="deep-dive-chart"></div>
    </section>

    <section id="recommendations" class="recommendations">
      <div class="section-shell">
        <div class="section-heading"><div><p class="kicker">05 / So what?</p><h2>From pattern to action.</h2></div><p class="section-note">Editable placeholders — tie recommendations to verified findings.</p></div>
        <div class="recommendation-grid">
          <article><p class="kicker">For families</p><h3>Make the search more legible.</h3><p>${recommendations.families}</p></article>
          <article><p class="kicker">For planners</p><h3>Plan with a sharper signal.</h3><p>${recommendations.planners}</p></article>
        </div>
      </div>
    </section>

    <section id="sources" class="section-shell sources">
      <p class="kicker">06 / Sources and methods</p>
      <div class="source-grid"><h2>Read the frame carefully.</h2><div><p><strong>Data credits</strong><br />ECDA vacancy and fee data; SingStat population and workplace data; URA planning-area boundaries.</p><p><strong>Definitions</strong><br />The intended start month is the enrolment period. The snapshot date is when the status was observed. Reported statuses are at centre level.</p></div></div>
    </section>
  </main>
  <footer class="site-footer section-shell"><span>Preschool Access in Singapore</span><a href="#top">Back to top ↑</a></footer>
`;

const loadedTabs = new Set();
function loadTableau(key) {
  if (loadedTabs.has(key)) return;
  loadedTabs.add(key);
  const frame = document.querySelector(`[data-tableau="${key}"]`);
  const url = tableauViews[key];
  if (!url) {
    frame.innerHTML = '<div class="missing-dashboard"><strong>Tableau view coming soon</strong><span>Paste the published view URL in <code>src/tableauConfig.js</code>.</span></div>';
    return;
  }
  const iframe = document.createElement('iframe');
  iframe.title = `${key} Tableau dashboard`;
  iframe.src = url;
  iframe.loading = 'lazy';
  iframe.allowFullscreen = true;
  frame.replaceChildren(iframe);
}

const tabs = [...document.querySelectorAll('[role="tab"]')];
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : tabs.length - 1;
    tabs[next].focus();
    activateTab(tabs[next]);
  });
});
function activateTab(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', selected);
    item.tabIndex = selected ? 0 : -1;
    document.querySelector(`#${item.getAttribute('aria-controls')}`).hidden = !selected;
  });
  loadTableau(tab.dataset.tab);
}

renderDeepDivePlaceholder(document.querySelector('#deep-dive-chart'));
loadTableau('geography');
