# Preschool Access in Singapore

A static Vite site for exploring how preschool access varies by location, fees and reported availability.

## Run locally

Use Node.js 22.12 or later on the Node 22 release line.

```bash
npm ci --include=optional
npm run dev
```

Open the local URL printed by Vite. Create a production build with:

```bash
npm run build
npm run preview
```

## Replace project content

- **Dashboard explanations and findings:** edit the reference selections, findings and interpretation notes in `src/content.js`. The Key Findings cards reuse the same copy.
- **Recommendations:** edit the Families and Planners copy in `src/content.js`.
- **Deep Dive charts:** edit `src/deepDive.js`. The site loads both generated files from `public/data` using the Vite base URL.
- **Layout and visual style:** edit `src/main.js` and `src/style.css`.

## Replace a Tableau Public dashboard

Open `src/tableauConfig.js` and update the `publishedView` entry for `geography`, `affordability` or `persistence`. From Tableau Public’s Share embed code, copy the published view path after `/views/` or the older embed’s `name` value. Decode `&#47;` to `/` if present. The helper uses that exact path for the embed and the Open in Tableau Public link.

Set the last two arguments to the published desktop width and height in pixels. Narrow screens can scroll inside the frame or open Tableau Public directly. The Tableau v3 player is loaded once. Each workbook is mounted when first needed and remains mounted while visitors switch tabs. Update the reference selection and findings in `src/content.js` if the published dashboard changes.

## Refresh the Deep Dive data

Run `python3 scripts/prepare_deep_dive.py` with the local exports under `src/preschool_access/Data`. Commit both generated JSON files. Vercel uses those files directly during the regular Vite build.

- **Availability paths.** The script uses the `Reports` section of `Processed/preschool_factor_analysis.csv` and checks every matched report against the five corresponding `Raw/ListingofCentres DD-MM.csv` exports. The raw files also establish the exclusion counts. Relative periods are anchored to each snapshot month, so November 2026 through April 2027 are the months covered by all five listings. A candidate is a coded centre–programme–start month with at least one valid report. Missing snapshots, statuses outside Available, Limited and Full, and conflicting reports make a candidate ineligible. Identical coded raw statuses can collapse to one report. The source has zero duplicate coded report keys. Valid rows with an empty or `na` centre code are reported separately because their paths cannot be matched.
- **Budget options.** `Processed/affordability_availability.csv` supplies the latest snapshot, 14 November 2026. The script matches Infant, Playgroup, Nursery 1 and Nursery 2 to their respective fee levels and requires Singapore Citizen, full-day, positive listed monthly fees and a usable planning area. It found 49,980 coded centre–programme–month keys with zero coded duplicates and zero conflicting qualifying fees within or across months. Blank codes would create 28 apparent duplicate groups if treated as an identifier. These rows cannot establish distinct centres. Identical qualifying fee values collapse, while multiple values for an option make its fee unknown. Fee and location coverage are reported separately and can overlap. The initial S$1,300 and S$1,900 ceilings reflect the median and upper quartile of November infant-care fees for Available options with known areas.
- **Checks.** Preparation reconciles the five-date paths and per-status column totals to the source reports, then verifies all budget endpoints against a separate direct count from the affordability rows at each fee breakpoint and both default ceilings. Centre and postal codes are read as strings. The public JSON contains aggregate counts and excludes identifying codes.

## Preschool Finder

Run `PYTHONDONTWRITEBYTECODE=1 python3 scripts/prepare_finder.py` to refresh `public/data/preschool-finder.json`. The browser loads this committed file using the Vite base URL.

- **Sources and dates.** The script takes the latest dated records in `Processed/affordability_availability.csv` and checks their statuses against the corresponding ECDA `Raw/ListingofCentres DD-MM.csv`. The latest snapshot in these records is **14 November 2026**. Contact details and addresses come from the original listing. Coordinates come from the joined ECDA or OneMap postal-code records. The affordability workbook documents the **October 2026** fee listing and flags the May 2027 vacancy period as provisional. Fees are Singapore Citizen full-day listed monthly fees before subsidy and GST.
- **Join and exclusions.** The option key is centre code, programme and intended month. Relative periods are added to the snapshot's calendar month. Fees are matched on centre code and the programme's specific service level, after checking citizenship and service type. Positive fee cents are retained without dashboard label rounding. Identical values collapse, while distinct qualifying fees or conflicting status reports are unknown. Missing codes cannot be joined. The current audit found 1,785 coded centres, 49,980 coded latest option keys, 88 uncoded listing rows, no duplicate coded keys or conflicting fees/statuses, and two centres without coordinates. The finder excludes Full, missing statuses, unknown fees and unusable coordinates before scoring. Unknown-fee counts apply to otherwise eligible nearby options.
- **Ranking.** Defaults are a 3 km radius, Available or Limited, all schemes and three equal slider weights (50 each). The parent chooses an inclusive monthly fee ceiling from S$600 to S$4,500, with additional choices near common listed rates. Fee and distance earn `100 × clamp(1 − value / selected limit, 0, 1)`. Haversine distance is straight-line. Available earns 100 and Limited earns 50 on a preference scale. The match score is the sum of component scores times their normalised weights. Available only disables and zeroes the availability weight. Ties use distance, fee, then centre code. Scheme is an eligibility filter. No scheme discount, subsidy calculation, or regression score is applied.
- **Map and lookup.** Leaflet uses OpenStreetMap tiles with attribution. The ranked list, vectors and markers remain available if tiles fail. The built-in lookup checks the project’s preschool addresses and an April 2026 OneMap postal index. The index may miss newer addresses. Text search without a postal code uses the preschool listings unless the optional OneMap service is enabled. A map pin works for other origins without an account. No default origin is selected and lookup never runs while typing. Locations are kept in page memory and are not persisted or sent to analytics.
- **Postal index source.** Run `python3 scripts/prepare_postal_index.py /path/to/sg_postal_codes.csv` to regenerate the nine browser files. The current input is the [April 2026 OneMap CSV export from shahrizal18/singapore_postal_code](https://github.com/shahrizal18/singapore_postal_code/blob/main/sg_postal_codes.csv), SHA-256 `a29deb1634523c16076e8c8d087ca30b68c52270fe48878c4396a69ef1d7cf1c`. See the [Singapore Open Data Licence](https://www.onemap.gov.sg/legal/opendatalicence.html). The browser fetches the matching first-digit file on demand. Only an enabled live fallback sends the complete query to OneMap.
- **Optional full-address search.** To enable OneMap fallback on Vercel, set build variable `VITE_ONEMAP_LOOKUP=true` and server-only `ONEMAP_EMAIL` and `ONEMAP_EMAIL_PASSWORD` from a registered OneMap account. The Vercel route is `api/preschool-geocode.js`. For local testing of that optional route, use Vercel’s local runtime with those variables. Plain `npm run dev` uses local lookup and the map pin without credentials. A query is sent to OneMap only when the parent explicitly requests a lookup and the local index has no match. See [OneMap Search API](https://www.onemap.gov.sg/apidocs/search) and [OpenStreetMap tile usage](https://operations.osmfoundation.org/policies/tiles/).
- **Validation and limitations.** Run `node --test tests/finder.test.js` and `npm run build`. Reported vacancies are historical centre reports. The score describes the entered preferences and cannot indicate seat counts, admission odds, quality, actual journey times or household costs.

## Deploy to Vercel

Import this repository into Vercel. Use the default settings: Vercel detects Vite, runs `npm run build`, and serves the generated `dist` directory. No backend or environment variables are required.

For a CLI deployment, install and authenticate with Vercel, then run:

```bash
vercel
```
