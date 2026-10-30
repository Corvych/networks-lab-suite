import { icons } from '../core/icons.js';
import { state } from '../core/state.js';

export function renderGenericLab(container, lab) {
  const isCompleted = state.isLabCompleted(lab.id);

  container.innerHTML = `
    <div class="lab-shell">
      <!-- Lab Shell Top Bar -->
      <div class="lab-shell-header">
        <div>
          <div class="lab-shell-breadcrumbs">
            <button class="breadcrumb-back" id="btn-back-catalog">
              ${icons.arrowLeft} Каталог лабораторных
            </button>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-current">Работа №${lab.number}</span>
          </div>
          <h1 class="lab-shell-title">
            Лабораторная работа №${lab.number}: ${lab.title}
          </h1>
        </div>

        <div class="lab-shell-actions">
          <button class="btn-secondary" id="btn-toggle-complete">
            ${icons.check} <span id="complete-btn-text">${isCompleted ? 'Выполнена ✓' : 'Отметить выполнение'}</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="lab-nav-tabs">
        <button class="lab-tab-btn active" data-tab="overview">
          ${icons.book} 1. Описание и цели
        </button>
        <button class="lab-tab-btn" data-tab="simulator-preview">
          ${icons.terminal} 2. Симулятор и стенд
        </button>
      </div>

      <!-- Tab: Overview -->
      <div class="lab-tab-pane active" id="pane-generic-overview">
        <div class="theory-wrapper">
          <div class="theory-section">
            <h2 class="theory-heading">
              Цель работы и теоретические основы
            </h2>
            <p class="theory-p">
              ${lab.description}
            </p>
          </div>

          <div class="theory-section">
            <h2 class="theory-heading">
              Ключевые учебные задачи
            </h2>
            <ul style="margin-left: 1.5rem; color: var(--text-secondary); line-height: 1.8;">
              ${lab.objectives.map(obj => `<li>${obj}</li>`).join('')}
            </ul>
          </div>

          <div class="theory-section">
            <h2 class="theory-heading">
              Методические указания к выполнению
            </h2>
            <div style="background: rgba(8, 12, 20, 0.4); border: 1px solid var(--bg-card-border); padding: 1.25rem; border-radius: var(--radius-md);">
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                Данная лабораторная работа направлена на глубокое практическое освоение концепций <strong>${lab.category}</strong>.
              </p>
              <div style="display: flex; gap: 1rem; align-items: center; color: var(--accent-cyan); font-size: 0.82rem; font-family: var(--font-mono);">
                <span>Уровень сложности: ${lab.difficulty}</span>
                <span>•</span>
                <span>Рекомендуемое время: ${lab.estimatedTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Simulator Preview -->
      <div class="lab-tab-pane" id="pane-generic-simulator">
        <div style="background: var(--bg-card); border: 1px solid var(--bg-card-border); border-radius: var(--radius-lg); padding: 3rem 2rem; text-align: center; max-width: 800px; margin: 0 auto;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: var(--accent-cyan);">
            ${icons.terminal}
          </div>
          <h3 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.75rem;">Модуль симуляции для работы №${lab.number}</h3>
          <p style="color: var(--text-secondary); max-width: 550px; margin: 0 auto 1.75rem; font-size: 0.95rem;">
            Архитектура приложения готова к подключению интерактивного движка для данной работы. В следующем этапе здесь будет размещен специализированный тренажёр.
          </p>
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(168, 85, 247, 0.12); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: var(--radius-full); color: var(--accent-purple); font-size: 0.8rem; font-family: var(--font-mono);">
            <span>⚡ Стек модуля: Vanilla JS Canvas / SVG Engine</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind back button
  container.querySelector('#btn-back-catalog').addEventListener('click', () => {
    window.location.hash = '#/';
  });

  // Complete toggle
  const completeBtn = container.querySelector('#btn-toggle-complete');
  const completeText = container.querySelector('#complete-btn-text');
  completeBtn.addEventListener('click', () => {
    const isDone = state.toggleLabCompleted(lab.id);
    completeText.textContent = isDone ? 'Выполнена ✓' : 'Отметить выполнение';
  });

  // Tab toggles
  const tabButtons = container.querySelectorAll('.lab-tab-btn');
  const paneOverview = container.querySelector('#pane-generic-overview');
  const paneSim = container.querySelector('#pane-generic-simulator');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (btn.dataset.tab === 'overview') {
        paneOverview.classList.add('active');
        paneSim.classList.remove('active');
      } else {
        paneOverview.classList.remove('active');
        paneSim.classList.add('active');
      }
    });
  });
}
