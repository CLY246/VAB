import { tableauLibrary } from './tableauConfig.js';

let library;
const initialized = new WeakSet();

export async function mountTableau(container, view) {
  if (initialized.has(container)) return;
  initialized.add(container);
  const status = container.querySelector('[role="status"]');
  const viewport = container.querySelector('.tableau-viewport');
  const fail = (message) => {
    status.hidden = false;
    status.textContent = message;
    viewport.removeAttribute('aria-busy');
  };
  if (!view.src) {
    fail(`${view.title} is missing its published view URL.`);
    return;
  }

  status.textContent = 'Loading Tableau dashboard…';
  viewport.hidden = false;
  viewport.setAttribute('aria-busy', 'true');
  const slow = window.setTimeout(() => {
    fail('Tableau is taking longer than expected. You can open this view directly in Tableau Public.');
  }, 25000);

  try {
    library ??= import(/* @vite-ignore */ tableauLibrary);
    const { TableauViz, TableauEventType } = await library;
    const viz = new TableauViz();
    viz.width = `${view.width}px`;
    viz.height = `${view.height}px`;
    viz.style.minWidth = viz.width;
    viz.device = 'desktop';
    viz.toolbar = view.toolbar;
    viz.hideTabs = view.hideTabs;
    viz.addEventListener(TableauEventType.FirstInteractive, () => {
      window.clearTimeout(slow);
      viewport.removeAttribute('aria-busy');
      status.hidden = true;
    }, { once: true });
    viz.addEventListener(TableauEventType.VizLoadError, () => {
      window.clearTimeout(slow);
      viewport.hidden = true;
      fail('Tableau could not load this view. Use the link to open it directly.');
    });
    viz.src = view.src;
    viewport.append(viz);
  } catch (error) {
    window.clearTimeout(slow);
    // Allow a later tab visit to retry instead of caching the failed player import.
    library = undefined;
    initialized.delete(container);
    viewport.hidden = true;
    fail('The Tableau player could not load. Use the link to open the view directly.');
    console.error(error);
  }
}
