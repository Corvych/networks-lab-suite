import { CircuitWorkbench } from './workbench.js';
import { renderTheory } from './theory.js';
import { state } from '../../core/state.js';
import { icons } from '../../core/icons.js';

export function createLab1() {
  let workbench = null;

  function render(container) {
    container.innerHTML = `
      <div class="lab-shell">
        <!-- Lab Top Bar -->
        <div class="lab-shell-header">
          <div>
            <div class="lab-shell-breadcrumbs">
              <button class="breadcrumb-back" id="btn-back-catalog">
                ${icons.arrowLeft} Каталог лабораторных
              </button>
              <span class="breadcrumb-sep">/</span>
              <span class="breadcrumb-current">Работа №1: Модуляция (AM/SSB) и манипуляции (ASK/FSK/PSK)</span>
            </div>
            <h1 class="lab-shell-title">
              Лабораторная работа №1: Исследование аналоговой модуляции (AM, DSB, SSB) и цифровых манипуляций (ASK, FSK, PSK)
            </h1>
          </div>

          <div class="lab-shell-actions">
            <button class="btn-secondary" id="btn-toggle-complete">
              ${icons.check} <span id="complete-btn-text">${state.isLabCompleted('lab-1') ? 'Выполнена ✓' : 'Отметить выполнение'}</span>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="lab-nav-tabs">
          <button class="lab-tab-btn" data-tab="theory">
            ${icons.book} 1. Теоретические основы
          </button>
          <button class="lab-tab-btn active" data-tab="sim">
            ${icons.waveform} 2. Схемотехнический конструктор и приборы
          </button>
          <button class="lab-tab-btn" data-tab="tasks">
            ${icons.target} 3. Задания и самоконтроль
          </button>
          <button class="lab-tab-btn" data-tab="report">
            ${icons.fileText} 4. Отчет студента
          </button>
        </div>

        <!-- Tab 1: Theory -->
        <div class="lab-tab-pane" id="pane-theory">
          ${renderTheory()}
        </div>

        <!-- Tab 2: Full EDA Workbench & Multi-Instrument Canvas -->
        <div class="lab-tab-pane active" id="pane-sim">
          <div id="workbench-mount-root"></div>
        </div>

        <!-- Tab 3: Tasks & Validation -->
        <div class="lab-tab-pane" id="pane-tasks">
          <div class="tasks-container">
            <div class="task-card">
              <div class="task-header">
                <span class="task-number-pill">Задание 1</span>
                <span style="font-size: 0.8rem; color: var(--accent-cyan);">Теория и спектр DSB</span>
              </div>
              <div class="task-question">
                Какое количество боковых полос частот формируется при двухполосной модуляции DSB-SC по сравнению с SSB?
              </div>
              <div class="quiz-options" data-task="1">
                <label class="quiz-option-label">
                  <input type="radio" name="am-task1" value="a" />
                  <span>В DSB формируется две полосы (USB и LSB), требуя полосу пропускания 2·Fm, а в SSB — только одна полоса шириной Fm.</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task1" value="b" />
                  <span>В DSB полоса пропускания в 2 раза меньше, чем в SSB.</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task1" value="c" />
                  <span>DSB и SSB имеют одинаковую ширину спектра 4·Fm.</span>
                </label>
              </div>
              <div class="quiz-feedback" id="feedback-am-task-1"></div>
            </div>

            <div class="task-card">
              <div class="task-header">
                <span class="task-number-pill">Задание 2</span>
                <span style="font-size: 0.8rem; color: var(--accent-purple);">Несущая</span>
              </div>
              <div class="task-question">
                При несущей частоте Fc = 20 кГц и тоне сообщения Fm = 1.5 кГц, на каких частотах расположатся боковые полосы LSB и USB?
              </div>
              <div class="quiz-options" data-task="2">
                <label class="quiz-option-label">
                  <input type="radio" name="am-task2" value="a" />
                  <span>LSB = 21.5 кГц и USB = 18.5 кГц</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task2" value="b" />
                  <span>LSB = 18.5 кГц (Fc - Fm) и USB = 21.5 кГц (Fc + Fm)</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task2" value="c" />
                  <span>Только одна частота 20 кГц</span>
                </label>
              </div>
              <div class="quiz-feedback" id="feedback-am-task-2"></div>
            </div>

            <div class="task-card">
              <div class="task-header">
                <span class="task-number-pill">Задание 3</span>
                <span style="font-size: 0.8rem; color: var(--accent-emerald);">Полоса пропускания</span>
              </div>
              <div class="task-question">
                Что произойдет с демодулированным аудиосигналом, если ширина полосы полосового фильтра ΔF станет меньше частоты информационного сигнала Fm?
              </div>
              <div class="quiz-options" data-task="3">
                <label class="quiz-option-label">
                  <input type="radio" name="am-task3" value="a" />
                  <span>Увеличится мощность сигнала</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task3" value="b" />
                  <span>Боковые информационные полосы будут отфильтрованы (подавлены), что приведет к исчезновению сообщения на выходе приемника</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task3" value="c" />
                  <span>Частота сообщения автоматически удвоится</span>
                </label>
              </div>
              <div class="quiz-feedback" id="feedback-am-task-3"></div>
            </div>

            <div class="task-card">
              <div class="task-header">
                <span class="task-number-pill">Задание 4</span>
                <span style="font-size: 0.8rem; color: var(--accent-cyan);">Амплитудная манипуляция (ASK)</span>
              </div>
              <div class="task-question">
                В чем заключается физический принцип амплитудной манипуляции в режиме OOK (On-Off Keying) при передаче двоичных данных?
              </div>
              <div class="quiz-options" data-task="4">
                <label class="quiz-option-label">
                  <input type="radio" name="am-task4" value="a" />
                  <span>Логическая «1» передается высокочастотной посылкой несущей, а логический «0» — паузой (отсутствием несущей либо ее подавленным уровнем).</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task4" value="b" />
                  <span>Частота сигнала несущей увеличивается вдвое при каждом нулевом бите.</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task4" value="c" />
                  <span>Фаза сигнала скачкообразно меняется на 90 градусов.</span>
                </label>
              </div>
              <div class="quiz-feedback" id="feedback-am-task-4"></div>
            </div>

            <div class="task-card">
              <div class="task-header">
                <span class="task-number-pill">Задание 5</span>
                <span style="font-size: 0.8rem; color: var(--accent-emerald);">Частотная манипуляция (2-FSK)</span>
              </div>
              <div class="task-question">
                При несущей частоте Fc = 20 кГц и девиации частоты ΔF = 3.5 кГц, на каких частотах на спектрографе зафиксируются пики символов «0» и «1»?
              </div>
              <div class="quiz-options" data-task="5">
                <label class="quiz-option-label">
                  <input type="radio" name="am-task5" value="a" />
                  <span>f₀ = 16.5 кГц (Fc - ΔF) для символа «0» и f₁ = 23.5 кГц (Fc + ΔF) для символа «1».</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task5" value="b" />
                  <span>Только один пик на частоте 20.0 кГц с удвоенной амплитудой.</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task5" value="c" />
                  <span>На частотах 3.5 кГц и 7.0 кГц в звуковом диапазоне.</span>
                </label>
              </div>
              <div class="quiz-feedback" id="feedback-am-task-5"></div>
            </div>

            <div class="task-card">
              <div class="task-header">
                <span class="task-number-pill">Задание 6</span>
                <span style="font-size: 0.8rem; color: var(--accent-purple);">Фазовая манипуляция (BPSK)</span>
              </div>
              <div class="task-question">
                Какое фундаментальное преимущество обеспечивает фазовая манипуляция BPSK по сравнению с амплитудной манипуляцией ASK при одинаковой пиковой мощности передатчика?
              </div>
              <div class="quiz-options" data-task="6">
                <label class="quiz-option-label">
                  <input type="radio" name="am-task6" value="a" />
                  <span>BPSK излучает постоянную мощность в каждом бите и обеспечивает максимальную помехоустойчивость (минимальный BER) при заданном отношении сигнал/шум.</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task6" value="b" />
                  <span>BPSK не требует синхронизации несущей частоты и опорной фазы в приемнике.</span>
                </label>
                <label class="quiz-option-label">
                  <input type="radio" name="am-task6" value="c" />
                  <span>BPSK полностью устраняет необходимость в полосовом фильтре канала связи.</span>
                </label>
              </div>
              <div class="quiz-feedback" id="feedback-am-task-6"></div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Student Report -->
        <div class="lab-tab-pane" id="pane-report">
          <div class="report-generator-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <div>
                <h2 style="font-size: 1.3rem; font-weight: 800;">Отчет по лабораторной работе</h2>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">Результаты схемотехнического синтеза тракта и спектрального анализа</p>
              </div>
              <button class="btn-primary" id="btn-print-report">
                ${icons.download} Распечатать / Экспорт в PDF
              </button>
            </div>

            <div class="report-preview-sheet" id="printable-report">
              <div class="report-sheet-header">
                <h2>ОТЧЕТ ПО ЛАБОРАТОРНОЙ РАБОТЕ №1</h2>
                <p>Курс: Сети и телекоммуникации</p>
                <p>Тема: Модуляция (AM, DSB, SSB) и цифровые манипуляции (ASK, FSK, PSK)</p>
              </div>

              <div class="report-sheet-section">
                <strong>Студент:</strong> <span id="report-student-name">${state.get('studentName')}</span><br/>
                <strong>Дата эксперимента:</strong> <span id="report-date">${new Date().toLocaleDateString('ru-RU')}</span><br/>
                <strong>Статус сборки схемы:</strong> <span id="report-circuit-status" style="color: #059669; font-weight: bold;">Собрана</span>
              </div>

              <div class="report-sheet-section">
                <h3>1. Установленные параметры схемы</h3>
                <p>Источник сообщения: <strong id="rep-source-type">Аудио (1000 Гц)</strong></p>
                <p>Несущая частота Fc: <strong id="rep-fc">20.0 кГц</strong></p>
                <p>Исследованный вид модуляции/манипуляции: <strong id="rep-mod-mode">DSB-FC (AM с несущей)</strong></p>
                <p>Параметр модуляции (m / ΔF / OOK): <strong id="rep-mod-index">0.80</strong></p>
                <p>Полоса пропускания фильтра ΔF: <strong id="rep-bw">6.0 кГц</strong></p>
              </div>

              <div class="report-sheet-section">
                <h3>2. Результаты спектрального анализа</h3>
                <div id="rep-spectral-findings"></div>
              </div>

              <div class="report-sheet-section">
                <h3>3. Выводы по работе</h3>
                <p>
                  В ходе работы на схемотехническом конструкторе смоделирован универсальный тракт передачи непрерывных и дискретных сообщений. 
                  Исследованы аналоговые режимы (DSB-FC, DSB-SC, SSB) и ключевые методы цифровой манипуляции (ASK, FSK, PSK).
                  Установлено, что фазовая манипуляция (BPSK) обеспечивает максимальную помехоустойчивость и постоянство мощности передатчика; 
                  частотная манипуляция (FSK) устойчива к амплитудным помехам канала и использует разнесение частот посылок f₀ и f₁; 
                  амплитудная манипуляция (ASK/OOK) наиболее проста в схемотехнической реализации, но чувствительна к шумам и затуханиям в линии связи.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mount Circuit Workbench
    const wbMount = container.querySelector('#workbench-mount-root');
    workbench = new CircuitWorkbench(wbMount);

    // Back to catalog
    container.querySelector('#btn-back-catalog').addEventListener('click', () => {
      if (workbench) workbench.destroy();
      window.location.hash = '#/';
    });

    // Complete button
    const completeBtn = container.querySelector('#btn-toggle-complete');
    const completeText = container.querySelector('#complete-btn-text');
    completeBtn.addEventListener('click', () => {
      const isDone = state.toggleLabCompleted('lab-1');
      completeText.textContent = isDone ? 'Выполнена ✓' : 'Отметить выполнение';
    });

    // Tabs switching
    const tabButtons = container.querySelectorAll('.lab-tab-btn');
    const tabPanes = {
      theory: container.querySelector('#pane-theory'),
      sim: container.querySelector('#pane-sim'),
      tasks: container.querySelector('#pane-tasks'),
      report: container.querySelector('#pane-report')
    };

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        Object.keys(tabPanes).forEach(k => {
          tabPanes[k].classList.remove('active');
        });
        tabPanes[target].classList.add('active');

        if (target !== 'sim' && workbench && workbench.isFullscreen) {
          workbench.exitFullscreen();
        }

        if (target === 'sim') {
          setTimeout(() => {
            if (workbench) {
              workbench.updateTransform();
              workbench.updateWires();
            }
          }, 50);
        } else if (target === 'report') {
          const sourceNode = [...workbench.graph.nodes.values()].find(n => n.type === 'source');
          const oscNode = [...workbench.graph.nodes.values()].find(n => n.type === 'oscillator');
          const modNode = [...workbench.graph.nodes.values()].find(n => n.type === 'modulator');
          const filterNode = [...workbench.graph.nodes.values()].find(n => n.type === 'filter');

          const studentName = state.get('studentName');
          container.querySelector('#report-student-name').textContent = studentName;

          if (oscNode) container.querySelector('#rep-fc').textContent = `${(oscNode.params.fc / 1000).toFixed(1)} кГц`;

          const mode = modNode ? (modNode.params.mode || 'dsb-fc') : 'dsb-fc';
          const modeLabels = {
            'dsb-fc': 'DSB-FC (AM с несущей)',
            'dsb-sc': 'DSB-SC (Балансная AM)',
            'ssb-usb': 'SSB-USB (Верхняя боковая)',
            'ssb-lsb': 'SSB-LSB (Нижняя боковая)',
            'ask': 'АМн / ASK (Амплитудная манипуляция)',
            'fsk': 'ЧМн / FSK (Частотная манипуляция)',
            'psk': 'ФМн / PSK (Фазовая манипуляция BPSK)'
          };

          if (modNode) {
            container.querySelector('#rep-mod-mode').textContent = modeLabels[mode] || mode.toUpperCase();
            if (mode === 'dsb-fc') {
              container.querySelector('#rep-mod-index').textContent = `m = ${(modNode.params.modIndex || 0.8).toFixed(2)}`;
            } else if (mode === 'ask') {
              container.querySelector('#rep-mod-index').textContent = `OOK (уровень нуля: ${Math.round((modNode.params.askLowRatio !== undefined ? modNode.params.askLowRatio : 0.05) * 100)}%)`;
            } else if (mode === 'fsk') {
              container.querySelector('#rep-mod-index').textContent = `ΔF = ${(((modNode.params.fskDeltaF || 3000)) / 1000).toFixed(1)} кГц`;
            } else if (mode === 'psk') {
              container.querySelector('#rep-mod-index').textContent = 'Δφ = 180° (π радиан)';
            } else {
              container.querySelector('#rep-mod-index').textContent = '— (подавленная несущая)';
            }
          }

          if (sourceNode) {
            if (sourceNode.params.sourceType === 'digital_bits') {
              container.querySelector('#rep-source-type').textContent = `Битовый поток "${sourceNode.params.bitPattern || '10110010'}" (${sourceNode.params.bitRate || 800} бит/с)`;
            } else {
              container.querySelector('#rep-source-type').textContent = `Аналоговый тон (${sourceNode.params.fm || 1000} Гц)`;
            }
          }

          if (filterNode) container.querySelector('#rep-bw').textContent = `${((filterNode.params.filterBandwidth || 6000) / 1000).toFixed(1)} кГц`;

          const fc = oscNode ? oscNode.params.fc / 1000 : 20.0;
          const fm = sourceNode ? sourceNode.params.fm / 1000 : 1.0;
          const bitRate = sourceNode ? (sourceNode.params.bitRate || 800) : 800;

          let findingsHtml = '';
          if (mode === 'ask') {
            findingsHtml = `
              <ul>
                <li>Несущая частота Fc: <strong>${fc.toFixed(1)} кГц</strong> (сохраняется в спектре)</li>
                <li>Боковые спектральные лепестки: <strong>${(fc - bitRate / 1000).toFixed(2)} кГц</strong> и <strong>${(fc + bitRate / 1000).toFixed(2)} кГц</strong> (шаг равен битовой скорости Rb = ${bitRate} Бод)</li>
                <li>Ширина основного лепестка спектра 2·Rb: <strong>${((2 * bitRate) / 1000).toFixed(2)} кГц</strong></li>
                <li>Формирование символов: логическая «1» — посылка несущей, логический «0» — пауза (OOK)</li>
                <li>Смонтировано блоков: <strong>${workbench.graph.nodes.size}</strong> | Активных соединений: <strong>${workbench.graph.wires.length}</strong></li>
              </ul>
            `;
          } else if (mode === 'fsk') {
            const deltaF = (modNode ? (modNode.params.fskDeltaF || 3000) : 3000) / 1000;
            findingsHtml = `
              <ul>
                <li>Частота символа «0» (f₀ = Fc - ΔF): <strong>${(fc - deltaF).toFixed(1)} кГц</strong></li>
                <li>Частота символа «1» (f₁ = Fc + ΔF): <strong>${(fc + deltaF).toFixed(1)} кГц</strong></li>
                <li>Частотный разнос посылок 2·ΔF: <strong>${(2 * deltaF).toFixed(1)} кГц</strong></li>
                <li>Ширина полосы Карсона: <strong>${(2 * (deltaF + bitRate / 1000)).toFixed(1)} кГц</strong></li>
                <li>Огибающая сигнала: <strong>строго постоянная (const)</strong>, обеспечена устойчивость к амплитудным затуханиям</li>
                <li>Смонтировано блоков: <strong>${workbench.graph.nodes.size}</strong> | Активных соединений: <strong>${workbench.graph.wires.length}</strong></li>
              </ul>
            `;
          } else if (mode === 'psk') {
            findingsHtml = `
              <ul>
                <li>Несущая частота Fc: <strong>${fc.toFixed(1)} кГц</strong> (подавлена при симметричном потоке бит)</li>
                <li>Фазовый скачок на границах битов: <strong>180° (π радиан)</strong></li>
                <li>Ширина спектра основного лепестка 2·Rb: <strong>${((2 * bitRate) / 1000).toFixed(2)} кГц</strong></li>
                <li>Помехоустойчивость: <strong>максимальная среди двоичных систем передачи данных (эталон BER)</strong></li>
                <li>Смонтировано блоков: <strong>${workbench.graph.nodes.size}</strong> | Активных соединений: <strong>${workbench.graph.wires.length}</strong></li>
              </ul>
            `;
          } else {
            findingsHtml = `
              <ul>
                <li>Частота несущего колебания Fc: <strong>${fc.toFixed(1)} кГц</strong> (${mode === 'dsb-fc' ? 'Присутствует в спектре' : 'Подавлена'})</li>
                <li>Нижняя боковая частота LSB (Fc - Fm): <strong>${(fc - fm).toFixed(1)} кГц</strong> (${mode === 'ssb-usb' ? 'Подавлена' : 'Активна'})</li>
                <li>Верхняя боковая частота USB (Fc + Fm): <strong>${(fc + fm).toFixed(1)} кГц</strong> (${mode === 'ssb-lsb' ? 'Подавлена' : 'Активна'})</li>
                <li>Фактическая ширина спектра сигнала: <strong>${mode.startsWith('ssb') ? fm.toFixed(1) : (2 * fm).toFixed(1)} кГц</strong></li>
                <li>Смонтировано блоков: <strong>${workbench.graph.nodes.size}</strong> | Активных соединений: <strong>${workbench.graph.wires.length}</strong></li>
              </ul>
            `;
          }

          container.querySelector('#rep-spectral-findings').innerHTML = findingsHtml;
        }
      });
    });

    setupQuiz(container);

    container.querySelector('#btn-print-report').addEventListener('click', () => {
      window.print();
    });
  }

  function setupQuiz(container) {
    const answers = { 1: 'a', 2: 'b', 3: 'b', 4: 'a', 5: 'a', 6: 'a' };
    const explanations = {
      1: 'Верно! В режиме DSB-SC передаются обе боковые полосы (LSB и USB), занимая полосу 2·Fm. В SSB передается только одна боковая, сокращая требуемую полосу частот ровно в 2 раза.',
      2: 'Правильно! Нижняя боковая полоса LSB расположена на частоте Fc - Fm = 20 - 1.5 = 18.5 кГц, а верхняя боковая USB — на частоте Fc + Fm = 20 + 1.5 = 21.5 кГц.',
      3: 'Именно так! Если полоса фильтра канала ΔF станет уже информационного сигнала сообщения, боковые частоты срежутся фильтром, и демодулятор не сможет восстановить аудиосообщение.',
      4: 'Абсолютно точно! При OOK логическая единица «1» модулирует несущую максимальной амплитудой Ac, а логический ноль «0» выключает несущую (или снижает ее амплитуду почти до нуля).',
      5: 'Правильно! Частоты посылок разнесены симметрично относительно несущей: f₀ = 20 - 3.5 = 16.5 кГц («0»), f₁ = 20 + 3.5 = 23.5 кГц («1»).',
      6: 'Верно! BPSK обладает наивысшей энергетической эффективностью и помехоустойчивостью, так как фазовые созвездия (0° и 180°) максимально разнесены в евклидовом пространстве сигналов.'
    };

    [1, 2, 3, 4, 5, 6].forEach(qNum => {
      const radios = container.querySelectorAll(`input[name="am-task${qNum}"]`);
      const feedback = container.querySelector(`#feedback-am-task-${qNum}`);

      radios.forEach(radio => {
        radio.addEventListener('change', () => {
          if (radio.value === answers[qNum]) {
            feedback.className = 'quiz-feedback correct';
            feedback.textContent = explanations[qNum];
          } else {
            feedback.className = 'quiz-feedback incorrect';
            feedback.textContent = 'Неверно. Проверьте соединения конструктора, спектрограф или ознакомьтесь с теорией.';
          }
        });
      });
    });
  }

  return { render };
}
