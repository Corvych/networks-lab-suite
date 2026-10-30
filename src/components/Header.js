import { icons } from '../core/icons.js';
import { state } from '../core/state.js';
import { labsRegistry } from '../labs/registry.js';

export function createHeader() {
  function render(container) {
    const studentName = state.get('studentName');
    const completedCount = labsRegistry.filter(l => state.isLabCompleted(l.id)).length;

    container.innerHTML = `
      <header class="app-header">
        <div class="header-container">
          <div class="brand-wrapper" id="header-brand-link">
            <div class="brand-logo-icon">
              ${icons.logo}
            </div>
            <div class="brand-info">
              <div class="brand-title">
                NetLab Suite
                <span class="brand-badge">v1.0</span>
              </div>
              <div class="brand-subtitle">
                Сети и телекоммуникации &bull; Виртуальный практикум
              </div>
            </div>
          </div>

          <div class="header-actions">
            <div class="student-card-badge" title="Нажмите, чтобы изменить имя студента для отчетов">
              <div class="student-avatar">
                ${studentName.charAt(0).toUpperCase()}
              </div>
              <input 
                type="text" 
                id="header-student-name-input" 
                class="student-name-input" 
                value="${studentName}" 
                placeholder="Имя студента..."
                title="Имя студента"
              />
            </div>
          </div>
        </div>
      </header>
    `;

    // Brand click navigates home
    container.querySelector('#header-brand-link').addEventListener('click', () => {
      window.location.hash = '#/';
    });

    // Student name input persistence
    const nameInput = container.querySelector('#header-student-name-input');
    nameInput.addEventListener('input', (e) => {
      state.setStudentName(e.target.value);
      const avatar = container.querySelector('.student-avatar');
      if (avatar) {
        avatar.textContent = (e.target.value.trim().charAt(0) || 'С').toUpperCase();
      }
    });
  }

  return { render };
}
