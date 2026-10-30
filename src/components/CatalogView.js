import { labsRegistry } from '../labs/registry.js';
import { state } from '../core/state.js';
import { icons } from '../core/icons.js';
import { router } from '../core/router.js';

export function createCatalogView() {
  let activeFilter = 'all';
  let searchQuery = '';

  function render(container) {
    const completedCount = labsRegistry.filter(l => state.isLabCompleted(l.id)).length;
    const progressPct = Math.round((completedCount / labsRegistry.length) * 100);

    container.innerHTML = `
      <div class="catalog-view">
        <!-- Hero Section -->
        <section class="catalog-hero">
          <div class="hero-glow-orb"></div>
          <div class="hero-grid-pattern"></div>
          
          <div class="hero-content">
            <div class="hero-pill">
              <span class="hero-pill-dot"></span>
              <span>Сетевой лабораторный практикум</span>
            </div>

            <h1 class="hero-title">
              Лабораторная среда по <span class="highlight">Сетям и телекоммуникациям</span>
            </h1>

            <p class="hero-desc">
              Интерактивная виртуальная лаборатория для исследования физических сигналов, 
              построения сетевых топологий, анализа фреймов Ethernet, IP-маршрутизации и протоколов стека TCP/IP.
            </p>

            <div class="hero-metrics">
              <div class="metric-item">
                <span class="metric-val">
                  ${labsRegistry.length}
                </span>
                <span class="metric-label">Всего лабораторных</span>
              </div>

              <div class="metric-item">
                <span class="metric-val">
                  <span id="metric-completed-count">${completedCount}</span>
                  <span class="metric-unit">/ ${labsRegistry.length}</span>
                </span>
                <span class="metric-label">Выполнено вами</span>
              </div>

              <div class="metric-item">
                <span class="metric-val">
                  <span id="metric-progress-pct">${progressPct}</span>
                  <span class="metric-unit">%</span>
                </span>
                <span class="metric-label">Общий прогресс</span>
              </div>

              <div class="metric-item">
                <span class="metric-val" style="color: var(--accent-purple);">
                  7
                  <span class="metric-unit">уровней</span>
                </span>
                <span class="metric-label">Модель OSI</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Filters & Search Toolbar -->
        <div class="catalog-toolbar">
          <div class="filter-group">
            <button class="filter-btn active" data-filter="all">
              Все работы (${labsRegistry.length})
            </button>
            <button class="filter-btn" data-filter="physical">
              Физический
            </button>
            <button class="filter-btn" data-filter="datalink">
              Канальный
            </button>
            <button class="filter-btn" data-filter="network">
              Сетевой
            </button>
            <button class="filter-btn" data-filter="transport">
              Транспортный
            </button>
            <button class="filter-btn" data-filter="application">
              Прикладной
            </button>
          </div>

          <div class="search-box-wrapper">
            <span class="search-icon">${icons.search}</span>
            <input 
              type="text" 
              id="catalog-search" 
              class="search-input" 
              placeholder="Поиск по названию или теме..."
              value="${searchQuery}"
            />
          </div>
        </div>

        <!-- Labs Grid Cards -->
        <div class="labs-grid" id="labs-cards-container">
          <!-- Populated dynamically -->
        </div>
      </div>
    `;

    renderCards(container);

    // Filter Buttons
    const filterButtons = container.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderCards(container);
      });
    });

    // Search Input
    const searchInput = container.querySelector('#catalog-search');
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderCards(container);
    });
  }

  function renderCards(container) {
    const grid = container.querySelector('#labs-cards-container');
    if (!grid) return;

    const filtered = labsRegistry.filter(lab => {
      // Category filter
      if (activeFilter !== 'all' && lab.layerKey !== activeFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery) {
        const query = searchQuery;
        const inTitle = lab.title.toLowerCase().includes(query);
        const inSubtitle = lab.subtitle.toLowerCase().includes(query);
        const inDesc = lab.description.toLowerCase().includes(query);
        const inNumber = String(lab.number) === query;
        const inObjectives = lab.objectives.some(o => o.toLowerCase().includes(query));
        return inTitle || inSubtitle || inDesc || inNumber || inObjectives;
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--bg-card-border);">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-secondary);">Ничего не найдено по вашему запросу</p>
          <p style="font-size: 0.85rem;">Попробуйте изменить поисковый запрос или сбросить фильтры уровней OSI.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(lab => {
      const isCompleted = state.isLabCompleted(lab.id);
      let statusBadgeHtml = '';

      if (isCompleted) {
        statusBadgeHtml = `<span class="status-badge completed">${icons.check} Выполнено</span>`;
      } else if (lab.status === 'available') {
        statusBadgeHtml = `<span class="status-badge available"><span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span> Доступна</span>`;
      } else {
        statusBadgeHtml = `<span class="status-badge soon">В каталоге</span>`;
      }

      const buttonLabel = isCompleted 
        ? 'Открыть повторно' 
        : (lab.status === 'available' ? 'Начать работу' : 'Смотреть описание');

      return `
        <article class="lab-card" data-lab-id="${lab.id}" style="--card-accent: ${lab.accentColor};">
          <div class="lab-card-header">
            <div class="lab-badge-row">
              <span class="layer-badge ${lab.layerKey}">
                ${lab.category}
              </span>
              ${statusBadgeHtml}
            </div>

            <div class="lab-icon-box" style="color: ${lab.accentColor};">
              ${lab.icon}
            </div>
          </div>

          <div class="lab-number-label">
            ЛАБОРАТОРНАЯ РАБОТА №${lab.number}
          </div>

          <h2 class="lab-card-title">
            ${lab.title}
          </h2>

          <p class="lab-card-desc">
            ${lab.description}
          </p>

          <ul class="lab-objectives-list">
            ${lab.objectives.slice(0, 3).map(obj => `
              <li class="lab-objective-item">
                ${icons.check}
                <span>${obj}</span>
              </li>
            `).join('')}
          </ul>

          <div class="lab-meta-footer">
            <div class="lab-meta-info">
              <span class="lab-meta-item">
                ${icons.gauge} ${lab.difficulty}
              </span>
              <span class="lab-meta-item">
                ${icons.clock} ${lab.estimatedTime}
              </span>
            </div>

            <button class="btn-launch-lab" data-target-lab="${lab.id}">
              <span>${buttonLabel}</span>
              ${icons.arrowRight}
            </button>
          </div>
        </article>
      `;
    }).join('');

    // Attach card click handlers
    grid.querySelectorAll('.lab-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent double triggers if clicked on launch button
        const labId = card.dataset.labId;
        router.navigate(`#/lab/${labId}`);
      });
    });

    grid.querySelectorAll('.btn-launch-lab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const labId = btn.dataset.targetLab;
        router.navigate(`#/lab/${labId}`);
      });
    });
  }

  return { render };
}
