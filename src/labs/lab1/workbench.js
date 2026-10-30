import { CircuitGraph } from './circuitGraph.js';
import { icons } from '../../core/icons.js';

export class CircuitWorkbench {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.graph = new CircuitGraph();

    // Canvas pan & zoom state
    this.zoom = 1.0;
    this.panX = 40;
    this.panY = 30;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;

    // Interactive wiring state
    this.activeWiring = null; // { fromNode, fromPort, color, startX, startY }

    // Audio context
    this.audioCtx = null;
    this.audioOsc = null;
    this.audioGain = null;
    this.isPlayingAudio = false;

    // Animation frame for instruments
    this.animationId = null;
    this.timeOffset = 0;

    // Node counter for IDs
    this.nodeCounter = 1;

    // Modal state for detailed oscilloscope / spectrograph view
    this.activeModalNodeId = null;
    this.isModalFrozen = false;
    this.modalTimeDiv = 2; // ms
    this.modalScaleV = 3.5; // V
    this.modalMaxFreq = 40000; // Hz
    this.spectroFreqMin = 0;
    this.spectroFreqMax = 40000;
    this.spectroScaleV = 3.0;
    this.spectroScaleMode = 'linear'; // 'linear' or 'db'
    this.spectroShowEnvelope = true; // continuous curve & envelope between peaks
    this.escKeyHandler = null;
    this.docClickHandler = null;

    this.initUI();
    // Start with a clean empty canvas so the student builds from scratch!
    this.updateTransform();
    this.updateWires();
    this.updateEmptyState();
    this.bindEvents();
    this.startAnimationLoop();
  }

  initUI() {
    this.container.innerHTML = `
      <div class="workbench-layout-vertical">
        <!-- Top Workbench Canvas Viewport -->
        <div class="workbench-viewport" id="wb-viewport">
          <!-- Floating Toolbar (Zoom, Presets, Clear, Audio) -->
          <div class="workbench-toolbar">
            <div class="toolbar-left-group">
              <span class="toolbar-badge-title">ХОЛСТ СХЕМЫ:</span>
              <span class="toolbar-hint-text">Перетаскивайте блоки из нижней панели, соединяйте порты кабелями</span>
            </div>

            <div class="toolbar-right-group">
              <!-- Zoom Controls -->
              <div class="zoom-controls-cluster">
                <button class="zoom-btn" id="btn-zoom-out" title="Уменьшить масштаб (Ctrl + -)">–</button>
                <span class="zoom-label" id="zoom-value-label">100%</span>
                <button class="zoom-btn" id="btn-zoom-in" title="Увеличить масштаб (Ctrl + +)">+</button>
                <button class="zoom-btn" id="btn-zoom-reset" title="Сбросить масштаб">1:1</button>
              </div>

              <!-- Preset selector cluster -->
              <div style="display: flex; align-items: center; gap: 0.35rem;">
                <label for="wb-preset-select" style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Схема:</label>
                <select class="wb-action-btn" id="wb-preset-select" style="padding: 0.25rem 0.5rem; background: rgba(0, 240, 255, 0.08); border-color: rgba(0, 240, 255, 0.3); color: var(--accent-cyan); font-weight: 700; cursor: pointer;">
                  <option value="am">⚡ АМ (DSB-FC)</option>
                  <option value="ssb">⚡ SSB (Однополосная)</option>
                  <option value="ask">⚡ АМн (ASK манипуляция)</option>
                  <option value="fsk">⚡ ЧМн (FSK манипуляция)</option>
                  <option value="psk">⚡ ФМн (PSK манипуляция)</option>
                </select>
                <button class="wb-action-btn" id="btn-wb-load-preset" title="Загрузить выбранную схему">Загрузить</button>
              </div>
              <button class="wb-action-btn" id="btn-wb-clear-all">🗑️ Очистить всё</button>
              <button class="wb-action-btn" id="btn-wb-clear-wires">✂️ Снять кабели</button>
              <button class="wb-action-btn" id="btn-wb-audio-toggle">🔊 Звук: Выкл</button>
            </div>
          </div>

          <!-- Drag Overlay Dropzone Indicator -->
          <div class="workbench-drag-overlay" id="wb-drag-overlay">
            <div class="drag-overlay-hint">
              <span class="drag-overlay-icon">＋</span>
              <span>Отпустите блок для размещения на схеме</span>
            </div>
          </div>

          <!-- Zoomable / Pannable Board Area -->
          <div class="workbench-canvas-surface" id="wb-canvas-surface">
            <!-- SVG Wires Layer inside transform space -->
            <svg class="workbench-wires-svg" id="wb-wires-svg"></svg>
            <!-- Nodes Container -->
            <div class="workbench-nodes-container" id="wb-nodes-container"></div>
          </div>
        </div>

        <!-- Bottom Palette Dock -->
        <div class="workbench-bottom-dock">
          <div class="bottom-dock-header">
            <div class="dock-title-group">
              <span class="dock-title">Доступные блоки тракта</span>
              <span class="dock-hint">Перетащите блок на схему (Drag & Drop) или нажмите для быстрого добавления</span>
            </div>
            <div class="dock-legend">
              <span class="dock-legend-pill pill-gen">● Генераторы</span>
              <span class="dock-legend-pill pill-mod">● Модуляторы</span>
              <span class="dock-legend-pill pill-filt">● Фильтр</span>
              <span class="dock-legend-pill pill-inst">● Измерители</span>
              <span class="dock-legend-pill pill-rx">● Приемник</span>
            </div>
          </div>

          <div class="bottom-dock-cards-scroll">
            <!-- 1. Source -->
            <div class="dock-card" draggable="true" data-type="source" title="Перетащите блок на схему">
              <div class="dock-card-preview" style="--preview-border: #00f0ff; --preview-glow: rgba(0,240,255,0.25);">
                <div class="dock-preview-header">
                  <span class="dock-preview-title">Источник сообщения</span>
                  <span class="dock-preview-badge" style="color: #00f0ff;">НЧ</span>
                </div>
                <div class="dock-preview-screen">
                  <svg viewBox="0 0 150 48" class="dock-preview-svg">
                    <line x1="0" y1="24" x2="150" y2="24" stroke="rgba(0,240,255,0.15)" stroke-dasharray="2 3"/>
                    <path d="M 8 24 Q 20 6 32 24 T 56 24 L 66 24 L 66 10 L 82 10 L 82 38 L 98 38 L 98 10 L 114 10 L 114 24 L 142 24" fill="none" stroke="#00f0ff" stroke-width="2" stroke-linecap="round"/>
                    <text x="10" y="44" fill="rgba(0,240,255,0.8)" font-size="8" font-family="monospace">Fm: 1.0k</text>
                    <text x="96" y="44" fill="#38bdf8" font-size="8" font-family="monospace">1 0 1</text>
                  </svg>
                  <span class="dock-preview-socket" style="right: -4px; top: 50%; transform: translateY(-50%); --socket-color: #00f0ff;" title="ВЫХОД"></span>
                </div>
              </div>
              <div class="dock-card-footer">
                <span class="dock-card-drag-handle">⠿</span>
                <div class="dock-card-body">
                  <span class="dock-card-name">Источник сообщения</span>
                  <span class="dock-card-desc">Тон / Речь / Биты</span>
                </div>
              </div>
            </div>

            <!-- 2. Oscillator -->
            <div class="dock-card" draggable="true" data-type="oscillator" title="Перетащите блок на схему">
              <div class="dock-card-preview" style="--preview-border: #a855f7; --preview-glow: rgba(168,85,247,0.25);">
                <div class="dock-preview-header">
                  <span class="dock-preview-title">Несущая</span>
                  <span class="dock-preview-badge" style="color: #a855f7;">ВЧ</span>
                </div>
                <div class="dock-preview-screen">
                  <svg viewBox="0 0 150 48" class="dock-preview-svg">
                    <line x1="0" y1="24" x2="150" y2="24" stroke="rgba(168,85,247,0.15)" stroke-dasharray="2 3"/>
                    <path d="M 6 24 Q 10 10 14 24 T 22 24 T 30 24 T 38 24 T 46 24 T 54 24 T 62 24 T 70 24 T 78 24 T 86 24 T 94 24 T 102 24 T 110 24 T 118 24 T 126 24 T 134 24 T 142 24" fill="none" stroke="#c084fc" stroke-width="1.8" stroke-linecap="round"/>
                    <text x="10" y="44" fill="#a855f7" font-size="8" font-family="monospace" font-weight="700">Fc: 20.0 кГц (ВЧ)</text>
                  </svg>
                  <span class="dock-preview-socket" style="right: -4px; top: 50%; transform: translateY(-50%); --socket-color: #a855f7;" title="RF ВЫХОД"></span>
                </div>
              </div>
              <div class="dock-card-footer">
                <span class="dock-card-drag-handle">⠿</span>
                <div class="dock-card-body">
                  <span class="dock-card-name">Несущая</span>
                  <span class="dock-card-desc">ВЧ генератор (Fc)</span>
                </div>
              </div>
            </div>

            <!-- 3. Modulator -->
            <div class="dock-card" draggable="true" data-type="modulator" title="Перетащите блок на схему">
              <div class="dock-card-preview" style="--preview-border: #38bdf8; --preview-glow: rgba(56,189,248,0.25);">
                <div class="dock-preview-header">
                  <span class="dock-preview-title">Модулятор</span>
                  <span class="dock-preview-badge" style="color: #38bdf8;">MOD</span>
                </div>
                <div class="dock-preview-screen">
                  <svg viewBox="0 0 150 48" class="dock-preview-svg">
                    <line x1="2" y1="16" x2="28" y2="16" stroke="#00f0ff" stroke-width="1.5"/>
                    <line x1="2" y1="32" x2="28" y2="32" stroke="#a855f7" stroke-width="1.5"/>
                    <path d="M 28 16 L 38 21 M 28 32 L 38 27" fill="none" stroke="#64748b" stroke-width="1.2"/>
                    <circle cx="46" cy="24" r="8" fill="#071829" stroke="#38bdf8" stroke-width="1.4"/>
                    <path d="M 42 20 L 50 28 M 50 20 L 42 28" stroke="#38bdf8" stroke-width="1.4"/>
                    <line x1="54" y1="24" x2="64" y2="24" stroke="#38bdf8" stroke-width="1.5"/>
                    <path d="M 64 24 Q 70 14 76 24 T 88 24 T 100 24 T 112 24 T 124 24 T 136 24 T 142 24" fill="none" stroke="#38bdf8" stroke-width="1.5"/>
                    <text x="64" y="44" fill="#38bdf8" font-size="7.5" font-family="monospace">AM·SSB·ASK·FSK</text>
                  </svg>
                  <span class="dock-preview-socket" style="left: -4px; top: 33%; transform: translateY(-50%); --socket-color: #00f0ff;" title="ВХОД НЧ/БИТЫ"></span>
                  <span class="dock-preview-socket" style="left: -4px; top: 67%; transform: translateY(-50%); --socket-color: #a855f7;" title="ВХОД НЕСУЩЕЙ"></span>
                  <span class="dock-preview-socket" style="right: -4px; top: 50%; transform: translateY(-50%); --socket-color: #38bdf8;" title="RF ВЫХОД"></span>
                </div>
              </div>
              <div class="dock-card-footer">
                <span class="dock-card-drag-handle">⠿</span>
                <div class="dock-card-body">
                  <span class="dock-card-name">Модулятор</span>
                  <span class="dock-card-desc">AM, SSB, ASK, FSK, PSK</span>
                </div>
              </div>
            </div>

            <!-- 4. Filter -->
            <div class="dock-card" draggable="true" data-type="filter" title="Перетащите блок на схему">
              <div class="dock-card-preview" style="--preview-border: #10b981; --preview-glow: rgba(16,185,129,0.25);">
                <div class="dock-preview-header">
                  <span class="dock-preview-title">Полосовой фильтр</span>
                  <span class="dock-preview-badge" style="color: #10b981;">BPF</span>
                </div>
                <div class="dock-preview-screen">
                  <svg viewBox="0 0 150 48" class="dock-preview-svg">
                    <line x1="8" y1="36" x2="142" y2="36" stroke="rgba(255,255,255,0.15)"/>
                    <path d="M 12 36 L 38 34 Q 52 32 62 14 Q 72 8 82 14 Q 92 32 106 34 L 138 36 Z" fill="rgba(16,185,129,0.2)" stroke="#10b981" stroke-width="1.8"/>
                    <line x1="58" y1="12" x2="58" y2="36" stroke="rgba(16,185,129,0.6)" stroke-dasharray="2 2"/>
                    <line x1="86" y1="12" x2="86" y2="36" stroke="rgba(16,185,129,0.6)" stroke-dasharray="2 2"/>
                    <text x="60" y="25" fill="#ffffff" font-size="7" font-family="monospace">ΔF</text>
                    <text x="10" y="44" fill="#10b981" font-size="8" font-family="monospace">Полоса: 6.0 кГц</text>
                  </svg>
                  <span class="dock-preview-socket" style="left: -4px; top: 50%; transform: translateY(-50%); --socket-color: #10b981;" title="ВХОД"></span>
                  <span class="dock-preview-socket" style="right: -4px; top: 50%; transform: translateY(-50%); --socket-color: #10b981;" title="ВЫХОД"></span>
                </div>
              </div>
              <div class="dock-card-footer">
                <span class="dock-card-drag-handle">⠿</span>
                <div class="dock-card-body">
                  <span class="dock-card-name">Полосовой фильтр</span>
                  <span class="dock-card-desc">Ширина полосы + шум</span>
                </div>
              </div>
            </div>

            <!-- 5. Oscilloscope -->
            <div class="dock-card" draggable="true" data-type="oscilloscope" title="Перетащите блок на схему">
              <div class="dock-card-preview" style="--preview-border: #00f0ff; --preview-glow: rgba(0,240,255,0.25);">
                <div class="dock-preview-header">
                  <span class="dock-preview-title">Осциллограф</span>
                  <span class="dock-preview-badge" style="color: #00f0ff;">OSC</span>
                </div>
                <div class="dock-preview-screen">
                  <svg viewBox="0 0 150 48" class="dock-preview-svg">
                    <rect x="8" y="4" width="134" height="40" rx="3" fill="#020610" stroke="rgba(0,240,255,0.25)"/>
                    <line x1="8" y1="24" x2="142" y2="24" stroke="rgba(0,240,255,0.2)" stroke-dasharray="2 3"/>
                    <line x1="75" y1="4" x2="75" y2="44" stroke="rgba(0,240,255,0.2)" stroke-dasharray="2 3"/>
                    <line x1="42" y1="4" x2="42" y2="44" stroke="rgba(0,240,255,0.08)"/>
                    <line x1="108" y1="4" x2="108" y2="44" stroke="rgba(0,240,255,0.08)"/>
                    <path d="M 12 24 Q 28 8 44 24 T 76 24 T 108 24 T 138 24" fill="none" stroke="#00f0ff" stroke-width="2" stroke-linecap="round"/>
                    <text x="12" y="14" fill="#00f0ff" font-size="7" font-family="monospace">CH1: s(t)</text>
                    <text x="104" y="14" fill="rgba(0,240,255,0.8)" font-size="7" font-family="monospace">2.0 ms</text>
                  </svg>
                  <span class="dock-preview-socket" style="left: -4px; top: 50%; transform: translateY(-50%); --socket-color: #00f0ff;" title="ВХОД CH1"></span>
                </div>
              </div>
              <div class="dock-card-footer">
                <span class="dock-card-drag-handle">⠿</span>
                <div class="dock-card-body">
                  <span class="dock-card-name">Осциллограф</span>
                  <span class="dock-card-desc">Временной график s(t)</span>
                </div>
              </div>
            </div>

            <!-- 6. Spectrograph -->
            <div class="dock-card" draggable="true" data-type="spectrograph" title="Перетащите блок на схему">
              <div class="dock-card-preview" style="--preview-border: #a855f7; --preview-glow: rgba(168,85,247,0.25);">
                <div class="dock-preview-header">
                  <span class="dock-preview-title">Спектрограф</span>
                  <span class="dock-preview-badge" style="color: #a855f7;">FFT</span>
                </div>
                <div class="dock-preview-screen">
                  <svg viewBox="0 0 150 48" class="dock-preview-svg">
                    <rect x="8" y="4" width="134" height="40" rx="3" fill="#06020f" stroke="rgba(168,85,247,0.25)"/>
                    <line x1="8" y1="36" x2="142" y2="36" stroke="rgba(168,85,247,0.25)"/>
                    <line x1="55" y1="36" x2="55" y2="20" stroke="#3b82f6" stroke-width="2"/>
                    <circle cx="55" cy="20" r="2.5" fill="#3b82f6"/>
                    <line x1="75" y1="36" x2="75" y2="10" stroke="#a855f7" stroke-width="2.5"/>
                    <circle cx="75" cy="10" r="3" fill="#ffffff"/>
                    <text x="75" y="7" fill="#c084fc" font-size="6.5" font-family="monospace" text-anchor="middle">Fc</text>
                    <line x1="95" y1="36" x2="95" y2="20" stroke="#10b981" stroke-width="2"/>
                    <circle cx="95" cy="20" r="2.5" fill="#10b981"/>
                    <text x="12" y="14" fill="#a855f7" font-size="7" font-family="monospace">FFT</text>
                    <text x="96" y="42" fill="rgba(168,85,247,0.8)" font-size="6.5" font-family="monospace">0..40 кГц</text>
                  </svg>
                  <span class="dock-preview-socket" style="left: -4px; top: 33%; transform: translateY(-50%); --socket-color: #a855f7;" title="ВХОД CH1"></span>
                  <span class="dock-preview-socket" style="left: -4px; top: 67%; transform: translateY(-50%); --socket-color: #00f0ff;" title="ВХОД CH2"></span>
                </div>
              </div>
              <div class="dock-card-footer">
                <span class="dock-card-drag-handle">⠿</span>
                <div class="dock-card-body">
                  <span class="dock-card-name">Спектрограф</span>
                  <span class="dock-card-desc">Частотный спектр FFT</span>
                </div>
              </div>
            </div>

            <!-- 7. Receiver -->
            <div class="dock-card" draggable="true" data-type="receiver" title="Перетащите блок на схему">
              <div class="dock-card-preview" style="--preview-border: #f59e0b; --preview-glow: rgba(245,158,11,0.25);">
                <div class="dock-preview-header">
                  <span class="dock-preview-title">Приемник / Детектор</span>
                  <span class="dock-preview-badge" style="color: #f59e0b;">RX</span>
                </div>
                <div class="dock-preview-screen">
                  <svg viewBox="0 0 150 48" class="dock-preview-svg">
                    <line x1="8" y1="24" x2="28" y2="24" stroke="#f59e0b" stroke-width="1.8"/>
                    <polygon points="28,16 28,32 40,24" fill="#f59e0b"/>
                    <line x1="40" y1="15" x2="40" y2="33" stroke="#f59e0b" stroke-width="2"/>
                    <line x1="40" y1="24" x2="58" y2="24" stroke="#f59e0b" stroke-width="1.8"/>
                    <rect x="58" y="15" width="22" height="18" rx="2" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" stroke-width="1.2"/>
                    <text x="69" y="27" fill="#f59e0b" font-size="7" font-family="monospace" text-anchor="middle">RC</text>
                    <line x1="80" y1="24" x2="98" y2="24" stroke="#f59e0b" stroke-width="1.8"/>
                    <path d="M 98 19 L 105 19 L 114 13 L 114 35 L 105 29 L 98 29 Z" fill="#f59e0b"/>
                    <path d="M 118 19 Q 122 24 118 29 M 122 15 Q 128 24 122 33" fill="none" stroke="#f59e0b" stroke-width="1.4" stroke-linecap="round"/>
                    <circle cx="14" cy="11" r="2.5" fill="#10b981"/>
                    <text x="20" y="13" fill="#10b981" font-size="6.5" font-family="monospace">ACTIVE</text>
                  </svg>
                  <span class="dock-preview-socket" style="left: -4px; top: 50%; transform: translateY(-50%); --socket-color: #f59e0b;" title="ВХОД RF"></span>
                </div>
              </div>
              <div class="dock-card-footer">
                <span class="dock-card-drag-handle">⠿</span>
                <div class="dock-card-body">
                  <span class="dock-card-name">Приемник / Детектор</span>
                  <span class="dock-card-desc">Демодуляция и звук</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- High-Resolution Detailed Instrument Modal Dialog -->
        <div class="instrument-modal-backdrop" id="wb-instrument-modal" style="display: none;">
          <div class="instrument-modal-dialog">
            <div class="instrument-modal-header">
              <div class="modal-header-left">
                <span class="modal-instrument-badge" id="modal-inst-badge">OSC</span>
                <span class="modal-instrument-title" id="modal-inst-title">Осциллограф CH1: s(t)</span>
                <span style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono);" id="modal-inst-source">Вход: —</span>
              </div>
              <div class="modal-header-right">
                <button class="btn-instrument-freeze" id="btn-modal-freeze" title="Заморозить кадр (стоп-кадр)">⏸ Стоп-кадр</button>
                <button class="btn-instrument-modal-close" id="btn-modal-close" title="Закрыть окно (Esc)">×</button>
              </div>
            </div>
            <div class="instrument-modal-screen-wrapper">
              <canvas id="modal-instrument-canvas" width="860" height="380"></canvas>
            </div>
            <div class="instrument-modal-footer" id="modal-instrument-footer"></div>
          </div>
        </div>

        <!-- Right-Click Context Menu for Wires and Sockets -->
        <div class="workbench-context-menu" id="wb-context-menu" style="display: none;"></div>
      </div>
    `;

    this.viewportEl = this.container.querySelector('#wb-viewport');
    this.surfaceEl = this.container.querySelector('#wb-canvas-surface');
    this.nodesContainerEl = this.container.querySelector('#wb-nodes-container');
    this.wiresSvgEl = this.container.querySelector('#wb-wires-svg');
  }

  updateEmptyState() {
    let emptyEl = this.viewportEl.querySelector('#wb-empty-prompt');
    if (this.graph.nodes.size === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.id = 'wb-empty-prompt';
        emptyEl.className = 'workbench-empty-prompt';
        emptyEl.innerHTML = `
          <div class="empty-prompt-icon">⚡</div>
          <div class="empty-prompt-title">Рабочий холст пуст</div>
          <div class="empty-prompt-desc">
            Перетащите блоки из панели снизу на холст (Drag & Drop) или выберите типовую схему для исследования:
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; margin-top: 1rem;">
            <button class="btn-primary btn-prompt-preset" data-preset="am" style="padding: 0.45rem 0.85rem; font-size: 0.78rem;">⚡ АМ (DSB)</button>
            <button class="btn-primary btn-prompt-preset" data-preset="ask" style="padding: 0.45rem 0.85rem; font-size: 0.78rem;">⚡ АМн (ASK)</button>
            <button class="btn-primary btn-prompt-preset" data-preset="fsk" style="padding: 0.45rem 0.85rem; font-size: 0.78rem;">⚡ ЧМн (FSK)</button>
            <button class="btn-primary btn-prompt-preset" data-preset="psk" style="padding: 0.45rem 0.85rem; font-size: 0.78rem;">⚡ ФМн (PSK)</button>
          </div>
        `;
        this.viewportEl.appendChild(emptyEl);
        emptyEl.querySelectorAll('.btn-prompt-preset').forEach(b => {
          b.addEventListener('click', () => {
            this.loadPreset(b.dataset.preset);
          });
        });
      }
    } else {
      if (emptyEl) emptyEl.remove();
    }
  }

  setupInitialPreset() {
    this.loadPreset('am');
  }

  // Universal preset loader for all modulation and keying modes
  loadPreset(presetType = 'am') {
    this.graph.clear();
    this.nodesContainerEl.innerHTML = '';

    if (presetType === 'am') {
      const s1 = this.createNode('source', 30, 40, { fm: 1000, am: 1.0, sourceType: 'audio_single' });
      const o1 = this.createNode('oscillator', 30, 290, { fc: 20000, ac: 2.0 });
      const m1 = this.createNode('modulator', 360, 160, { mode: 'dsb-fc', modIndex: 0.8 });
      const f1 = this.createNode('filter', 680, 160, { filterBandwidth: 6000, noise: 0 });
      const osc1 = this.createNode('oscilloscope', 1010, 30);
      const spec1 = this.createNode('spectrograph', 1010, 280);

      this.graph.connect(s1.id, 'out', m1.id, 'mod-in-audio', '#00f0ff');
      this.graph.connect(o1.id, 'out', m1.id, 'mod-in-carrier', '#a855f7');
      this.graph.connect(m1.id, 'rf-out', f1.id, 'filter-in', '#00f0ff');
      this.graph.connect(m1.id, 'rf-out', osc1.id, 'in', '#00f0ff');
      this.graph.connect(f1.id, 'filter-out', spec1.id, 'in', '#10b981');
    } else if (presetType === 'ssb') {
      const s1 = this.createNode('source', 30, 40, { fm: 1200, am: 1.0, sourceType: 'audio_single' });
      const o1 = this.createNode('oscillator', 30, 290, { fc: 20000, ac: 2.0 });
      const m1 = this.createNode('modulator', 360, 160, { mode: 'ssb-usb' });
      const f1 = this.createNode('filter', 680, 160, { filterBandwidth: 3000, noise: 0 });
      const osc1 = this.createNode('oscilloscope', 1010, 30);
      const spec1 = this.createNode('spectrograph', 1010, 280);

      this.graph.connect(s1.id, 'out', m1.id, 'mod-in-audio', '#00f0ff');
      this.graph.connect(o1.id, 'out', m1.id, 'mod-in-carrier', '#a855f7');
      this.graph.connect(m1.id, 'rf-out', f1.id, 'filter-in', '#00f0ff');
      this.graph.connect(m1.id, 'rf-out', osc1.id, 'in', '#00f0ff');
      this.graph.connect(f1.id, 'filter-out', spec1.id, 'in', '#10b981');
    } else if (presetType === 'ask') {
      // Amplitude Shift Keying (АМн)
      const s1 = this.createNode('source', 30, 40, { sourceType: 'digital_bits', bitPattern: '10110010', bitRate: 800, am: 1.0 });
      const o1 = this.createNode('oscillator', 30, 310, { fc: 20000, ac: 2.0 });
      const m1 = this.createNode('modulator', 360, 160, { mode: 'ask', askLowRatio: 0.05 });
      const f1 = this.createNode('filter', 680, 160, { filterBandwidth: 10000, noise: 0 });
      const osc1 = this.createNode('oscilloscope', 1010, 30);
      const spec1 = this.createNode('spectrograph', 1010, 280);
      const rec1 = this.createNode('receiver', 680, 410);

      this.graph.connect(s1.id, 'out', m1.id, 'mod-in-audio', '#00f0ff');
      this.graph.connect(o1.id, 'out', m1.id, 'mod-in-carrier', '#a855f7');
      this.graph.connect(m1.id, 'rf-out', f1.id, 'filter-in', '#00f0ff');
      this.graph.connect(m1.id, 'rf-out', osc1.id, 'in', '#00f0ff');
      this.graph.connect(f1.id, 'filter-out', spec1.id, 'in', '#10b981');
      this.graph.connect(f1.id, 'filter-out', rec1.id, 'in', '#10b981');
    } else if (presetType === 'fsk') {
      // Frequency Shift Keying (ЧМн)
      const s1 = this.createNode('source', 30, 40, { sourceType: 'digital_bits', bitPattern: '10110010', bitRate: 800, am: 1.0 });
      const o1 = this.createNode('oscillator', 30, 310, { fc: 20000, ac: 2.0 });
      const m1 = this.createNode('modulator', 360, 160, { mode: 'fsk', fskDeltaF: 3500 });
      const f1 = this.createNode('filter', 680, 160, { filterBandwidth: 14000, noise: 0 });
      const osc1 = this.createNode('oscilloscope', 1010, 30);
      const spec1 = this.createNode('spectrograph', 1010, 280);
      const rec1 = this.createNode('receiver', 680, 410);

      this.graph.connect(s1.id, 'out', m1.id, 'mod-in-audio', '#00f0ff');
      this.graph.connect(o1.id, 'out', m1.id, 'mod-in-carrier', '#a855f7');
      this.graph.connect(m1.id, 'rf-out', f1.id, 'filter-in', '#00f0ff');
      this.graph.connect(m1.id, 'rf-out', osc1.id, 'in', '#00f0ff');
      this.graph.connect(f1.id, 'filter-out', spec1.id, 'in', '#10b981');
      this.graph.connect(f1.id, 'filter-out', rec1.id, 'in', '#10b981');
    } else if (presetType === 'psk') {
      // Phase Shift Keying (ФМн / BPSK)
      const s1 = this.createNode('source', 30, 40, { sourceType: 'digital_bits', bitPattern: '10110010', bitRate: 800, am: 1.0 });
      const o1 = this.createNode('oscillator', 30, 310, { fc: 20000, ac: 2.0 });
      const m1 = this.createNode('modulator', 360, 160, { mode: 'psk' });
      const f1 = this.createNode('filter', 680, 160, { filterBandwidth: 10000, noise: 0 });
      const osc1 = this.createNode('oscilloscope', 1010, 30);
      const spec1 = this.createNode('spectrograph', 1010, 280);
      const rec1 = this.createNode('receiver', 680, 410);

      this.graph.connect(s1.id, 'out', m1.id, 'mod-in-audio', '#00f0ff');
      this.graph.connect(o1.id, 'out', m1.id, 'mod-in-carrier', '#a855f7');
      this.graph.connect(m1.id, 'rf-out', f1.id, 'filter-in', '#00f0ff');
      this.graph.connect(m1.id, 'rf-out', osc1.id, 'in', '#00f0ff');
      this.graph.connect(f1.id, 'filter-out', spec1.id, 'in', '#10b981');
      this.graph.connect(f1.id, 'filter-out', rec1.id, 'in', '#10b981');
    }

    const sel = this.container.querySelector('#wb-preset-select');
    if (sel) sel.value = presetType;

    this.renderAllNodes();
    this.updateTransform();
    this.updateWires();
    this.updateEmptyState();
  }

  // Add node of a given type
  createNode(type, x, y, customParams = {}) {
    const id = `node-${type}-${this.nodeCounter++}`;
    const defaultParams = {
      source: { fm: 1000, am: 1.0, sourceType: 'audio_single', bitPattern: '10110010', bitRate: 800 },
      oscillator: { fc: 20000, ac: 2.0 },
      modulator: { mode: 'dsb-fc', modIndex: 0.8, askLowRatio: 0.05, fskDeltaF: 3000 },
      filter: { filterBandwidth: 6000, noise: 0 },
      oscilloscope: { scaleV: 4.0, timeDiv: 2 },
      spectrograph: { maxFreq: 40000 },
      receiver: {}
    };

    const node = {
      id,
      type,
      x: x !== undefined ? x : 150 + Math.random() * 200,
      y: y !== undefined ? y : 100 + Math.random() * 150,
      params: { ...(defaultParams[type] || {}), ...customParams }
    };

    this.graph.addNode(node);
    this.updateEmptyState();
    return node;
  }

  renderAllNodes() {
    this.nodesContainerEl.innerHTML = '';
    for (const node of this.graph.nodes.values()) {
      this.renderNodeElement(node);
    }
  }

  renderNodeElement(node) {
    const el = document.createElement('div');
    el.id = node.id;
    el.className = `circuit-node node-type-${node.type}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;

    let bodyHtml = '';
    let headerTitle = '';
    let badgeLabel = '';
    let badgeColor = '#00f0ff';

    switch (node.type) {
      case 'source':
        headerTitle = `${icons.waveform} Источник сообщения`;
        badgeLabel = node.params.sourceType === 'digital_bits' ? 'DIGITAL' : 'НЧ';
        badgeColor = '#00f0ff';
        bodyHtml = `
          <div class="node-control-row">
            <label class="node-control-label">Сигнал:</label>
            <select class="node-select param-input" data-param="sourceType">
              <option value="audio_single" ${node.params.sourceType === 'audio_single' ? 'selected' : ''}>Тон (1.0 кГц)</option>
              <option value="audio_dual" ${node.params.sourceType === 'audio_dual' ? 'selected' : ''}>Речь (2 тона)</option>
              <option value="video_step" ${node.params.sourceType === 'video_step' ? 'selected' : ''}>Видеосигнал (Пила)</option>
              <option value="digital_bits" ${node.params.sourceType === 'digital_bits' ? 'selected' : ''}>Цифровой поток (Биты)</option>
            </select>
          </div>
          <div class="node-control-row" id="row-source-fm-${node.id}" style="${node.params.sourceType === 'digital_bits' ? 'display:none;' : ''}">
            <div class="node-control-label">
              <span>Частота Fm:</span>
              <span class="node-control-val disp-param-fm">${node.params.fm || 1000} Гц</span>
            </div>
            <input type="range" class="node-slider param-input" data-param="fm" min="500" max="3000" step="100" value="${node.params.fm || 1000}" />
          </div>
          <div class="node-control-row" id="row-source-bits-${node.id}" style="${node.params.sourceType === 'digital_bits' ? '' : 'display:none;'}">
            <div class="node-control-label">
              <span>Биты (0/1):</span>
            </div>
            <input type="text" class="node-select param-input" data-param="bitPattern" maxlength="16" value="${node.params.bitPattern || '10110010'}" style="font-family: var(--font-mono); letter-spacing: 2px; color: #00f0ff; text-align: center; width: 100%;" />
          </div>
          <div class="node-control-row" id="row-source-bitrate-${node.id}" style="${node.params.sourceType === 'digital_bits' ? '' : 'display:none;'}">
            <div class="node-control-label">
              <span>Скорость Rb:</span>
              <span class="node-control-val disp-param-bitRate">${node.params.bitRate || 800} бит/с</span>
            </div>
            <input type="range" class="node-slider param-input" data-param="bitRate" min="200" max="2400" step="100" value="${node.params.bitRate || 800}" />
          </div>
          <div class="port-socket socket-out" data-node="${node.id}" data-port="out" data-type="out" data-signal="audio" style="--socket-color: #00f0ff; top: 50%;">
            <span class="port-label-tag">ВЫХОД ДАННЫХ</span>
          </div>
        `;
        break;

      case 'oscillator':
        headerTitle = `${icons.router} Несущая`;
        badgeLabel = 'ВЧ';
        badgeColor = '#a855f7';
        bodyHtml = `
          <div class="node-control-row">
            <div class="node-control-label">
              <span>Частота Fc:</span>
              <span class="node-control-val disp-param-fc">${(node.params.fc / 1000).toFixed(1)} кГц</span>
            </div>
            <input type="range" class="node-slider param-input" data-param="fc" min="15000" max="25000" step="500" value="${node.params.fc}" />
          </div>
          <div class="node-control-row">
            <div class="node-control-label">
              <span>Амплитуда Ac:</span>
              <span class="node-control-val disp-param-ac">${node.params.ac.toFixed(1)} В</span>
            </div>
            <input type="range" class="node-slider param-input" data-param="ac" min="1.0" max="4.0" step="0.5" value="${node.params.ac}" />
          </div>
          <div class="port-socket socket-out" data-node="${node.id}" data-port="out" data-type="out" data-signal="carrier" style="--socket-color: #a855f7; top: 50%;">
            <span class="port-label-tag">ВЫХОД ВЧ</span>
          </div>
        `;
        break;

      case 'modulator':
        headerTitle = `${icons.terminal} Модулятор / Манипулятор`;
        const modeBadgeMap = {
          'dsb-fc': { label: 'AM', color: '#00f0ff' },
          'dsb-sc': { label: 'DSB', color: '#38bdf8' },
          'ssb-usb': { label: 'USB', color: '#10b981' },
          'ssb-lsb': { label: 'LSB', color: '#3b82f6' },
          'ask': { label: 'ASK', color: '#00f0ff' },
          'fsk': { label: 'FSK', color: '#10b981' },
          'psk': { label: 'PSK', color: '#c084fc' }
        };
        const curBadge = modeBadgeMap[node.params.mode] || { label: 'MOD', color: '#00f0ff' };
        badgeLabel = curBadge.label;
        badgeColor = curBadge.color;

        bodyHtml = `
          <div class="node-control-row">
            <label class="node-control-label">Режим:</label>
            <select class="node-select param-input" data-param="mode">
              <optgroup label="Аналоговая модуляция">
                <option value="dsb-fc" ${node.params.mode === 'dsb-fc' ? 'selected' : ''}>DSB-FC (AM с несущей)</option>
                <option value="dsb-sc" ${node.params.mode === 'dsb-sc' ? 'selected' : ''}>DSB-SC (Балансная)</option>
                <option value="ssb-usb" ${node.params.mode === 'ssb-usb' ? 'selected' : ''}>SSB-USB (Верхняя)</option>
                <option value="ssb-lsb" ${node.params.mode === 'ssb-lsb' ? 'selected' : ''}>SSB-LSB (Нижняя)</option>
              </optgroup>
              <optgroup label="Дискретная манипуляция">
                <option value="ask" ${node.params.mode === 'ask' ? 'selected' : ''}>АМн / ASK (Амплитудная)</option>
                <option value="fsk" ${node.params.mode === 'fsk' ? 'selected' : ''}>ЧМн / FSK (Частотная)</option>
                <option value="psk" ${node.params.mode === 'psk' ? 'selected' : ''}>ФМн / PSK (Фазовая BPSK)</option>
              </optgroup>
            </select>
          </div>
          <div class="node-control-row" id="row-mod-index-${node.id}" style="${node.params.mode === 'dsb-fc' ? '' : 'display:none;'}">
            <div class="node-control-label">
              <span>Глубина m:</span>
              <span class="node-control-val disp-param-modIndex">${(node.params.modIndex || 0.8).toFixed(2)}</span>
            </div>
            <input type="range" class="node-slider param-input" data-param="modIndex" min="0.1" max="1.4" step="0.05" value="${node.params.modIndex || 0.8}" />
          </div>
          <div class="node-control-row" id="row-ask-ratio-${node.id}" style="${node.params.mode === 'ask' ? '' : 'display:none;'}">
            <div class="node-control-label">
              <span>Уровень 0 (OOK):</span>
              <span class="node-control-val disp-param-askLowRatio">${Math.round((node.params.askLowRatio !== undefined ? node.params.askLowRatio : 0.05) * 100)}%</span>
            </div>
            <input type="range" class="node-slider param-input" data-param="askLowRatio" min="0" max="0.4" step="0.05" value="${node.params.askLowRatio !== undefined ? node.params.askLowRatio : 0.05}" />
          </div>
          <div class="node-control-row" id="row-fsk-delta-${node.id}" style="${node.params.mode === 'fsk' ? '' : 'display:none;'}">
            <div class="node-control-label">
              <span>Девиация ΔF:</span>
              <span class="node-control-val disp-param-fskDeltaF">${(((node.params.fskDeltaF || 3000)) / 1000).toFixed(1)} кГц</span>
            </div>
            <input type="range" class="node-slider param-input" data-param="fskDeltaF" min="1000" max="6000" step="500" value="${node.params.fskDeltaF || 3000}" />
          </div>
          <div class="node-control-row" id="row-psk-info-${node.id}" style="${node.params.mode === 'psk' ? '' : 'display:none;'}">
            <div style="font-size: 0.72rem; color: #c084fc; line-height: 1.4; background: rgba(168, 85, 247, 0.1); padding: 0.3rem 0.5rem; border-radius: 4px; width: 100%;">
              Скачок фазы: <strong>180° (π)</strong> при смене бит 0 ⇄ 1
            </div>
          </div>
          <div class="port-socket socket-in" data-node="${node.id}" data-port="mod-in-audio" data-type="in" data-accepts="audio" style="--socket-color: #00f0ff; top: 32%;">
            <span class="port-label-tag">ВХОД ДАННЫЕ</span>
          </div>
          <div class="port-socket socket-in" data-node="${node.id}" data-port="mod-in-carrier" data-type="in" data-accepts="carrier" style="--socket-color: #a855f7; top: 72%;">
            <span class="port-label-tag">ВХОД ВЧ</span>
          </div>
          <div class="port-socket socket-out" data-node="${node.id}" data-port="rf-out" data-type="out" data-signal="rf" style="--socket-color: #00f0ff; top: 50%;">
            <span class="port-label-tag">ВЫХОД ВЧ</span>
          </div>
        `;
        break;

      case 'filter':
        headerTitle = `${icons.target} Полосовой фильтр`;
        badgeLabel = 'BPF';
        badgeColor = '#10b981';
        bodyHtml = `
          <div class="node-control-row">
            <div class="node-control-label">
              <span>Полоса ΔF:</span>
              <span class="node-control-val disp-param-filterBandwidth">${(node.params.filterBandwidth / 1000).toFixed(1)} кГц</span>
            </div>
            <input type="range" class="node-slider param-input" data-param="filterBandwidth" min="1000" max="18000" step="500" value="${node.params.filterBandwidth}" />
          </div>
          <div class="node-control-row">
            <div class="node-control-label">
              <span>Шум канала:</span>
              <span class="node-control-val disp-param-noise">${node.params.noise}%</span>
            </div>
            <input type="range" class="node-slider param-input" data-param="noise" min="0" max="40" step="5" value="${node.params.noise}" />
          </div>
          <div class="port-socket socket-in" data-node="${node.id}" data-port="filter-in" data-type="in" data-accepts="rf,rf-filtered,audio,carrier" style="--socket-color: #00f0ff; top: 50%;">
            <span class="port-label-tag">ВХОД</span>
          </div>
          <div class="port-socket socket-out" data-node="${node.id}" data-port="filter-out" data-type="out" data-signal="rf-filtered" style="--socket-color: #10b981; top: 50%;">
            <span class="port-label-tag">ВЫХОД</span>
          </div>
        `;
        break;

      case 'oscilloscope':
        headerTitle = `${icons.waveform} Осциллограф`;
        badgeLabel = 'OSC';
        badgeColor = '#00f0ff';
        el.style.width = '280px';
        bodyHtml = `
          <div style="background: #040810; border-radius: var(--radius-sm); border: 1px solid rgba(0, 240, 255, 0.2); overflow: hidden; margin-bottom: 0.5rem;">
            <canvas class="instrument-node-canvas" id="canvas-${node.id}" width="260" height="130" style="width: 100%; height: 130px; display: block;"></canvas>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.35rem;">
            <span>ВХОД CH1: s(t)</span>
            <span style="color: var(--accent-cyan); font-family: var(--font-mono);" id="osc-time-label-${node.id}">${(node.params.timeDiv || 2).toFixed(1)} ms</span>
          </div>
          <div style="display: flex; gap: 0.25rem; justify-content: flex-end; align-items: center;">
            <span style="font-size: 0.65rem; color: var(--text-muted); margin-right: 0.2rem;">Развертка:</span>
            <button class="node-time-btn ${node.params.timeDiv === 1 ? 'active' : ''}" data-t="1" style="font-size: 0.68rem; padding: 0.15rem 0.4rem; background: rgba(0,240,255,0.08); border: 1px solid rgba(0,240,255,0.25); color: #00f0ff; border-radius: 3px; cursor: pointer;">1ms</button>
            <button class="node-time-btn ${(!node.params.timeDiv || node.params.timeDiv === 2) ? 'active' : ''}" data-t="2" style="font-size: 0.68rem; padding: 0.15rem 0.4rem; background: rgba(0,240,255,0.08); border: 1px solid rgba(0,240,255,0.25); color: #00f0ff; border-radius: 3px; cursor: pointer;">2ms</button>
            <button class="node-time-btn ${node.params.timeDiv === 4 ? 'active' : ''}" data-t="4" style="font-size: 0.68rem; padding: 0.15rem 0.4rem; background: rgba(0,240,255,0.08); border: 1px solid rgba(0,240,255,0.25); color: #00f0ff; border-radius: 3px; cursor: pointer;">4ms</button>
          </div>
          <div class="port-socket socket-in" data-node="${node.id}" data-port="in" data-type="in" data-accepts="audio,carrier,rf,rf-filtered" style="--socket-color: #00f0ff; top: 35%;">
            <span class="port-label-tag">ВХОД CH1</span>
          </div>
        `;
        break;

      case 'spectrograph':
        headerTitle = `${icons.terminal} Спектрограф`;
        badgeLabel = 'FFT';
        badgeColor = '#a855f7';
        el.style.width = '290px';
        bodyHtml = `
          <div style="background: #040810; border-radius: var(--radius-sm); border: 1px solid rgba(168, 85, 247, 0.2); overflow: hidden; margin-bottom: 0.5rem;">
            <canvas class="instrument-node-canvas" id="canvas-${node.id}" width="270" height="130" style="width: 100%; height: 130px; display: block;"></canvas>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--text-muted);">
            <span>Диапазон: 0 .. 40 кГц</span>
            <span style="color: #a855f7; font-family: var(--font-mono);">CH1+CH2 FFT</span>
          </div>
          <div class="port-socket socket-in" data-node="${node.id}" data-port="in" data-type="in" data-accepts="audio,carrier,rf,rf-filtered" style="--socket-color: #a855f7; top: 32%;">
            <span class="port-label-tag">ВХОД CH1</span>
          </div>
          <div class="port-socket socket-in" data-node="${node.id}" data-port="in-2" data-type="in" data-accepts="audio,carrier,rf,rf-filtered" style="--socket-color: #00f0ff; top: 68%;">
            <span class="port-label-tag">ВХОД CH2</span>
          </div>
        `;
        break;

      case 'receiver':
        headerTitle = `${icons.server} Приемник / Детектор`;
        badgeLabel = 'RX';
        badgeColor = '#f59e0b';
        bodyHtml = `
          <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.4rem;">
            Детектор сигналов (Огибающая / ЧД / Синхронный BPSK).
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; background: rgba(0,0,0,0.3); padding: 0.35rem 0.5rem; border-radius: 4px; margin-bottom: 0.4rem;">
            <span style="color: var(--text-muted);">Статус тракта:</span>
            <span style="color: #10b981; font-weight: 600;">● Активен</span>
          </div>
          <div class="port-socket socket-in" data-node="${node.id}" data-port="in" data-type="in" data-accepts="rf,rf-filtered,audio" style="--socket-color: #10b981; top: 50%;">
            <span class="port-label-tag">ВХОД RF</span>
          </div>
        `;
        break;

      default:
        break;
    }

    el.innerHTML = `
      <div class="circuit-node-header">
        <div class="node-title">${headerTitle}</div>
        <div style="display: flex; align-items: center; gap: 0.35rem;">
          ${(node.type === 'oscilloscope' || node.type === 'spectrograph') ? `
            <button class="node-btn-expand" data-node-expand="${node.id}" title="Развернуть во всплывающем окне (подробный анализ)">⛶</button>
          ` : ''}
          <span class="node-badge" style="color: ${badgeColor};">${badgeLabel}</span>
          <button class="node-btn-delete" title="Удалить блок" data-node-delete="${node.id}">×</button>
        </div>
      </div>
      <div class="circuit-node-body">
        ${bodyHtml}
      </div>
    `;

    // Bind parameters change
    el.querySelectorAll('.param-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const paramName = e.target.dataset.param;
        let val = e.target.value;
        if (inp.type === 'range') {
          val = parseFloat(val);
        }
        node.params[paramName] = val;

        // Update display labels if any
        const disp = el.querySelector(`.disp-param-${paramName}`);
        if (disp) {
          if (paramName === 'fc' || paramName === 'filterBandwidth' || paramName === 'fskDeltaF') {
            disp.textContent = `${(val / 1000).toFixed(1)} кГц`;
          } else if (paramName === 'fm') {
            disp.textContent = `${val} Гц`;
          } else if (paramName === 'bitRate') {
            disp.textContent = `${val} бит/с`;
          } else if (paramName === 'askLowRatio') {
            disp.textContent = `${Math.round(val * 100)}%`;
          } else if (paramName === 'ac') {
            disp.textContent = `${val.toFixed(1)} В`;
          } else if (paramName === 'noise') {
            disp.textContent = `${val}%`;
          } else {
            disp.textContent = val;
          }
        }

        // Toggle source rows
        if (paramName === 'sourceType') {
          const isBits = val === 'digital_bits';
          const fmRow = el.querySelector(`#row-source-fm-${node.id}`);
          const bitsRow = el.querySelector(`#row-source-bits-${node.id}`);
          const bitRateRow = el.querySelector(`#row-source-bitrate-${node.id}`);
          const badgeEl = el.querySelector('.node-badge');
          if (fmRow) fmRow.style.display = isBits ? 'none' : 'flex';
          if (bitsRow) bitsRow.style.display = isBits ? 'flex' : 'none';
          if (bitRateRow) bitRateRow.style.display = isBits ? 'flex' : 'none';
          if (badgeEl) badgeEl.textContent = isBits ? 'DIGITAL' : 'НЧ';
        }

        // Toggle modulation rows
        if (paramName === 'mode') {
          const modRow = el.querySelector(`#row-mod-index-${node.id}`);
          const askRow = el.querySelector(`#row-ask-ratio-${node.id}`);
          const fskRow = el.querySelector(`#row-fsk-delta-${node.id}`);
          const pskRow = el.querySelector(`#row-psk-info-${node.id}`);
          const badgeEl = el.querySelector('.node-badge');

          if (modRow) modRow.style.display = val === 'dsb-fc' ? 'flex' : 'none';
          if (askRow) askRow.style.display = val === 'ask' ? 'flex' : 'none';
          if (fskRow) fskRow.style.display = val === 'fsk' ? 'flex' : 'none';
          if (pskRow) pskRow.style.display = val === 'psk' ? 'flex' : 'none';

          const map = {
            'dsb-fc': { label: 'AM', color: '#00f0ff' },
            'dsb-sc': { label: 'DSB', color: '#38bdf8' },
            'ssb-usb': { label: 'USB', color: '#10b981' },
            'ssb-lsb': { label: 'LSB', color: '#3b82f6' },
            'ask': { label: 'ASK', color: '#00f0ff' },
            'fsk': { label: 'FSK', color: '#10b981' },
            'psk': { label: 'PSK', color: '#c084fc' }
          };
          if (badgeEl && map[val]) {
            badgeEl.textContent = map[val].label;
            badgeEl.style.color = map[val].color;
          }
        }

        this.graph.notify();
      });
    });

    // Timebase buttons on Oscilloscope
    el.querySelectorAll('.node-time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = parseFloat(btn.dataset.t);
        node.params.timeDiv = t;
        el.querySelectorAll('.node-time-btn').forEach(b => {
          b.style.background = 'rgba(0,240,255,0.08)';
          b.style.color = '#00f0ff';
        });
        btn.style.background = 'rgba(0,240,255,0.3)';
        btn.style.color = '#ffffff';
        const lbl = el.querySelector(`#osc-time-label-${node.id}`);
        if (lbl) lbl.textContent = `${t.toFixed(1)} ms`;
      });
    });

    // Delete node button
    el.querySelector('[data-node-delete]').addEventListener('click', (e) => {
      e.stopPropagation();
      this.graph.removeNode(node.id);
      el.remove();
      this.updateWires();
    });

    // Expand instrument to modal popup
    const expandBtn = el.querySelector('[data-node-expand]');
    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openInstrumentModal(node.id);
      });
    }

    // Direct click on oscilloscope / spectrograph canvas opens detailed modal
    const nodeCanvas = el.querySelector(`#canvas-${node.id}`);
    if (nodeCanvas) {
      nodeCanvas.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openInstrumentModal(node.id);
      });
    }

    // Drag block on canvas
    this.setupNodeDrag(el, node);

    this.nodesContainerEl.appendChild(el);
  }

  setupNodeDrag(el, node) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    el.addEventListener('mousedown', (e) => {
      // Don't drag if interacting with inputs, buttons or sockets
      if (e.target.closest('input') || e.target.closest('select') || e.target.closest('button') || e.target.closest('.port-socket') || e.target.closest('canvas')) {
        return;
      }
      e.stopPropagation();

      isDragging = true;
      el.classList.add('dragging');

      startX = e.clientX;
      startY = e.clientY;
      initialLeft = node.x;
      initialTop = node.y;

      const onMouseMove = (moveEvt) => {
        if (!isDragging) return;
        const dx = (moveEvt.clientX - startX) / this.zoom;
        const dy = (moveEvt.clientY - startY) / this.zoom;

        node.x = initialLeft + dx;
        node.y = initialTop + dy;

        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;

        this.updateWires();
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        el.classList.remove('dragging');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  bindEvents() {
    // 1. Drag-and-Drop from Bottom Dock to Canvas
    const dockCards = this.container.querySelectorAll('.dock-card');
    this.draggedBlockType = null;

    dockCards.forEach(card => {
      // Native HTML5 DragStart
      card.addEventListener('dragstart', (e) => {
        const type = card.dataset.type;
        this.draggedBlockType = type;
        e.dataTransfer.setData('text/plain', type);
        e.dataTransfer.effectAllowed = 'copy';
        card.classList.add('is-dragging');
      });

      // DragEnd
      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        this.draggedBlockType = null;
        this.viewportEl.classList.remove('drag-over');
      });

      // Click fallback: click to add directly to center of visible canvas
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        const vpRect = this.viewportEl.getBoundingClientRect();
        const centerX = (vpRect.width / 2 - this.panX) / this.zoom - 100 + (Math.random() - 0.5) * 50;
        const centerY = (vpRect.height / 2 - this.panY) / this.zoom - 50 + (Math.random() - 0.5) * 50;
        const node = this.createNode(type, Math.max(20, centerX), Math.max(20, centerY));
        this.renderNodeElement(node);
        this.updateWires();
      });
    });

    // Viewport Drag & Drop Target Handlers
    this.viewportEl.addEventListener('dragenter', (e) => {
      e.preventDefault();
      this.viewportEl.classList.add('drag-over');
    });

    this.viewportEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!this.viewportEl.classList.contains('drag-over')) {
        this.viewportEl.classList.add('drag-over');
      }
    });

    this.viewportEl.addEventListener('dragleave', (e) => {
      const rect = this.viewportEl.getBoundingClientRect();
      if (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom) {
        this.viewportEl.classList.remove('drag-over');
      }
    });

    this.viewportEl.addEventListener('drop', (e) => {
      e.preventDefault();
      this.viewportEl.classList.remove('drag-over');
      const type = e.dataTransfer.getData('text/plain') || this.draggedBlockType;
      if (!type) return;

      const vpRect = this.viewportEl.getBoundingClientRect();
      const mouseX = e.clientX - vpRect.left;
      const mouseY = e.clientY - vpRect.top;

      // Accurately compute canvas coordinate accounting for zoom & panning
      const canvasX = (mouseX - this.panX) / this.zoom - 100;
      const canvasY = (mouseY - this.panY) / this.zoom - 50;

      const node = this.createNode(type, Math.max(20, canvasX), Math.max(20, canvasY));
      this.renderNodeElement(node);
      this.updateWires();
      this.draggedBlockType = null;
    });

    // 2. Zoom Controls
    this.container.querySelector('#btn-zoom-in').addEventListener('click', () => {
      this.setZoom(this.zoom + 0.15);
    });
    this.container.querySelector('#btn-zoom-out').addEventListener('click', () => {
      this.setZoom(this.zoom - 0.15);
    });
    this.container.querySelector('#btn-zoom-reset').addEventListener('click', () => {
      this.setZoom(1.0);
      this.panX = 40;
      this.panY = 30;
      this.updateTransform();
      this.updateWires();
    });

    // Mouse wheel zoom
    this.viewportEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.viewportEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const newZoom = Math.min(2.0, Math.max(0.4, this.zoom + delta));

      // Zoom towards mouse pointer
      this.panX -= (mouseX - this.panX) * (newZoom / this.zoom - 1);
      this.panY -= (mouseY - this.panY) * (newZoom / this.zoom - 1);
      this.zoom = newZoom;

      this.hideContextMenu();
      this.updateTransform();
      this.updateWires();
    }, { passive: false });

    // 3. Pan canvas by dragging background
    this.viewportEl.addEventListener('mousedown', (e) => {
      this.hideContextMenu();
      if (e.target.closest('.circuit-node') || e.target.closest('.workbench-toolbar')) {
        return;
      }

      this.isPanning = true;
      this.panStartX = e.clientX - this.panX;
      this.panStartY = e.clientY - this.panY;
      this.viewportEl.style.cursor = 'grabbing';

      const onMouseMove = (moveEvt) => {
        if (!this.isPanning) return;
        this.panX = moveEvt.clientX - this.panStartX;
        this.panY = moveEvt.clientY - this.panStartY;
        this.updateTransform();
        this.updateWires();
      };

      const onMouseUp = () => {
        this.isPanning = false;
        this.viewportEl.style.cursor = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // 4. Socket wiring clicks (event delegation on nodes container)
    this.nodesContainerEl.addEventListener('click', (e) => {
      this.hideContextMenu();
      const sock = e.target.closest('.port-socket');
      if (!sock) return;
      e.stopPropagation();

      const nodeId = sock.dataset.node;
      const portId = sock.dataset.port;
      const sockType = sock.dataset.type;

      // If already dragging a wire
      if (this.activeWiring) {
        if (this.activeWiring.nodeId === nodeId && this.activeWiring.portId === portId) {
          this.cancelWiring();
          return;
        }

        // Check if connecting OUT to IN
        const s1 = this.activeWiring;
        const s2 = { nodeId, portId, type: sockType };

        if (s1.type !== s2.type) {
          const from = s1.type === 'out' ? s1 : s2;
          const to = s1.type === 'in' ? s1 : s2;

          this.graph.connect(from.nodeId, from.portId, to.nodeId, to.portId, this.activeWiring.color);
          this.cancelWiring();
          this.updateWires();
        }
        return;
      }

      // Start dragging cable from this socket (supports multiple outgoing wires from an OUT socket)
      const color = sock.style.getPropertyValue('--socket-color') || '#00f0ff';
      this.startWiring(sock, nodeId, portId, sockType, color);
    });

    // Right-click context menu on sockets for cable deletion
    this.nodesContainerEl.addEventListener('contextmenu', (e) => {
      const sock = e.target.closest('.port-socket');
      if (!sock) {
        this.hideContextMenu();
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      const nodeId = sock.dataset.node;
      const portId = sock.dataset.port;
      const sockType = sock.dataset.type;
      this.showSocketContextMenu(e, nodeId, portId, sockType);
    });

    // Cancel active wiring / dismiss context menu if clicked empty space
    this.viewportEl.addEventListener('click', (e) => {
      this.hideContextMenu();
      if (!e.target.closest('.port-socket') && this.activeWiring) {
        this.cancelWiring();
      }
    });

    // Global document click to close context menu
    this.docClickHandler = (e) => {
      if (!e.target.closest('#wb-context-menu')) {
        this.hideContextMenu();
      }
    };
    document.addEventListener('click', this.docClickHandler);

    // 5. Toolbar action buttons
    this.container.querySelector('#btn-wb-load-preset').addEventListener('click', () => {
      this.setupInitialPreset();
    });

    this.container.querySelector('#btn-wb-clear-all').addEventListener('click', () => {
      this.graph.clear();
      this.nodesContainerEl.innerHTML = '';
      this.updateWires();
      this.updateEmptyState();
    });

    this.container.querySelector('#btn-wb-clear-wires').addEventListener('click', () => {
      this.graph.wires = [];
      this.graph.notify();
      this.updateWires();
    });

    this.container.querySelector('#btn-wb-audio-toggle').addEventListener('click', () => {
      this.toggleAudio();
    });

    // 6. Instrument Modal Window Controls
    const modalBackdrop = this.container.querySelector('#wb-instrument-modal');
    const modalCloseBtn = this.container.querySelector('#btn-modal-close');
    const modalFreezeBtn = this.container.querySelector('#btn-modal-freeze');

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          this.closeInstrumentModal();
        }
      });
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => {
        this.closeInstrumentModal();
      });
    }

    if (modalFreezeBtn) {
      modalFreezeBtn.addEventListener('click', () => {
        this.toggleModalFreeze();
      });
    }

    this.escKeyHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideContextMenu();
        if (this.activeWiring) {
          this.cancelWiring();
        }
        if (this.activeModalNodeId) {
          this.closeInstrumentModal();
        }
      }
    };
    document.addEventListener('keydown', this.escKeyHandler);

    // 7. Interactive Spectrograph Canvas Scaling (Mouse Wheel Zoom & Drag Pan)
    const modalCanvas = this.container.querySelector('#modal-instrument-canvas');
    if (modalCanvas) {
      modalCanvas.addEventListener('wheel', (e) => {
        if (!this.activeModalNodeId) return;
        const node = this.graph.nodes.get(this.activeModalNodeId);
        if (!node || node.type !== 'spectrograph') return;

        e.preventDefault();
        const rect = modalCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, mouseX / rect.width));

        const span = this.spectroFreqMax - this.spectroFreqMin;
        const zoomFactor = e.deltaY < 0 ? 0.78 : 1.28;
        const newSpan = Math.max(1000, Math.min(120000, span * zoomFactor));

        const centerF = this.spectroFreqMin + ratio * span;
        this.spectroFreqMin = Math.max(0, Math.round(centerF - ratio * newSpan));
        this.spectroFreqMax = Math.round(this.spectroFreqMin + newSpan);

        this.updateModalControls(node);
        this.renderModalSpectrograph(node);
      }, { passive: false });

      let isPanningSpectro = false;
      let panStartMouseX = 0;
      let panStartFMin = 0;
      let panStartFMax = 0;

      modalCanvas.addEventListener('mousedown', (e) => {
        if (!this.activeModalNodeId) return;
        const node = this.graph.nodes.get(this.activeModalNodeId);
        if (!node || node.type !== 'spectrograph') return;

        isPanningSpectro = true;
        panStartMouseX = e.clientX;
        panStartFMin = this.spectroFreqMin;
        panStartFMax = this.spectroFreqMax;
        modalCanvas.style.cursor = 'ew-resize';

        const onMouseMove = (moveEvt) => {
          if (!isPanningSpectro) return;
          const rect = modalCanvas.getBoundingClientRect();
          const dxPx = moveEvt.clientX - panStartMouseX;
          const span = panStartFMax - panStartFMin;
          const dFreq = (dxPx / rect.width) * span;

          let newFMin = panStartFMin - dFreq;
          let newFMax = panStartFMax - dFreq;
          if (newFMin < 0) {
            newFMax -= newFMin;
            newFMin = 0;
          }

          this.spectroFreqMin = Math.round(newFMin);
          this.spectroFreqMax = Math.round(newFMax);

          this.updateModalControls(node);
          this.renderModalSpectrograph(node);
        };

        const onMouseUp = () => {
          isPanningSpectro = false;
          modalCanvas.style.cursor = '';
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      modalCanvas.addEventListener('dblclick', () => {
        if (!this.activeModalNodeId) return;
        const node = this.graph.nodes.get(this.activeModalNodeId);
        if (!node || node.type !== 'spectrograph') return;

        this.spectroFreqMin = 0;
        this.spectroFreqMax = 40000;
        this.spectroScaleV = 3.0;
        this.spectroScaleMode = 'linear';
        this.updateModalControls(node);
        this.renderModalSpectrograph(node);
      });
    }
  }

  setZoom(val) {
    this.zoom = Math.min(2.0, Math.max(0.4, val));
    this.container.querySelector('#zoom-value-label').textContent = `${Math.round(this.zoom * 100)}%`;
    this.updateTransform();
    this.updateWires();
  }

  updateTransform() {
    this.surfaceEl.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    this.container.querySelector('#zoom-value-label').textContent = `${Math.round(this.zoom * 100)}%`;
  }

  startWiring(socketEl, nodeId, portId, type, color) {
    const sRect = socketEl.getBoundingClientRect();
    const surfRect = this.surfaceEl.getBoundingClientRect();

    const startX = (sRect.left + sRect.width / 2 - surfRect.left) / this.zoom;
    const startY = (sRect.top + sRect.height / 2 - surfRect.top) / this.zoom;

    this.activeWiring = { nodeId, portId, type, color, startX, startY };
    socketEl.classList.add('source-active');

    const onMouseMove = (moveEvt) => {
      if (!this.activeWiring) return;
      const curX = (moveEvt.clientX - surfRect.left) / this.zoom;
      const curY = (moveEvt.clientY - surfRect.top) / this.zoom;
      this.drawTempWire(this.activeWiring.startX, this.activeWiring.startY, curX, curY, color);
    };

    const cleanup = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', cleanup);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', cleanup);
  }

  cancelWiring() {
    this.activeWiring = null;
    this.container.querySelectorAll('.port-socket').forEach(s => s.classList.remove('source-active'));
    const temp = this.wiresSvgEl.querySelector('#temp-wire-drag');
    if (temp) temp.remove();
  }

  // Generate straight schematic orthogonal wiring with 90° right angles
  getOrthogonalPath(x1, y1, x2, y2) {
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    x2 = Math.round(x2);
    y2 = Math.round(y2);

    // If target port is forward/to the right with at least 16px clearance
    if (x2 >= x1 + 16) {
      const midX = Math.round((x1 + x2) / 2);
      return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    } else {
      // Loopback/reversed: step right from OUT, route vertically, step into IN from left
      const rightX = x1 + 24;
      const leftX = x2 - 24;
      const midY = Math.round((y1 + y2) / 2);
      return `M ${x1} ${y1} L ${rightX} ${y1} L ${rightX} ${midY} L ${leftX} ${midY} L ${leftX} ${y2} L ${x2} ${y2}`;
    }
  }

  drawTempWire(x1, y1, x2, y2, color) {
    let temp = this.wiresSvgEl.querySelector('#temp-wire-drag');
    if (!temp) {
      temp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      temp.id = 'temp-wire-drag';
      temp.setAttribute('class', 'temp-cable-wire');
      temp.setAttribute('fill', 'none');
      temp.setAttribute('stroke-width', '2.5');
      temp.setAttribute('stroke-linejoin', 'round');
      temp.setAttribute('stroke-linecap', 'round');
      this.wiresSvgEl.appendChild(temp);
    }
    const pathD = this.getOrthogonalPath(x1, y1, x2, y2);
    temp.setAttribute('d', pathD);
    temp.setAttribute('stroke', color);
  }

  updateWires() {
    // Clear existing rendered wires (preserve temp wire if present)
    const oldWires = this.wiresSvgEl.querySelectorAll('.cable-rendered');
    oldWires.forEach(w => w.remove());

    // Clear connected socket classes
    this.container.querySelectorAll('.port-socket').forEach(s => s.classList.remove('connected'));

    const surfRect = this.surfaceEl.getBoundingClientRect();

    this.graph.wires.forEach(wire => {
      const fromEl = this.container.querySelector(`#${wire.fromNode} [data-port="${wire.fromPort}"]`);
      const toEl = this.container.querySelector(`#${wire.toNode} [data-port="${wire.toPort}"]`);
      if (!fromEl || !toEl) return;

      fromEl.classList.add('connected');
      toEl.classList.add('connected');

      const r1 = fromEl.getBoundingClientRect();
      const r2 = toEl.getBoundingClientRect();

      const p1 = {
        x: (r1.left + r1.width / 2 - surfRect.left) / this.zoom,
        y: (r1.top + r1.height / 2 - surfRect.top) / this.zoom
      };
      const p2 = {
        x: (r2.left + r2.width / 2 - surfRect.left) / this.zoom,
        y: (r2.top + r2.height / 2 - surfRect.top) / this.zoom
      };

      const pathD = this.getOrthogonalPath(p1.x, p1.y, p2.x, p2.y);

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'cable-rendered');
      group.setAttribute('data-wire-id', wire.id);
      group.style.setProperty('--wire-color', wire.color);

      group.innerHTML = `
        <path class="cable-glow-path" d="${pathD}" fill="none" stroke="${wire.color}" stroke-width="7" stroke-opacity="0.25" stroke-linecap="round" stroke-linejoin="round" />
        <path class="cable-main-path" d="${pathD}" fill="none" stroke="${wire.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <path class="cable-hit-area" d="${pathD}" fill="none" stroke="transparent" stroke-width="22" style="pointer-events: stroke; cursor: context-menu;" />
        <circle cx="${p1.x}" cy="${p1.y}" r="4.5" fill="${wire.color}" style="pointer-events: fill; cursor: context-menu;" />
        <circle cx="${p2.x}" cy="${p2.y}" r="4.5" fill="${wire.color}" style="pointer-events: fill; cursor: context-menu;" />
      `;

      group.addEventListener('contextmenu', (e) => {
        this.showWireContextMenu(e, wire);
      });

      this.wiresSvgEl.appendChild(group);
    });
  }

  autoWireAll() {
    // Find first available source, oscillator, modulator, filter, osc, spec
    const source = [...this.graph.nodes.values()].find(n => n.type === 'source');
    const osc = [...this.graph.nodes.values()].find(n => n.type === 'oscillator');
    const mod = [...this.graph.nodes.values()].find(n => n.type === 'modulator');
    const filter = [...this.graph.nodes.values()].find(n => n.type === 'filter');
    const oscilloscopes = [...this.graph.nodes.values()].filter(n => n.type === 'oscilloscope');
    const spectrographs = [...this.graph.nodes.values()].filter(n => n.type === 'spectrograph');

    if (source && mod) this.graph.connect(source.id, 'out', mod.id, 'mod-in-audio', '#00f0ff');
    if (osc && mod) this.graph.connect(osc.id, 'out', mod.id, 'mod-in-carrier', '#a855f7');
    if (mod && filter) this.graph.connect(mod.id, 'rf-out', filter.id, 'filter-in', '#00f0ff');
    if (mod && oscilloscopes[0]) this.graph.connect(mod.id, 'rf-out', oscilloscopes[0].id, 'in', '#00f0ff');
    if (filter && spectrographs[0]) this.graph.connect(filter.id, 'filter-out', spectrographs[0].id, 'in', '#10b981');
    if (filter && oscilloscopes[1]) this.graph.connect(filter.id, 'filter-out', oscilloscopes[1].id, 'in', '#10b981');

    this.updateWires();
  }

  // Animation loop updating all standalone Oscilloscope and Spectrograph screens
  startAnimationLoop() {
    const renderLoop = () => {
      this.timeOffset += 0.00002;

      // Render each oscilloscope block
      for (const node of this.graph.nodes.values()) {
        if (node.type === 'oscilloscope') {
          this.renderOscilloscopeCanvas(node);
        } else if (node.type === 'spectrograph') {
          this.renderSpectrographCanvas(node);
        }
      }

      // Render modal detailed view if open and not frozen
      if (this.activeModalNodeId && !this.isModalFrozen) {
        const modalNode = this.graph.nodes.get(this.activeModalNodeId);
        if (modalNode) {
          if (modalNode.type === 'oscilloscope') {
            this.renderModalOscilloscope(modalNode);
          } else if (modalNode.type === 'spectrograph') {
            this.renderModalSpectrograph(modalNode);
          }
        }
      }

      this.animationId = requestAnimationFrame(renderLoop);
    };
    this.animationId = requestAnimationFrame(renderLoop);
  }

  renderOscilloscopeCanvas(node) {
    const canvas = this.container.querySelector(`#canvas-${node.id}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw background grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center zero axis
    const yZero = h / 2;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, yZero);
    ctx.lineTo(w, yZero);
    ctx.stroke();

    // Check if input wire connected
    const inWire = this.graph.getInputWire(node.id, 'in');
    if (!inWire) {
      ctx.fillStyle = '#64748b';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('НЕТ ВХОДНОГО СИГНАЛА', w / 2, yZero + 4);
      return;
    }

    // Render waveform
    const samples = 300;
    const timeSpan = (node.params.timeDiv || 2) * 0.001; // dynamically 1ms, 2ms, 4ms
    const scaleV = 3.5;

    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < samples; i++) {
      const t = this.timeOffset + (i / samples) * timeSpan;
      const v = this.graph.evaluateSignal(inWire.fromNode, inWire.fromPort, t);
      const x = (i / samples) * w;
      const y = yZero - (v / scaleV) * (h * 0.42);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  colorWithAlpha(color, alpha) {
    if (!color) return `rgba(168, 85, 247, ${alpha})`;
    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (color.startsWith('rgb')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    return color;
  }

  renderSpectrographCanvas(node) {
    const canvas = this.container.querySelector(`#canvas-${node.id}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw grid
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const yBase = h - 12;
    const maxFreq = 40000;
    const fToX = (f) => (f / maxFreq) * w;

    // Check connections (CH1 and CH2) and saved reference trace
    const wire1 = this.graph.getInputWire(node.id, 'in');
    const wire2 = this.graph.getInputWire(node.id, 'in-2');
    const savedTrace = (node.params.showSavedTrace !== false && node.params.savedTrace) ? node.params.savedTrace : null;

    if (!wire1 && !wire2 && !savedTrace) {
      ctx.fillStyle = '#64748b';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('НЕТ ВХОДНОГО СИГНАЛА (CH1/CH2)', w / 2, h / 2 + 4);
      return;
    }

    // Noise floor line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, yBase);
    for (let x = 0; x <= w; x += 6) {
      ctx.lineTo(x, yBase - Math.random() * 4);
    }
    ctx.stroke();

    // Helper to draw a set of peaks with continuous curve and peak-to-peak envelope
    const drawPeakSet = (peaks, defaultColor, isDashed = false) => {
      if (!peaks || peaks.length === 0) return;
      const pColor = defaultColor || peaks[0].color || '#a855f7';
      const sorted = [...peaks].sort((a, b) => a.freq - b.freq);

      // 1. Continuous spectral curve between peaks (bell skirts + noise)
      const rbw = 1200; // resolution bandwidth in Hz for miniature preview
      const step = 2.5;
      const pts = [];
      for (let x = 0; x <= w; x += step) {
        const f = (x / w) * maxFreq;
        let amp = 0.02;
        for (const p of peaks) {
          const df = f - p.freq;
          amp += p.amp * Math.exp(-0.5 * (df / rbw) * (df / rbw));
        }
        const normAmp = Math.min(1.0, amp / 3.0);
        const y = yBase - normAmp * (h * 0.75);
        pts.push({ x, y });
      }

      ctx.save();
      // Draw subtle filled glow under the curve
      ctx.beginPath();
      ctx.moveTo(pts[0].x, yBase);
      for (const pt of pts) ctx.lineTo(pt.x, pt.y);
      ctx.lineTo(w, yBase);
      ctx.closePath();
      ctx.fillStyle = this.colorWithAlpha(pColor, 0.16);
      ctx.fill();

      // Continuous curve outline
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
        else ctx.lineTo(pts[i].x, pts[i].y);
      }
      if (sorted.length > 1 && !isDashed) {
        const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
        sorted.forEach(p => {
          const col = p.color || pColor;
          const pos = Math.max(0, Math.min(1, fToX(p.freq) / w));
          lineGrad.addColorStop(pos, col);
        });
        lineGrad.addColorStop(0, sorted[0].color || pColor);
        lineGrad.addColorStop(1, sorted[sorted.length - 1].color || pColor);
        ctx.strokeStyle = lineGrad;
      } else {
        ctx.strokeStyle = pColor;
      }
      ctx.shadowColor = pColor;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.8;
      if (isDashed) ctx.setLineDash([3, 2]);
      ctx.stroke();

      // 2. Direct envelope connecting peak tops (if 2+ peaks)
      if (sorted.length >= 2) {
        const pCoords = sorted.map(p => {
          const x = fToX(p.freq);
          const normAmp = Math.min(1.0, p.amp / 3.0);
          const y = yBase - normAmp * (h * 0.75);
          return { x, y, color: (isDashed && defaultColor) ? defaultColor : (p.color || defaultColor || '#a855f7') };
        });

        for (let i = 1; i < pCoords.length; i++) {
          const prev = pCoords[i - 1];
          const curr = pCoords[i];
          const midX = (prev.x + curr.x) / 2;

          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.bezierCurveTo(midX, prev.y, midX, curr.y, curr.x, curr.y);

          const segGrad = ctx.createLinearGradient(prev.x, prev.y, curr.x, curr.y);
          segGrad.addColorStop(0, prev.color);
          segGrad.addColorStop(1, curr.color);
          ctx.strokeStyle = segGrad;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.shadowBlur = 4;
          ctx.shadowColor = curr.color;
          ctx.stroke();
        }
      }

      // 3. Peak markers & labels
      sorted.forEach(peak => {
        const x = fToX(peak.freq);
        if (x < 0 || x > w) return;
        const normAmp = Math.min(1.0, peak.amp / 3.0);
        const yPeak = yBase - normAmp * (h * 0.75);
        const peakColor = (isDashed && defaultColor) ? defaultColor : (peak.color || defaultColor || '#a855f7');

        // Thin guide line
        ctx.setLineDash([1, 2]);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = this.colorWithAlpha(peakColor, 0.7);
        ctx.beginPath();
        ctx.moveTo(x, yBase);
        ctx.lineTo(x, yPeak);
        ctx.stroke();

        // Apex dot with peak color
        ctx.fillStyle = peakColor;
        ctx.shadowColor = peakColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x, yPeak, 3, 0, Math.PI * 2);
        ctx.fill();

        // White core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, yPeak, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Tag label
        ctx.fillStyle = peakColor;
        ctx.font = '700 8.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(peak.label, x, yPeak - 5);
      });
      ctx.restore();
    };

    // 1. Draw saved reference trace (gold, dashed)
    if (savedTrace) {
      drawPeakSet(savedTrace, '#f59e0b', true);
    }

    // 2. Draw CH1 peaks (purple/native)
    if (wire1) {
      const peaks1 = this.graph.getSpectralPeaks(node.id, 'in');
      drawPeakSet(peaks1, null, false);
    }

    // 3. Draw CH2 peaks (cyan #00f0ff)
    if (wire2) {
      const peaks2 = this.graph.getSpectralPeaks(node.id, 'in-2');
      drawPeakSet(peaks2, '#00f0ff', false);
    }
  }

  toggleAudio() {
    if (this.isPlayingAudio) {
      this.stopAudio();
      return false;
    } else {
      this.startAudio();
      return true;
    }
  }

  startAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      const sourceNode = [...this.graph.nodes.values()].find(n => n.type === 'source');
      const fm = sourceNode ? (sourceNode.params.fm || 1000) : 1000;

      this.audioOsc = this.audioCtx.createOscillator();
      this.audioGain = this.audioCtx.createGain();

      this.audioOsc.type = 'sine';
      this.audioOsc.frequency.setValueAtTime(fm, this.audioCtx.currentTime);
      this.audioGain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);

      this.audioOsc.connect(this.audioGain);
      this.audioGain.connect(this.audioCtx.destination);

      this.audioOsc.start();
      this.isPlayingAudio = true;
      const btn = this.container.querySelector('#btn-wb-audio-toggle');
      if (btn) btn.textContent = '🔊 Звук: Вкл ✓';
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  stopAudio() {
    try {
      if (this.audioOsc) {
        this.audioOsc.stop();
        this.audioOsc.disconnect();
      }
      if (this.audioCtx) this.audioCtx.close();
    } catch (e) {}
    this.audioOsc = null;
    this.audioCtx = null;
    this.isPlayingAudio = false;
    const btn = this.container.querySelector('#btn-wb-audio-toggle');
    if (btn) btn.textContent = '🔊 Звук: Выкл';
  }

  // Detailed Instrument Modal Dialog Window (Oscilloscope / Spectrograph)
  openInstrumentModal(nodeId) {
    const node = this.graph.nodes.get(nodeId);
    if (!node || (node.type !== 'oscilloscope' && node.type !== 'spectrograph')) return;

    this.activeModalNodeId = nodeId;
    this.isModalFrozen = false;

    const freezeBtn = this.container.querySelector('#btn-modal-freeze');
    if (freezeBtn) {
      freezeBtn.classList.remove('frozen');
      freezeBtn.innerHTML = '⏸ Стоп-кадр';
    }

    if (node.type === 'oscilloscope') {
      this.modalTimeDiv = node.params.timeDiv || 2;
    }

    const modal = this.container.querySelector('#wb-instrument-modal');
    if (!modal) return;
    modal.style.display = 'flex';

    this.updateModalControls(node);
    if (node.type === 'oscilloscope') {
      this.renderModalOscilloscope(node);
    } else {
      this.renderModalSpectrograph(node);
    }
  }

  closeInstrumentModal() {
    this.activeModalNodeId = null;
    this.isModalFrozen = false;
    const modal = this.container.querySelector('#wb-instrument-modal');
    if (modal) modal.style.display = 'none';
  }

  toggleModalFreeze() {
    this.isModalFrozen = !this.isModalFrozen;
    const btn = this.container.querySelector('#btn-modal-freeze');
    if (btn) {
      if (this.isModalFrozen) {
        btn.classList.add('frozen');
        btn.innerHTML = '▶ Возобновить';
      } else {
        btn.classList.remove('frozen');
        btn.innerHTML = '⏸ Стоп-кадр';
      }
    }
  }

  updateModalControls(node) {
    const badge = this.container.querySelector('#modal-inst-badge');
    const title = this.container.querySelector('#modal-inst-title');
    const src = this.container.querySelector('#modal-inst-source');
    const footer = this.container.querySelector('#modal-instrument-footer');
    if (!badge || !title || !src || !footer) return;

    const inWire = this.graph.getInputWire(node.id, 'in');
    let sourceDesc = 'Не подключен (нет сигнала)';
    if (inWire) {
      const fromNode = this.graph.nodes.get(inWire.fromNode);
      const nameMap = {
        'source': 'Источник сообщения',
        'oscillator': 'Несущая',
        'modulator': 'Модулятор',
        'filter': 'Полосовой фильтр',
        'receiver': 'Приемник'
      };
      sourceDesc = `${nameMap[fromNode?.type] || fromNode?.type || 'Блок'} [порт: ${inWire.fromPort}]`;
    }

    if (node.type === 'oscilloscope') {
      badge.textContent = 'CH1 OSC';
      badge.style.background = 'rgba(0, 240, 255, 0.15)';
      badge.style.color = '#00f0ff';
      badge.style.border = '1px solid rgba(0, 240, 255, 0.4)';
      title.textContent = 'Лабораторный 2D Осциллограф s(t)';
      src.textContent = `Входной кабель: ${sourceDesc}`;

      footer.innerHTML = `
        <div class="modal-footer-cluster">
          <span style="color: var(--text-muted); font-size: 0.74rem;">Развертка (время):</span>
          <div style="display: flex; gap: 0.25rem;">
            ${[0.5, 1.0, 2.0, 4.0, 8.0].map(t => `
              <button class="node-time-btn modal-time-opt ${this.modalTimeDiv === t ? 'active' : ''}" data-t="${t}" style="font-size: 0.72rem; padding: 0.25rem 0.55rem; background: ${this.modalTimeDiv === t ? 'rgba(0,240,255,0.25)' : 'rgba(255,255,255,0.06)'}; border: 1px solid ${this.modalTimeDiv === t ? 'rgba(0,240,255,0.6)' : 'rgba(255,255,255,0.1)'}; color: ${this.modalTimeDiv === t ? '#ffffff' : '#94a3b8'}; border-radius: 4px; cursor: pointer;">${t} ms</button>
            `).join('')}
          </div>
        </div>

        <div class="modal-footer-cluster">
          <span style="color: var(--text-muted); font-size: 0.74rem;">Шкала напряжений:</span>
          <div style="display: flex; gap: 0.25rem;">
            ${[1.5, 2.5, 3.5, 5.0].map(v => `
              <button class="node-time-btn modal-scale-opt ${this.modalScaleV === v ? 'active' : ''}" data-v="${v}" style="font-size: 0.72rem; padding: 0.25rem 0.55rem; background: ${this.modalScaleV === v ? 'rgba(0,240,255,0.25)' : 'rgba(255,255,255,0.06)'}; border: 1px solid ${this.modalScaleV === v ? 'rgba(0,240,255,0.6)' : 'rgba(255,255,255,0.1)'}; color: ${this.modalScaleV === v ? '#ffffff' : '#94a3b8'}; border-radius: 4px; cursor: pointer;">±${v} В</button>
            `).join('')}
          </div>
        </div>

        <div class="modal-footer-cluster" id="modal-osc-readout-hud">
          <div class="modal-hud-item"><span style="color: var(--text-muted);">Vp-p:</span> <span style="color: #00f0ff;" id="hud-vpp">—</span></div>
          <div class="modal-hud-item"><span style="color: var(--text-muted);">Vrms:</span> <span style="color: #38bdf8;" id="hud-vrms">—</span></div>
          <div class="modal-hud-item"><span style="color: var(--text-muted);">T/дел:</span> <span style="color: #ffffff;" id="hud-tdiv">${(this.modalTimeDiv / 10).toFixed(2)} ms</span></div>
        </div>
      `;

      footer.querySelectorAll('.modal-time-opt').forEach(b => {
        b.addEventListener('click', () => {
          this.modalTimeDiv = parseFloat(b.dataset.t);
          node.params.timeDiv = this.modalTimeDiv;
          const lbl = this.container.querySelector(`#osc-time-label-${node.id}`);
          if (lbl) lbl.textContent = `${this.modalTimeDiv.toFixed(1)} ms`;
          this.updateModalControls(node);
          if (this.isModalFrozen) this.renderModalOscilloscope(node);
        });
      });

      footer.querySelectorAll('.modal-scale-opt').forEach(b => {
        b.addEventListener('click', () => {
          this.modalScaleV = parseFloat(b.dataset.v);
          this.updateModalControls(node);
          if (this.isModalFrozen) this.renderModalOscilloscope(node);
        });
      });
    } else {
      // Spectrograph
      badge.textContent = 'FFT SPECTRO';
      badge.style.background = 'rgba(168, 85, 247, 0.15)';
      badge.style.color = '#c084fc';
      badge.style.border = '1px solid rgba(168, 85, 247, 0.4)';
      title.textContent = 'Анализатор Спектра (Двухканальный FFT Analyzer)';

      const wire1 = this.graph.getInputWire(node.id, 'in');
      const wire2 = this.graph.getInputWire(node.id, 'in-2');
      let desc1 = 'CH1: не подключен';
      if (wire1) {
        desc1 = `CH1: ${this.getNodeDisplayName(wire1.fromNode)} [${this.getPortDisplayName(wire1.fromNode, wire1.fromPort)}]`;
      }
      let desc2 = 'CH2: не подключен';
      if (wire2) {
        desc2 = `CH2: ${this.getNodeDisplayName(wire2.fromNode)} [${this.getPortDisplayName(wire2.fromNode, wire2.fromPort)}]`;
      }
      src.textContent = `${desc1} | ${desc2}`;

      const fMin = this.spectroFreqMin || 0;
      const fMax = this.spectroFreqMax || 40000;

      footer.innerHTML = `
        <!-- Trace / Channel Layer Controls -->
        <div class="modal-footer-cluster" style="flex-wrap: wrap;">
          <span style="color: var(--text-muted); font-size: 0.74rem;">Графики / Следы:</span>
          <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
            <button class="modal-ctrl-btn ${this.spectroShowEnvelope !== false ? 'active' : ''}" id="btn-spectro-toggle-env" title="Включить / скрыть непрерывную спектральную кривую и огибающую между пиками">📈 График между пиками: ${this.spectroShowEnvelope !== false ? 'ВКЛ' : 'ВЫКЛ'}</button>
            <button class="modal-ctrl-btn" id="btn-spectro-snapshot" title="Зафиксировать текущий спектр как дополнительный опорный график (Trace 2) для сравнительного анализа">➕ Опорный след</button>
            ${node.params.savedTrace ? `
              <button class="modal-ctrl-btn ${node.params.showSavedTrace !== false ? 'active' : ''}" id="btn-spectro-toggle-ref" title="Включить / скрыть отображение опорного графика">${node.params.showSavedTrace !== false ? '👁️ Опорный: Вкл' : '👁️ Опорный: Скрыт'}</button>
              <button class="modal-ctrl-btn" id="btn-spectro-clear-ref" title="Удалить сохраненный опорный график" style="color: #f87171;">🗑️ Очистить след</button>
            ` : ''}
            <span class="modal-hud-item" style="border-color: #a855f7; color: #c084fc; font-size: 0.72rem;">● CH1</span>
            <span class="modal-hud-item" style="border-color: #00f0ff; color: #00f0ff; font-size: 0.72rem; ${wire2 ? '' : 'opacity: 0.5;'}">● CH2 ${wire2 ? '(ВКЛ)' : '(Нет провода)'}</span>
            ${node.params.savedTrace ? `<span class="modal-hud-item" style="border-color: #f59e0b; color: #f59e0b; font-size: 0.72rem;">● Опорный след</span>` : ''}
          </div>
        </div>

        <!-- Frequency Span Scale -->
        <div class="modal-footer-cluster" style="flex-wrap: wrap;">
          <span style="color: var(--text-muted); font-size: 0.74rem;">Полоса обзора FFT (Span):</span>
          <div style="display: flex; gap: 0.25rem; align-items: center; flex-wrap: wrap;">
            <button class="modal-ctrl-btn modal-span-opt ${fMin === 0 && fMax === 20000 ? 'active' : ''}" data-fmin="0" data-fmax="20000">0..20 кГц</button>
            <button class="modal-ctrl-btn modal-span-opt ${fMin === 0 && fMax === 40000 ? 'active' : ''}" data-fmin="0" data-fmax="40000">0..40 кГц</button>
            <button class="modal-ctrl-btn modal-span-opt ${fMin === 0 && fMax === 60000 ? 'active' : ''}" data-fmin="0" data-fmax="60000">0..60 кГц</button>
            <button class="modal-ctrl-btn modal-span-opt ${fMin === 15000 && fMax === 25000 ? 'active' : ''}" data-fmin="15000" data-fmax="25000" title="Зум полосы модуляции вокруг несущей 20 кГц">🔍 Несущая (15..25k)</button>
            <button class="modal-ctrl-btn modal-span-opt ${fMin === 0 && fMax === 5000 ? 'active' : ''}" data-fmin="0" data-fmax="5000" title="Зум низкочастотной области 0..5 кГц">🔍 НЧ (0..5k)</button>
          </div>

          <div style="display: flex; gap: 0.2rem; margin-left: 0.35rem;">
            <button class="modal-ctrl-btn" id="btn-spectro-zoom-in" title="Увеличить частотный масштаб (растянуть полосу)">＋</button>
            <button class="modal-ctrl-btn" id="btn-spectro-zoom-out" title="Уменьшить частотный масштаб (сжать полосу)">–</button>
            <button class="modal-ctrl-btn" id="btn-spectro-zoom-reset" title="Сбросить масштаб к 0..40 кГц">1:1</button>
          </div>
        </div>

        <!-- Amplitude Scale -->
        <div class="modal-footer-cluster">
          <span style="color: var(--text-muted); font-size: 0.74rem;">Шкала амплитуды:</span>
          <div style="display: flex; gap: 0.25rem;">
            ${[1.0, 2.0, 3.0, 5.0].map(v => `
              <button class="modal-ctrl-btn modal-spectro-scale-opt ${this.spectroScaleMode === 'linear' && this.spectroScaleV === v ? 'active' : ''}" data-v="${v}">±${v.toFixed(1)} В</button>
            `).join('')}
            <button class="modal-ctrl-btn modal-spectro-mode-opt ${this.spectroScaleMode === 'db' ? 'active' : ''}" data-mode="db" title="Логарифмическая шкала уровней (0 .. -60 dB)">dB (Лог)</button>
          </div>
        </div>

        <!-- Harmonics Readout HUD -->
        <div class="modal-footer-cluster" id="modal-spectro-peaks-hud" style="flex-wrap: wrap; max-width: 100%;">
          <span style="color: var(--text-muted); font-size: 0.74rem;">Пики спектров:</span>
          <div id="modal-peaks-list" style="display: flex; gap: 0.4rem; flex-wrap: wrap;"></div>
        </div>
      `;

      // Toggle continuous curve & envelope between peaks
      const btnToggleEnv = footer.querySelector('#btn-spectro-toggle-env');
      if (btnToggleEnv) {
        btnToggleEnv.addEventListener('click', () => {
          this.spectroShowEnvelope = this.spectroShowEnvelope === false ? true : false;
          this.updateModalControls(node);
          this.renderModalSpectrograph(node);
        });
      }

      // Snapshot reference trace button
      const btnSnap = footer.querySelector('#btn-spectro-snapshot');
      if (btnSnap) {
        btnSnap.addEventListener('click', () => {
          const livePeaks = wire1 
            ? this.graph.getSpectralPeaks(node.id, 'in') 
            : (wire2 ? this.graph.getSpectralPeaks(node.id, 'in-2') : []);
          if (livePeaks.length === 0) return;
          node.params.savedTrace = livePeaks.map(p => ({ ...p, color: '#f59e0b', label: `Опорный ${p.label}` }));
          node.params.showSavedTrace = true;
          this.updateModalControls(node);
          this.renderModalSpectrograph(node);
        });
      }

      // Toggle reference trace
      const btnToggleRef = footer.querySelector('#btn-spectro-toggle-ref');
      if (btnToggleRef) {
        btnToggleRef.addEventListener('click', () => {
          node.params.showSavedTrace = node.params.showSavedTrace === false ? true : false;
          this.updateModalControls(node);
          this.renderModalSpectrograph(node);
        });
      }

      // Clear reference trace
      const btnClearRef = footer.querySelector('#btn-spectro-clear-ref');
      if (btnClearRef) {
        btnClearRef.addEventListener('click', () => {
          node.params.savedTrace = null;
          node.params.showSavedTrace = true;
          this.updateModalControls(node);
          this.renderModalSpectrograph(node);
        });
      }

      // Preset span clicks
      footer.querySelectorAll('.modal-span-opt').forEach(b => {
        b.addEventListener('click', () => {
          this.spectroFreqMin = parseInt(b.dataset.fmin, 10);
          this.spectroFreqMax = parseInt(b.dataset.fmax, 10);
          this.updateModalControls(node);
          if (this.isModalFrozen) this.renderModalSpectrograph(node);
        });
      });

      // Zoom + / - / Reset buttons
      const btnIn = footer.querySelector('#btn-spectro-zoom-in');
      const btnOut = footer.querySelector('#btn-spectro-zoom-out');
      const btnReset = footer.querySelector('#btn-spectro-zoom-reset');

      if (btnIn) {
        btnIn.addEventListener('click', () => {
          const span = this.spectroFreqMax - this.spectroFreqMin;
          const newSpan = Math.max(1000, span * 0.75);
          const center = (this.spectroFreqMin + this.spectroFreqMax) / 2;
          this.spectroFreqMin = Math.max(0, Math.round(center - newSpan / 2));
          this.spectroFreqMax = Math.round(this.spectroFreqMin + newSpan);
          this.updateModalControls(node);
          if (this.isModalFrozen) this.renderModalSpectrograph(node);
        });
      }

      if (btnOut) {
        btnOut.addEventListener('click', () => {
          const span = this.spectroFreqMax - this.spectroFreqMin;
          const newSpan = Math.min(120000, span * 1.35);
          const center = (this.spectroFreqMin + this.spectroFreqMax) / 2;
          this.spectroFreqMin = Math.max(0, Math.round(center - newSpan / 2));
          this.spectroFreqMax = Math.round(this.spectroFreqMin + newSpan);
          this.updateModalControls(node);
          if (this.isModalFrozen) this.renderModalSpectrograph(node);
        });
      }

      if (btnReset) {
        btnReset.addEventListener('click', () => {
          this.spectroFreqMin = 0;
          this.spectroFreqMax = 40000;
          this.spectroScaleV = 3.0;
          this.spectroScaleMode = 'linear';
          this.updateModalControls(node);
          if (this.isModalFrozen) this.renderModalSpectrograph(node);
        });
      }

      // Amplitude voltage scale clicks
      footer.querySelectorAll('.modal-spectro-scale-opt').forEach(b => {
        b.addEventListener('click', () => {
          this.spectroScaleMode = 'linear';
          this.spectroScaleV = parseFloat(b.dataset.v);
          this.updateModalControls(node);
          if (this.isModalFrozen) this.renderModalSpectrograph(node);
        });
      });

      // Amplitude dB scale mode
      const dbBtn = footer.querySelector('.modal-spectro-mode-opt');
      if (dbBtn) {
        dbBtn.addEventListener('click', () => {
          this.spectroScaleMode = this.spectroScaleMode === 'db' ? 'linear' : 'db';
          this.updateModalControls(node);
          if (this.isModalFrozen) this.renderModalSpectrograph(node);
        });
      }
    }
  }

  renderModalOscilloscope(node) {
    const canvas = this.container.querySelector('#modal-instrument-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark oscilloscope graticule background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // 10 horizontal divisions, 8 vertical divisions
    const hDivs = 10;
    const vDivs = 8;
    const dx = w / hDivs;
    const dy = h / vDivs;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let i = 1; i < hDivs; i++) {
      const x = i * dx;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let j = 1; j < vDivs; j++) {
      const y = j * dy;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Sub-ticks on center axes (real oscilloscope graticule)
    const yCenter = h / 2;
    const xCenter = w / 2;

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, yCenter);
    ctx.lineTo(w, yCenter);
    ctx.moveTo(xCenter, 0);
    ctx.lineTo(xCenter, h);
    ctx.stroke();

    // Horizontal axis minor ticks (5 sub-ticks per division)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    for (let i = 0; i <= hDivs * 5; i++) {
      const x = (i / (hDivs * 5)) * w;
      const tickH = (i % 5 === 0) ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(x, yCenter - tickH);
      ctx.lineTo(x, yCenter + tickH);
      ctx.stroke();
    }

    // Vertical axis minor ticks (5 sub-ticks per division)
    for (let j = 0; j <= vDivs * 5; j++) {
      const y = (j / (vDivs * 5)) * h;
      const tickW = (j % 5 === 0) ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(xCenter - tickW, y);
      ctx.lineTo(xCenter + tickW, y);
      ctx.stroke();
    }

    // Scale / Axis legends in corners
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(`CH1: ${(this.modalScaleV / (vDivs / 2)).toFixed(2)} В/дел`, 14, 22);

    ctx.textAlign = 'right';
    ctx.fillText(`Развертка: ${(this.modalTimeDiv / hDivs).toFixed(2)} ms/дел (${this.modalTimeDiv} ms общая)`, w - 14, 22);

    // Check if connected
    const inWire = this.graph.getInputWire(node.id, 'in');
    if (!inWire) {
      ctx.fillStyle = '#64748b';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('НЕТ ВХОДНОГО СИГНАЛА: СОЕДИНИТЕ ВХОД CH1 КАБЕЛЕМ С БЛОКОМ', w / 2, yCenter + 5);
      return;
    }

    // Sample waveform
    const samples = 860;
    const timeSpan = (this.modalTimeDiv || 2) * 0.001;
    const scaleV = this.modalScaleV || 3.5;

    let vMin = 999;
    let vMax = -999;
    let sumSq = 0;

    const points = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = this.timeOffset + (i / samples) * timeSpan;
      const v = this.graph.evaluateSignal(inWire.fromNode, inWire.fromPort, t);
      points[i] = v;
      if (v < vMin) vMin = v;
      if (v > vMax) vMax = v;
      sumSq += v * v;
    }

    const vRms = Math.sqrt(sumSq / samples);
    const vPp = vMax - vMin;

    // Draw glowing trace
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    for (let i = 0; i < samples; i++) {
      const x = (i / (samples - 1)) * w;
      const y = yCenter - (points[i] / scaleV) * (h * 0.42);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Update readout HUD
    const hudVpp = this.container.querySelector('#hud-vpp');
    const hudVrms = this.container.querySelector('#hud-vrms');
    if (hudVpp) hudVpp.textContent = `${vPp.toFixed(2)} В`;
    if (hudVrms) hudVrms.textContent = `${vRms.toFixed(2)} В`;

    // Bottom left real-time measurements banner on canvas
    ctx.fillStyle = 'rgba(6, 11, 23, 0.75)';
    ctx.fillRect(10, h - 30, 360, 22);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.strokeRect(10, h - 30, 360, 22);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 10.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Vmax: ${vMax >= 0 ? '+' : ''}${vMax.toFixed(2)}V  Vmin: ${vMin.toFixed(2)}V  Vp-p: ${vPp.toFixed(2)}V`, 18, h - 15);
  }

  renderModalSpectrograph(node) {
    const canvas = this.container.querySelector('#modal-instrument-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark FFT analyzer screen
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    const fMin = this.spectroFreqMin !== undefined ? this.spectroFreqMin : 0;
    const fMax = this.spectroFreqMax || 40000;
    const fSpan = Math.max(500, fMax - fMin);
    const scaleV = this.spectroScaleV || 3.0;
    const isDb = this.spectroScaleMode === 'db';

    const yBase = h - 35;
    const topMargin = 32;
    const hDivs = 10;
    const dx = w / hDivs;

    // Draw vertical frequency grid lines
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= hDivs; i++) {
      const x = i * dx;
      ctx.beginPath();
      ctx.moveTo(x, topMargin);
      ctx.lineTo(x, yBase);
      ctx.stroke();

      // Frequency labels below axis
      const freqVal = fMin + (i / hDivs) * fSpan;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.75)';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      let label = '';
      if (fSpan <= 10000) {
        label = `${(freqVal / 1000).toFixed(2)}k`;
      } else {
        label = freqVal === 0 ? '0' : `${(freqVal / 1000).toFixed(1)}k`;
      }
      ctx.fillText(label, x, yBase + 16);
    }

    // Horizontal amplitude grid lines (dB / V)
    const vDivs = 6;
    for (let j = 0; j <= vDivs; j++) {
      const y = topMargin + (j / vDivs) * (yBase - topMargin);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
      ctx.font = '600 9.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';

      if (isDb) {
        const dbVal = - (j / vDivs) * 60;
        ctx.fillText(`${dbVal.toFixed(0)} dB`, 8, y - 4);
      } else {
        const vVal = (1.0 - j / vDivs) * scaleV;
        ctx.fillText(`${vVal.toFixed(1)} В`, 8, y - 4);
      }
    }

    // Header info on canvas
    ctx.fillStyle = '#c084fc';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    const spanText = `Полоса: ${(fMin / 1000).toFixed(1)} .. ${(fMax / 1000).toFixed(1)} кГц (Span: ${(fSpan / 1000).toFixed(1)} кГц)`;
    const scaleText = isDb ? 'Шкала: 0 .. -60 dB (лог)' : `Шкала: 0 .. ${scaleV.toFixed(1)} В (лин)`;
    ctx.fillText(`FFT MAG: ${spanText} | ${scaleText}`, 14, 20);

    // Interactive hint on top right of canvas
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.font = '500 9.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('🖱️ Колесико: зум | Перетаскивание: сдвиг | Двойной клик: 1:1', w - 14, 20);

    // Check if connected or has saved reference trace
    const inWire1 = this.graph.getInputWire(node.id, 'in');
    const inWire2 = this.graph.getInputWire(node.id, 'in-2');
    const savedTrace = (node.params.showSavedTrace !== false && Array.isArray(node.params.savedTrace)) ? node.params.savedTrace : [];

    if (!inWire1 && !inWire2 && savedTrace.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('НЕТ ВХОДНОГО СИГНАЛА: ПОДКЛЮЧИТЕ КАБЕЛЬ К ВХОДУ CH1 ИЛИ CH2', w / 2, h / 2);

      const peaksListEl = this.container.querySelector('#modal-peaks-list');
      if (peaksListEl) {
        peaksListEl.innerHTML = '<span style="color: var(--text-muted); font-size: 0.74rem;">Гармоники не обнаружены</span>';
      }
      return;
    }

    // Noise floor line
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.18)';
    ctx.beginPath();
    ctx.moveTo(0, yBase);
    for (let x = 0; x <= w; x += 5) {
      ctx.lineTo(x, yBase - Math.random() * 6);
    }
    ctx.stroke();

    const peaks1 = inWire1 ? this.graph.getSpectralPeaks(node.id, 'in') : [];
    const peaks2 = inWire2 ? this.graph.getSpectralPeaks(node.id, 'in-2') : [];
    const fToX = (f) => ((f - fMin) / fSpan) * w;

    // Render peaks on canvas and collect HUD chips
    const peakChips = [];

    // Helper to draw a full trace group:
    // 1) Continuous spectral curve across frequencies with realistic Gaussian skirts & glow fill
    // 2) Distinct peak-to-peak connecting envelope line between peak tops
    // 3) Peak harmonic vertical stems, apex dots, and callout badges
    const drawTraceGroup = (peaks, channelLabel, defaultColor, isDashed = false) => {
      if (!peaks || peaks.length === 0) return;
      const color = defaultColor || peaks[0].color || '#a855f7';
      const sortedPeaks = [...peaks].sort((a, b) => a.freq - b.freq);

      const showEnv = this.spectroShowEnvelope !== false;

      // 1. Continuous spectral curve between peaks across the visible window
      if (showEnv) {
        const rbw = Math.max(300, fSpan / 70);
        const step = 2;
        const pts = [];

        for (let x = 0; x <= w; x += step) {
          const f = fMin + (x / w) * fSpan;
          let amp = 0.015 * scaleV;
          for (const p of peaks) {
            const df = f - p.freq;
            amp += p.amp * Math.exp(-0.5 * (df / rbw) * (df / rbw));
          }

          let normAmp = 0;
          if (isDb) {
            const levelDb = 20 * Math.log10(Math.max(0.0001, amp / scaleV));
            normAmp = Math.max(0.01, Math.min(1.0, (levelDb + 60) / 60));
          } else {
            normAmp = Math.max(0.01, Math.min(1.0, amp / scaleV));
          }
          const y = yBase - normAmp * (yBase - topMargin);
          pts.push({ x, y });
        }

        ctx.save();
        // Subtle area fill underneath the continuous curve
        ctx.beginPath();
        ctx.moveTo(pts[0].x, yBase);
        for (const pt of pts) ctx.lineTo(pt.x, pt.y);
        ctx.lineTo(w, yBase);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, topMargin, 0, yBase);
        grad.addColorStop(0, this.colorWithAlpha(color, 0.28));
        grad.addColorStop(1, this.colorWithAlpha(color, 0.02));
        ctx.fillStyle = grad;
        ctx.fill();

        // Glowing continuous trace line
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
          else ctx.lineTo(pts[i].x, pts[i].y);
        }
        if (sortedPeaks.length > 1 && !isDashed) {
          const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
          sortedPeaks.forEach(p => {
            const col = p.color || color;
            const pos = Math.max(0, Math.min(1, fToX(p.freq) / w));
            lineGrad.addColorStop(pos, col);
          });
          lineGrad.addColorStop(0, sortedPeaks[0].color || color);
          lineGrad.addColorStop(1, sortedPeaks[sortedPeaks.length - 1].color || color);
          ctx.strokeStyle = lineGrad;
        } else {
          ctx.strokeStyle = color;
        }
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.4;
        if (isDashed) ctx.setLineDash([5, 3]);
        ctx.stroke();

        // 2. Direct envelope line connecting peak tops (if 2+ peaks)
        if (sortedPeaks.length >= 2) {
          const pCoords = sortedPeaks.map(p => {
            const x = fToX(p.freq);
            let normAmp = 0;
            const levelDb = 20 * Math.log10(Math.max(0.0001, p.amp / scaleV));
            if (isDb) {
              normAmp = Math.max(0.02, Math.min(1.0, (levelDb + 60) / 60));
            } else {
              normAmp = Math.max(0.02, Math.min(1.0, p.amp / scaleV));
            }
            const y = yBase - normAmp * (yBase - topMargin);
            const peakCol = (isDashed && defaultColor) ? defaultColor : (p.color || defaultColor || '#a855f7');
            return { x, y, color: peakCol };
          });

          for (let i = 1; i < pCoords.length; i++) {
            const prev = pCoords[i - 1];
            const curr = pCoords[i];
            const midX = (prev.x + curr.x) / 2;

            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.bezierCurveTo(midX, prev.y, midX, curr.y, curr.x, curr.y);

            const segGrad = ctx.createLinearGradient(prev.x, prev.y, curr.x, curr.y);
            segGrad.addColorStop(0, prev.color);
            segGrad.addColorStop(1, curr.color);
            ctx.strokeStyle = segGrad;
            ctx.shadowColor = curr.color;
            ctx.shadowBlur = 8;
            ctx.lineWidth = 1.8;
            ctx.setLineDash([4, 3]);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // 3. Peak vertical harmonic stems, dots and callout badges
      sortedPeaks.forEach(peak => {
        const x = fToX(peak.freq);

        let normAmp = 0;
        const levelDb = 20 * Math.log10(Math.max(0.0001, peak.amp / scaleV));
        if (isDb) {
          normAmp = Math.max(0.02, Math.min(1.0, (levelDb + 60) / 60));
        } else {
          normAmp = Math.max(0.02, Math.min(1.0, peak.amp / scaleV));
        }
        const yPeak = yBase - normAmp * (yBase - topMargin);
        const peakColor = (isDashed && defaultColor) ? defaultColor : (peak.color || defaultColor || '#a855f7');

        // Collect HUD chip
        const isVisibleInView = (x >= 0 && x <= w);
        peakChips.push(`
          <div class="modal-hud-item" style="border-color: ${peakColor}; ${isVisibleInView ? 'background: rgba(168, 85, 247, 0.15);' : 'opacity: 0.65;'}" title="${isVisibleInView ? 'Отображается в текущем окне' : 'Вне текущего масштаба обзора'}">
            <span style="color: ${peakColor}; font-weight: 700;">● ${channelLabel ? `[${channelLabel}] ` : ''}${peak.label}:</span>
            <span style="color: #ffffff;">${(peak.freq / 1000).toFixed(2)} кГц (${peak.amp.toFixed(2)} В, ${levelDb.toFixed(1)} dB)</span>
            ${!isVisibleInView ? '<span style="color: #94a3b8; font-size: 0.62rem;">(вне окна)</span>' : ''}
          </div>
        `);

        // If outside view, skip drawing marker
        if (x < -10 || x > w + 10) return;

        ctx.save();
        // Thin stem down to base
        ctx.strokeStyle = this.colorWithAlpha(peakColor, showEnv ? 0.6 : 0.9);
        ctx.lineWidth = showEnv ? 1.5 : 2.5;
        if (showEnv) ctx.setLineDash([3, 2]);
        else if (isDashed) ctx.setLineDash([4, 3]);

        ctx.beginPath();
        ctx.moveTo(x, yBase);
        ctx.lineTo(x, yPeak);
        ctx.stroke();

        // Apex dot with peak color
        ctx.fillStyle = peakColor;
        ctx.shadowColor = peakColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, yPeak, 4, 0, Math.PI * 2);
        ctx.fill();

        // White core inside dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, yPeak, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Callout tag
        const tagText = isDb 
          ? `${channelLabel ? `[${channelLabel}] ` : ''}${peak.label} | ${levelDb.toFixed(1)} dB`
          : `${channelLabel ? `[${channelLabel}] ` : ''}${peak.label} | ${peak.amp.toFixed(2)}В`;
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        const textW = ctx.measureText(tagText).width;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(x - textW / 2 - 5, yPeak - 24, textW + 10, 18);
        ctx.strokeStyle = peakColor;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
        ctx.strokeRect(x - textW / 2 - 5, yPeak - 24, textW + 10, 18);

        ctx.fillStyle = peakColor;
        ctx.textAlign = 'center';
        ctx.fillText(tagText, x, yPeak - 11);
        ctx.restore();
      });
    };

    // 1. Render saved trace (reference)
    if (savedTrace.length > 0) {
      drawTraceGroup(savedTrace, 'Опорный', '#f59e0b', true);
    }

    // 2. Render CH1 peaks (preserve native peak colors: blue LSB, purple Fc, green USB, etc.)
    if (peaks1.length > 0) {
      drawTraceGroup(peaks1, inWire2 ? 'CH1' : '', null, false);
    }

    // 3. Render CH2 peaks
    if (peaks2.length > 0) {
      drawTraceGroup(peaks2, 'CH2', inWire1 ? '#00f0ff' : null, false);
    }

    // Update peaks HUD chips in modal footer
    const peaksListEl = this.container.querySelector('#modal-peaks-list');
    if (peaksListEl) {
      peaksListEl.innerHTML = peakChips.join('') || '<span style="color: var(--text-muted); font-size: 0.74rem;">Гармоники не обнаружены</span>';
    }
  }

  // Display name helpers for blocks and ports
  getNodeDisplayName(nodeId) {
    const node = this.graph.nodes.get(nodeId);
    if (!node) return 'Блок';
    const names = {
      'source': 'Источник сообщения',
      'oscillator': 'Несущая',
      'modulator': 'Модулятор',
      'filter': 'Полосовой фильтр',
      'oscilloscope': 'Осциллограф',
      'spectrograph': 'Спектрограф',
      'receiver': 'Приемник'
    };
    return names[node.type] || node.type;
  }

  getPortDisplayName(nodeId, portId) {
    const portNames = {
      'out': 'ВЫХОД',
      'rf-out': 'RF ВЫХОД',
      'filter-out': 'ВЫХОД',
      'in': 'ВХОД CH1',
      'in-2': 'ВХОД CH2',
      'mod-in-audio': 'ВХОД НЧ/БИТЫ',
      'mod-in-carrier': 'ВХОД НЕСУЩЕЙ',
      'filter-in': 'ВХОД'
    };
    return portNames[portId] || portId;
  }

  showWireContextMenu(e, wire) {
    e.preventDefault();
    e.stopPropagation();

    const menu = this.container.querySelector('#wb-context-menu');
    if (!menu) return;

    const fromName = this.getNodeDisplayName(wire.fromNode);
    const toName = this.getNodeDisplayName(wire.toNode);
    const fromPort = this.getPortDisplayName(wire.fromNode, wire.fromPort);
    const toPort = this.getPortDisplayName(wire.toNode, wire.toPort);

    menu.innerHTML = `
      <div class="context-menu-header">
        <span class="context-menu-title">Кабель сигнала</span>
        <span class="context-menu-sub">${fromName} (${fromPort}) → ${toName} (${toPort})</span>
      </div>
      <div class="context-menu-item danger" id="cm-delete-wire">
        <span>✂️</span>
        <span>Удалить этот провод</span>
      </div>
    `;

    menu.querySelector('#cm-delete-wire').addEventListener('click', (ev) => {
      ev.stopPropagation();
      this.graph.disconnect(wire.id);
      this.updateWires();
      this.hideContextMenu();
    });

    this.positionContextMenu(e.clientX, e.clientY);
  }

  showSocketContextMenu(e, nodeId, portId, sockType) {
    e.preventDefault();
    e.stopPropagation();

    const connectedWires = this.graph.wires.filter(w =>
      (w.fromNode === nodeId && w.fromPort === portId) ||
      (w.toNode === nodeId && w.toPort === portId)
    );

    if (connectedWires.length === 0) {
      this.hideContextMenu();
      return;
    }

    const menu = this.container.querySelector('#wb-context-menu');
    if (!menu) return;

    const nodeName = this.getNodeDisplayName(nodeId);
    const portName = this.getPortDisplayName(nodeId, portId);

    let itemsHtml = `
      <div class="context-menu-header">
        <span class="context-menu-title">${sockType === 'out' ? 'Выходной порт' : 'Входной порт'}</span>
        <span class="context-menu-sub">${nodeName}: ${portName} (${connectedWires.length} ${connectedWires.length === 1 ? 'провод' : 'провода'})</span>
      </div>
    `;

    connectedWires.forEach(w => {
      const isOut = w.fromNode === nodeId && w.fromPort === portId;
      const otherNodeId = isOut ? w.toNode : w.fromNode;
      const otherPortId = isOut ? w.toPort : w.fromPort;
      const otherName = this.getNodeDisplayName(otherNodeId);
      const otherPort = this.getPortDisplayName(otherNodeId, otherPortId);
      const directionDesc = isOut ? `к ${otherName} [${otherPort}]` : `от ${otherName} [${otherPort}]`;

      itemsHtml += `
        <div class="context-menu-item danger" data-cm-disconnect-wire="${w.id}">
          <span>✂️</span>
          <span>Удалить провод ${directionDesc}</span>
        </div>
      `;
    });

    if (connectedWires.length > 1) {
      itemsHtml += `
        <div class="context-menu-separator"></div>
        <div class="context-menu-item danger" id="cm-disconnect-all">
          <span>🗑️</span>
          <span>Удалить все провода (${connectedWires.length})</span>
        </div>
      `;
    }

    menu.innerHTML = itemsHtml;

    menu.querySelectorAll('[data-cm-disconnect-wire]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const wId = btn.dataset.cmDisconnectWire;
        this.graph.disconnect(wId);
        this.updateWires();
        this.hideContextMenu();
      });
    });

    const allBtn = menu.querySelector('#cm-disconnect-all');
    if (allBtn) {
      allBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.graph.disconnectPort(nodeId, portId);
        this.updateWires();
        this.hideContextMenu();
      });
    }

    this.positionContextMenu(e.clientX, e.clientY);
  }

  positionContextMenu(clientX, clientY) {
    const menu = this.container.querySelector('#wb-context-menu');
    if (!menu) return;

    menu.style.display = 'block';
    const menuRect = menu.getBoundingClientRect();
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    let posX = clientX + 4;
    let posY = clientY + 4;

    if (posX + menuRect.width > vpW - 10) {
      posX = clientX - menuRect.width - 4;
    }
    if (posY + menuRect.height > vpH - 10) {
      posY = clientY - menuRect.height - 4;
    }

    menu.style.left = `${Math.max(10, posX)}px`;
    menu.style.top = `${Math.max(10, posY)}px`;
  }

  hideContextMenu() {
    const menu = this.container.querySelector('#wb-context-menu');
    if (menu) menu.style.display = 'none';
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.escKeyHandler) document.removeEventListener('keydown', this.escKeyHandler);
    if (this.docClickHandler) document.removeEventListener('click', this.docClickHandler);
    this.stopAudio();
  }
}
