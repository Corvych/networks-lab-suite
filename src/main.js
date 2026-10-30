import './style.css';
import { createHeader } from './components/Header.js';
import { createCatalogView } from './components/CatalogView.js';
import { createLab1 } from './labs/lab1/index.js';
import { renderGenericLab } from './components/LabShell.js';
import { router } from './core/router.js';
import { state } from './core/state.js';
import { getLabById } from './labs/registry.js';

function initApp() {
  const root = document.querySelector('#app');
  if (!root) return;

  // Clear root
  root.innerHTML = '';

  // 1. Create Header Container
  const headerContainer = document.createElement('div');
  root.appendChild(headerContainer);
  const header = createHeader();
  header.render(headerContainer);

  // 2. Create Main Viewport
  const viewport = document.createElement('main');
  viewport.className = 'main-viewport';
  root.appendChild(viewport);

  // Re-render header on state updates
  state.subscribe(() => {
    header.render(headerContainer);
  });

  // 3. Define Routes
  // Catalog View
  router.add('/', () => {
    const catalog = createCatalogView();
    catalog.render(viewport);
  });

  // Lab View: /lab/:id
  router.add('/lab/:id', (params) => {
    const labId = params.id;
    if (labId === 'lab-1' || labId === '1') {
      const lab1 = createLab1();
      lab1.render(viewport);
    } else {
      const lab = getLabById(labId);
      if (lab) {
        renderGenericLab(viewport, lab);
      } else {
        // Fallback to catalog if lab not found
        router.navigate('#/');
      }
    }
  });

  // Start router
  router.start();
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
