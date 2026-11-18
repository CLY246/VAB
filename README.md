# Preschool Access in Singapore

A static Vite site for exploring how preschool access varies by location, fees and reported availability.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with:

```bash
npm run build
npm run preview
```

## Replace project content

- **Approved findings:** edit the three cards in `src/content.js`.
- **Recommendations:** edit the Families and Planners copy in `src/content.js`.
- **Tableau Public views:** paste the three published view URLs into `src/tableauConfig.js` (`geography`, `affordability`, and `constraints`). Each dashboard is loaded only the first time its tab is opened; a missing URL displays an intentional placeholder.
- **Deep Dive charts:** edit `src/deepDive.js`. The site loads both generated files from `public/data` using the Vite base URL.
- **Layout and visual style:** edit `src/main.js` and `src/style.css`.

## Refresh the Deep Dive data

Run `python3 scripts/prepare_deep_dive.py` with the local exports under `src/preschool_access/Data`. Commit both generated JSON files. Vercel uses those files directly during the regular Vite build.

- **Availability paths.** The script uses the `Reports` section of `Processed/preschool_factor_analysis.csv` and checks every matched report against the five corresponding `Raw/ListingofCentres DD-MM.csv` exports. The raw files also establish the exclusion counts. Relative periods are anchored to each snapshot month, so November 2026 through April 2027 are the months covered by all five listings. A candidate is a coded centre–programme–start month with at least one valid report. Missing snapshots, statuses outside Available, Limited and Full, and conflicting reports make a candidate ineligible. Identical coded raw statuses can collapse to one report. The source has zero duplicate coded report keys. Valid rows with an empty or `na` centre code are reported separately because their paths cannot be matched.
- **Budget options.** `Processed/affordability_availability.csv` supplies the latest snapshot, 14 November 2026. The script matches Infant, Playgroup, Nursery 1 and Nursery 2 to their respective fee levels and requires Singapore Citizen, full-day, positive listed monthly fees and a usable planning area. It found 49,980 coded centre–programme–month keys with zero coded duplicates and zero conflicting qualifying fees within or across months. Blank codes would create 28 apparent duplicate groups if treated as an identifier. These rows cannot establish distinct centres. Identical qualifying fee values collapse, while multiple values for an option make its fee unknown. Fee and location coverage are reported separately and can overlap. The initial S$1,300 and S$1,900 ceilings reflect the median and upper quartile of November infant-care fees for Available options with known areas.
- **Checks.** Preparation reconciles the five-date paths and per-status column totals to the source reports, then verifies all budget endpoints against a separate direct count from the affordability rows at each fee breakpoint and both default ceilings. Centre and postal codes are read as strings. The public JSON contains aggregate counts and excludes identifying codes.

## Deploy to Vercel

Import this repository into Vercel. Use the default settings: Vercel detects Vite, runs `npm run build`, and serves the generated `dist` directory. No backend or environment variables are required.

For a CLI deployment, install and authenticate with Vercel, then run:

```bash
vercel
```
