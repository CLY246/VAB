import { factors } from './finderScoring.js';

const feeLimits = [600, 610, 650, 800, 1000, 1200, 1235, 1290, 1500, 1800, 2000, 2500, 3000, 3500, 4000, 4500];
const feeLabel = new Intl.NumberFormat('en-SG');

export const finderSection = `
  <section id="find-a-preschool" class="finder" aria-labelledby="finder-title">
    <div class="section-shell">
      <p class="kicker">Find a Preschool</p>
      <h2 id="finder-title">Find preschool options that fit your family</h2>
      <p>Enter your location, programme, intended start month and fee limit. Adjust your priorities to explore up to five nearby options and see how each matches your preferences.</p>
      <p>Our analysis shows that reported access varies by location, fee limit and intended start month. Use the finder to compare options against your own requirements.</p>
      <p class="finder-snapshot" data-snapshot role="status">Loading preschool records…</p>
      <form name="preschool-finder" autocomplete="off">
        <fieldset class="finder-inputs" data-requirements disabled>
          <legend>Search requirements</legend>
          <div class="finder-location">
            <label for="finder-location">Singapore postal code or address</label>
            <div class="finder-location-actions">
              <input id="finder-location" name="location" type="search" maxlength="160" placeholder="Six digit postal code or street address">
              <button type="button" data-lookup>Look up address</button>
              <button type="button" data-pin aria-pressed="false" disabled>Choose a map pin</button>
            </div>
            <p class="finder-note">
              Six digit postal codes are checked against an April 2026 OneMap address index. For a location it misses, try the map pin.
              ${import.meta.env.VITE_ONEMAP_LOOKUP === 'true'
                ? 'OneMap receives unresolved queries only when you choose Look up address.'
                : 'Street address search covers the project’s preschool listings.'}
              Your search origin is not saved or sent to analytics. Map tiles for the area you search load from OpenStreetMap.
            </p>
            <p data-address-status role="status">Look up an address or choose a map pin to set an origin.</p>
            <div class="finder-address-choices" data-address-choices></div>
          </div>
          <div class="finder-field-grid">
            <label>Programme
              <select name="programme" required></select>
              <small>Confirm programme eligibility with the centre.</small>
            </label>
            <label>Intended start month
              <select name="month" required></select>
              <small data-month-warning role="status"></small>
            </label>
            <label>Maximum search radius
              <select name="radius">
                <option value="1">1 km</option><option value="3" selected>3 km</option>
                <option value="5">5 km</option><option value="10">10 km</option>
              </select>
            </label>
            <label>Maximum monthly listed fee
              <select name="feeLimit" required>
                <option value="" selected disabled>Choose a fee limit</option>
                ${feeLimits.map((limit) => `<option value="${limit * 100}">Up to S$${feeLabel.format(limit)}</option>`).join('')}
              </select>
              <small>Before subsidy and GST. Includes fees equal to the selected limit.</small>
            </label>
            <label>Reported status requirement
              <select name="status">
                <option value="AL">Available or Limited</option><option value="A">Available only</option>
              </select>
            </label>
            <label>Operator scheme
              <select name="scheme"><option value="">All schemes</option></select>
              <small>Scheme is an optional requirement. Affordability is scored using each centre’s listed fee.</small>
            </label>
          </div>
        </fieldset>
        <fieldset class="finder-inputs" data-priorities disabled>
          <legend>Your priorities</legend>
          <p class="finder-note">The sliders set relative importance. Equal slider values give each active priority the same share of the match score.</p>
          <div class="finder-field-grid finder-priorities">
            ${Object.entries(factors).map(([key, label]) => `<label>${label}
              <input type="range" name="${key}" min="0" max="100" value="50">
              <span class="finder-note" data-weight="${key}"></span>
              ${key === 'availability' ? '<small>Prefers centres that reported Available over Limited in the listing.</small>' : ''}
            </label>`).join('')}
          </div>
          <p class="finder-note" data-availability-example>Available earns 100 preference points and Limited earns 50. With a 20% weight, they add 20 and 10 points to the match score respectively. The points express a preference and do not measure vacancies or admission chances.</p>
          <p class="finder-note" data-availability-note hidden>Availability is already a requirement in Available only mode. Fee and distance share the effective weight.</p>
          <p class="finder-error" data-weight-error role="status"></p>
          <button type="button" data-reset-priorities>Reset priorities</button>
        </fieldset>
        <button class="button button-dark finder-submit" type="submit" data-search disabled>Find my matches</button>
        <p data-search-status role="status"></p>
      </form>

      <div class="finder-output">
        <section class="finder-results" aria-labelledby="finder-results-title">
          <h3 id="finder-results-title">Top matches for your preferences</h3>
          <div data-results hidden>
            <div class="finder-summary" data-results-summary></div>
            <div class="finder-result-list" data-result-list></div>
          </div>
        </section>
        <section class="finder-map-panel" aria-labelledby="finder-map-title">
          <h3 id="finder-map-title">Search area map</h3>
          <button type="button" data-map-centre hidden>Use map centre as search origin</button>
          <div class="finder-map" data-map tabindex="0" role="region" aria-label="Preschool search map"></div>
          <p class="finder-map-legend"><span>◆ Search origin</span><span>◯ Search radius</span><span>1 to 5 Top matches</span><span>● Other eligible centres</span></p>
          <p class="finder-note" data-tile-status role="status"></p>
          <p class="finder-note" data-map-selection role="status"></p>
        </section>
      </div>

      <details class="analysis-detail finder-method">
        <summary>How your matches are ranked</summary>
        <p>The finder first applies your programme, intended month, reported status, radius, fee limit and scheme requirements. Scheme does not contribute points or change listed fees. The ranking uses your chosen priorities and no regression model.</p>
        <ul>
          <li><strong>Fee score</strong> = 100 × max(0, 1 − listed fee ÷ fee limit). This measures how far the listed fee is below your limit. It measures neither a discount nor quality.</li>
          <li><strong>Distance score</strong> = 100 × max(0, 1 − straight line distance ÷ radius). Straight line distance can differ from your actual journey.</li>
          <li><strong>Availability score</strong> = 100 for Available and 50 for Limited. These preference values describe neither seat counts nor admission chances. In Available only mode, availability carries zero weight.</li>
          <li><strong>Match score</strong> = the sum of each component score multiplied by its share of the total active weight. The highest match score ranks first. Ties go to the nearer centre, then the lower fee, then centre code. Scores depend on your limits and priorities. Scores from searches with different limits should be read separately.</li>
        </ul>
        <p>The listing date above is when reports were captured. Reports may lag behind changes, and centres should confirm current status, programme eligibility and fees. Listed fees exclude household subsidies, GST and other charges. Options with unknown comparable fees or coordinates are excluded from ranking.</p>
        <p>Source records come from the ECDA Listing of Centres and the matched centre services fee export. Coordinates come from ECDA or OneMap Singapore postal code matches. The postal index uses April 2026 address data from OneMap Singapore, Singapore Land Authority, available under the <a href="https://www.onemap.gov.sg/legal/opendatalicence.html">Singapore Open Data Licence</a>.</p>
      </details>
    </div>
  </section>`;
