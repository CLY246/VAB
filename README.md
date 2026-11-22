# Preschool Access in Singapore

An interactive visual analytics website exploring how preschool access varies
across location, listed fees and reported availability in Singapore.

Developed for IS428 Visual Analytics by Team G2T9.

- Live website: https://vab-team9-preschool.vercel.app/
- Tableau Public: 
    Dashboard 1: https://public.tableau.com:9443/views/2026-11-16-Visualisation_1_final/PreschoolAvailability?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link
    Dashboard 2: https://public.tableau.com:9443/views/2026-11-17-Visualisation_2_final/Dashboard2?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link
    Dashboard 3: https://public.tableau.com:9443/views/2026-11-18-Visualisation_3_final/Dashboard3-PersistentPreschoolConstraints?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link

## Features

- **Geographical Access:** compares centres reporting Available or Limited
  relative to the population of young children, alongside workplace context.
- **Affordability and Availability:** explores how listed fee ceilings affect
  the number of reported options.
- **Persistent Constraints:** examines reported availability across five
  listings and presents saved model comparisons.
- **Deep Dive:** provides additional interactive views of availability paths
  and budget options.
- **Preschool Finder:** ranks eligible centres using parent-selected distance,
  fee and availability preferences.

## Technology

Vite, JavaScript, CSS, Tableau Public, D3.js, Leaflet and Python.
OneMap and OpenStreetMap support location lookup and mapping.

## Run locally

Use Node.js 22.12 or later on the Node 22 release line.

~~~bash
npm ci --include=optional
npm run dev
~~~

Open the local URL printed by Vite.

To build and preview the production site:

~~~bash
npm run build
npm run preview
~~~

## Data and methodology

The project combines:

- ECDA centre listings and reported vacancy statuses.
- Listed Singapore Citizen full-day monthly fees.
- SingStat resident-child population and workplace counts.
- URA planning-area boundaries.
- ECDA and OneMap location records.

The latest vacancy snapshot used is **14 November 2026**.
The fee source is the **October 2026** listing.

Persistence analysis matches centre–programme options for the same intended
start month across five listings. See `docs/methodology.md` for the reference
month mapping, coverage, exclusions, validation checks and model methodology.

Fees are listed amounts before subsidy and GST. Available, Limited and Full
are reported centre statuses; they do not provide vacant-seat counts or
guarantee admission.

## Preschool Finder

Parents choose a location, programme, intended start month, fee ceiling and
search radius. Eligible centres are ranked using adjustable fee, distance
and availability preferences.

Operator scheme is an eligibility filter and does not contribute to the
ranking score. Distance is straight-line distance rather than journey time.
The score reflects the entered preferences, not centre quality or admission
probability.

The finder works with the committed data and local postal lookup.
Optional OneMap address search requires additional configuration.

## Project structure

- `src/content.js`: dashboard explanations, findings and recommendations.
- `src/tableauConfig.js`: Tableau Public view paths and embed dimensions.
- `src/deepDive.js`: additional interactive charts.
- `src/main.js` and `src/style.css`: application layout and styling.
- `scripts/`: data preparation and validation.
- `public/data/`: generated data loaded by the website.
- `tests/`: automated checks.

## Refresh generated data

With the required source files under `src/preschool_access/Data`, run:

~~~bash
python3 scripts/prepare_deep_dive.py
PYTHONDONTWRITEBYTECODE=1 python3 scripts/prepare_finder.py
~~~

Commit the updated generated files in `public/data`.

To update an embedded dashboard, change its published view path and
dimensions in `src/tableauConfig.js`. Update the corresponding explanations
in `src/content.js`.

## Validation

~~~bash
node --test tests/finder.test.js
npm run build
~~~

Additional data checks and their results are documented in
`docs/methodology.md`.

## Deployment

Import the repository into Vercel using the Vite preset:

- Build command: `npm run build`
- Output directory: `dist`

The core site requires no backend credentials. Optional live OneMap lookup
requires the configuration documented in the deployment guide.

## Limitations

The site uses historical reported availability. It does not estimate seat
counts, admission odds, centre quality, actual journey times or household
fees after subsidy.

Dashboard controls filter saved results; they do not retrain the model.

## Sources and attribution

- ECDA
- Singapore Department of Statistics
- Urban Redevelopment Authority
- OneMap / Singapore Land Authority
- OpenStreetMap contributors
- Postal-index source: https://github.com/shahrizal18/singapore_postal_code

See the methodology documentation for source links, dates and applicable
licences.