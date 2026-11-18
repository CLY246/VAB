import './style.css';
import { assumptions, availabilityPathNote, dashboardCopy, deepDiveNotes, findings, furtherWork, recommendations } from './content.js';
import { tableauViews } from './tableauConfig.js';
import { renderDeepDive } from './deepDive.js';
import { mountTableau } from './tableauEmbed.js';

const app = document.querySelector('#app');

const dashboardEntries = Object.entries(tableauViews);

function analysisDetails({ title, selection, paragraphs, why, detail, dashboard, linkLabel }) {
  return `<details class="analysis-detail">
    <summary>${title}</summary>
    ${selection ? `<p class="analysis-reference">${selection}</p>` : ''}
    ${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')}
    ${why ? `<p><strong>Why it matters.</strong> ${why}</p>` : ''}
    ${detail ? analysisDetails(detail) : ''}
    ${dashboard ? `<p><a href="#panel-${dashboard}">${linkLabel ?? `Explore ${tableauViews[dashboard].title}`}</a></p>` : ''}
  </details>`;
}

function dashboardPanel(key, view, index) {
  const copy = dashboardCopy[key];
  return `
    <div id="panel-${key}" class="tab-panel" role="tabpanel" aria-labelledby="tab-${key}" ${index ? 'hidden' : ''}>
      <div class="dashboard-copy">
        <h3>${view.title}</h3>
        <p class="dashboard-question">${copy.question}</p>
        <h4>What it shows</h4>
        <p>${copy.purpose}</p>
        <p>${copy.scope}</p>
        <p><strong>Using Tableau</strong> ${copy.controls}</p>
      </div>
      <div class="tableau-frame" data-tableau="${key}">
        <div class="tableau-tools">
          <a href="${view.openUrl}" target="_blank" rel="noopener">Open in Tableau Public <span aria-hidden="true">↗</span></a>
          <span>Scroll within the dashboard frame on a narrow screen.</span>
        </div>
        <p class="loader" role="status">Tableau loads when you reach this dashboard.</p>
        <div class="tableau-viewport" role="region" aria-label="${view.title} Tableau dashboard" tabindex="0" hidden></div>
      </div>
      <div class="dashboard-copy dashboard-reading">
        <p class="dashboard-reference">Fixed reference selection · ${copy.selection}</p>
        ${analysisDetails({ title: 'Key insights', paragraphs: copy.insights })}
        ${analysisDetails({ title: 'Why it matters', paragraphs: [copy.implication] })}
      </div>
      ${copy.chart ? `<section id="${copy.chart}" class="dashboard-deep-dive" aria-label="${view.title} deep dive">
        <p class="kicker">Deep Dive · Local chart</p>
        <p>These chart controls apply only to the visualisation below.</p>
        <div data-chart="${copy.chart}"></div>
        ${copy.chart === 'availability-paths' ? analysisDetails(availabilityPathNote) : ''}
      </section>` : ''}
    </div>`;
}

app.innerHTML = `
  <header class="site-header">
    <a class="wordmark" href="#top" aria-label="Preschool Access in Singapore home">PA<span>/</span>SG</a>
    <nav aria-label="Primary navigation">
      <a href="#problem">Problem</a>
      <a href="#findings">Findings</a>
      <a href="#dashboards">Dashboards</a>
      <a href="#deep-dive">Availability &amp; fees</a>
      <a href="#recommendations">Recommendations</a>
      <a href="#find-a-preschool">Find a Preschool</a>
      <a href="#sources">Methods</a>
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
        <div><h2>Top five key findings</h2>
          <p class="findings-lede">Preschool access is uneven across Singapore. Having many centres nearby does not necessarily mean having many options relative to the child population, within budget, or consistently reporting availability.</p>
        </div>
        <p class="section-note">These findings describe fixed reference selections. Tableau filters change the dashboards only.</p>
      </div>
      <div class="finding-grid">
        ${findings.map((item) => `<article class="finding-card"><p class="kicker">${item.eyebrow}</p><h3>${item.title}</h3><p class="finding-reference">${item.selection}</p><p>${item.text}</p><a href="#panel-${item.key}">Explore ${tableauViews[item.key].title}</a></article>`).join('')}
      </div>
    </section>

    <section id="dashboards" class="dashboard-section">
      <div class="section-shell">
        <div class="section-heading">
          <div><p class="kicker">03 / Explore dashboards</p><h2>See the patterns by place.</h2></div>
          <p class="section-note">Each Tableau workbook has its own controls. Selections apply within that workbook.</p>
        </div>
        <div class="tabs">
          <div class="tab-list" role="tablist" aria-label="Preschool access dashboards">
            ${dashboardEntries.map(([key, view], index) => `<button id="tab-${key}" role="tab" aria-selected="${index === 0}" aria-controls="panel-${key}" tabindex="${index === 0 ? 0 : -1}" data-tab="${key}">${view.title}</button>`).join('')}
          </div>
          ${dashboardEntries.map(([key, view], index) => dashboardPanel(key, view, index)).join('')}
        </div>
      </div>
    </section>

    <section id="deep-dive" class="section-shell deep-dive">
      <div class="section-heading">
        <div><p class="kicker">04 / Deep Dive</p><h2>How availability changes and what a higher budget adds</h2></div>
        <p class="section-note">These stories use fixed reference selections. The linked dashboards and local charts let you explore other selections.</p>
      </div>
      <div class="analysis-stack">
        ${deepDiveNotes.map(analysisDetails).join('')}
      </div>
      <div class="deep-dive-links">
        <a href="#budget-options">Compare two monthly fee ceilings</a>
        <a href="#availability-paths">Follow availability across five checks</a>
      </div>
    </section>

    <section id="recommendations" class="recommendations">
      <div class="section-shell">
        <div class="section-heading"><div><p class="kicker">05 / Recommendations</p><h2>From pattern to action.</h2></div></div>
        <div class="recommendation-grid">
          <article><p class="kicker">For families</p><h3>Make the search more legible.</h3><p>${recommendations.families}</p></article>
          <article><p class="kicker">For planners</p><h3>Plan with a sharper signal.</h3><p>${recommendations.planners}</p></article>
        </div>
      </div>
    </section>

    <section id="find-a-preschool" class="section-shell section-grid">
      <div>
        <p class="kicker">06 / Find a Preschool</p>
        <h2>Take your shortlist to LifeSG.</h2>
      </div>
      <div class="body-copy">
        <p>Use the official preschool search to enter your programme and search by address or centre name. Contact the centre to confirm current availability, waiting time and what your household would pay after any subsidies.</p>
        <a class="button button-dark" href="https://go.gov.sg/preschoolsearch">Search for a preschool on LifeSG <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section id="sources" class="section-shell sources">
      <p class="kicker">07 / Methods &amp; Limitations</p>
      <div class="source-grid">
        <h2>Assumptions and limitations</h2>
        <div class="analysis-stack">
          <p><strong>Sources.</strong> ECDA Listing of Centres and centre services listings, SingStat’s 2025 General Household Survey and URA planning-area boundaries.</p>
          ${assumptions.map(analysisDetails).join('')}
          <details class="analysis-detail">
            <summary>Further work</summary>
            <ul>${furtherWork.map((item) => `<li>${item}</li>`).join('')}</ul>
          </details>
        </div>
      </div>
    </section>
  </main>
  <footer class="site-footer section-shell"><span>Preschool Access in Singapore</span><a href="#top">Back to top ↑</a></footer>
`;

const tabs = [...document.querySelectorAll('[data-tab]')];

function loadDashboard(tab) {
  const key = tab.dataset.tab;
  const panel = document.getElementById(tab.getAttribute('aria-controls'));
  mountTableau(panel.querySelector('[data-tableau]'), tableauViews[key]);
  const chart = panel.querySelector('[data-chart]');
  if (chart) renderDeepDive(chart, chart.dataset.chart);
}

function activateTab(tab) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', selected);
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
  loadDashboard(tab);
}

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

function revealLinkedPanel() {
  const target = document.getElementById(window.location.hash.slice(1));
  const panel = target?.closest('.tab-panel');
  if (!panel) return;
  activateTab(document.getElementById(panel.getAttribute('aria-labelledby')));
  requestAnimationFrame(() => target.scrollIntoView());
}

window.addEventListener('hashchange', revealLinkedPanel);
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    if (link.hash === window.location.hash) revealLinkedPanel();
  });
});
revealLinkedPanel();

const observer = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;
  observer.disconnect();
  loadDashboard(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true'));
}, { rootMargin: '220px' });
observer.observe(document.querySelector('.tab-list'));
