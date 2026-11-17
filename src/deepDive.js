/**
 * Reserved for the D3 parallel sets chart.
 * The verified transition dataset will be added to this module later.
 */
export function renderDeepDivePlaceholder(container) {
  container.innerHTML = `
    <div class="chart-placeholder" role="status">
      <span class="placeholder-kicker">Chart placeholder</span>
      <strong>D3 parallel sets will appear here once transition data is verified.</strong>
      <span>Planned ribbons will follow matched centre–programme pairs across reporting dates.</span>
    </div>
  `;
}
