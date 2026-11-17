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
- **Deep dive data and chart:** add the verified centre–programme transition data and D3 rendering in `src/deepDive.js`. The first build includes the controls, legend and labelled chart placeholder.
- **Layout and visual style:** edit `src/main.js` and `src/style.css`.

## Deploy to Vercel

Import this repository into Vercel. Use the default settings: Vercel detects Vite, runs `npm run build`, and serves the generated `dist` directory. No backend or environment variables are required.

For a CLI deployment, install and authenticate with Vercel, then run:

```bash
vercel
```
