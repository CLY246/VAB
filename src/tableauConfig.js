const tableauPublic = 'https://public.tableau.com';

export const tableauLibrary = `${tableauPublic}/javascripts/api/tableau.embedding.3.latest.min.js`;

function publishedView(title, path, width, height) {
  const openUrl = `${tableauPublic}/views/${path}`;
  return {
    title,
    src: `${openUrl}?publish=yes&:language=en-US`,
    openUrl,
    width,
    height,
    toolbar: 'bottom',
    hideTabs: true,
  };
}

export const tableauViews = {
  geography: publishedView('Geographical Access', '2026-11-16-Visualisation_1_final/PreschoolAvailability', 1440, 1527),
  affordability: publishedView('Affordability and Availability', '2026-11-17-Visualisation_2_final/Dashboard2', 1380, 877),
  persistence: {
    ...publishedView('Persistent Constraints', '2026-11-16-Visualisation_3_final/Dashboard3-PersistentPreschoolConstraints', 1440, 993),
    // Set to true once the realigned v3 workbook is republished to Tableau Public.
    d3Republished: false,
  },
};
