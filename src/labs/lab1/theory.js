import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Render inline LaTeX formula with error handling
 */
function m(latex) {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false
    });
  } catch (err) {
    return `<code>${latex}</code>`;
  }
}

/**
 * Render block (display) LaTeX formula with styled card container
 */
function mb(latex, customClass = '') {
  try {
    const rendered = katex.renderToString(latex, {
      throwOnError: false,
      displayMode: true
    });
    return `<div class="theory-formula-block ${customClass}">${rendered}</div>`;
  } catch (err) {
    return `<div class="theory-formula-block ${customClass}"><code>${latex}</code></div>`;
  }
}

export function renderTheory() {
  return `
    <div class="theory-wrapper">
      <!-- Introductory "For Dummies" Overview -->
      <div class="theory-analogy-card" style="border-left: 4px solid var(--accent-cyan);">
        <div class="theory-analogy-header">
          <span>💡</span>
          <span>Зачем вообще нужна модуляция? (Аналогия «Пассажир и Поезд»)</span>
        </div>
        <p class="theory-p" style="margin-bottom: 0.5rem; font-size: 0.92rem;">
          Человеческий голос и звук — это низкочастотные колебания (${m('F_m \\approx 1')} кГц). Если громко крикнуть в поле, звук затухнет уже через 100 метров. Чтобы излучить звуковую частоту напрямую в эфир в виде радиоволны, понадобилась бы антенна длиной в <strong>75 километров</strong>!
        </p>
        <p class="theory-p" style="margin-bottom: 0; font-size: 0.92rem;">
          Поэтому инженеры используют высокочастотную радиоволну — <strong>несущую</strong> (${m('F_c = 20')} кГц или сотни МГц). Она играет роль скоростного <strong>поезда-экспресса</strong>: легко летит сквозь пространство, а её антенна помещается в смартфоне. 
          <strong>Модуляция</strong> — это посадка нашего «пассажира» (звука или цифровых данных) на «поезд» несущей волны.
        </p>
      </div>

      <!-- Section 1: Analog Amplitude Modulation -->
      <div class="theory-section">
        <h2 class="theory-heading">
          1. Амплитудная модуляция (АМ): «Громкость радиоволны»
        </h2>
        
        <p class="theory-p">
          <strong>Суть на пальцах:</strong> Представьте луч мощного прожектора (несущую). Если плавно регулировать его яркость (ярче — темнее — ярче) в такт звучащей музыке, свет донесет мелодию до наблюдателя. На приемном конце фотоэлемент измерит колебания яркости и восстановит звук.
        </p>

        <p class="theory-p">
          <strong>Базовая формула АМ:</strong>
        </p>
        ${mb('s(t) = A(t) \\cdot \\cos(2\\pi F_c t)')}
        
        <div class="theory-formula-breakdown">
          <div class="breakdown-item"><strong>${m('s(t)')}</strong> — итоговый сигнал в эфире</div>
          <div class="breakdown-item"><strong>${m('F_c')}</strong> — частота радиоволны (несущей)</div>
          <div class="breakdown-item"><strong>${m('A(t)')}</strong> — амплитуда («яркость»), которая меняется синхронно с нашим звуком:</div>
        </div>

        ${mb('A(t) = A_c \\cdot \\left[ 1 + m \\cdot \\cos(2\\pi F_m t) \\right]')}

        <div style="background: rgba(0, 0, 0, 0.25); border-radius: var(--radius-sm); padding: 1rem 1.25rem; margin: 1rem 0;">
          <h4 style="color: var(--accent-cyan); font-size: 0.95rem; margin-bottom: 0.5rem;">
            Что такое глубина модуляции ${m('m')}?
          </h4>
          ${mb('m = \\frac{\\text{Амплитуда звука } (A_m)}{\\text{Амплитуда несущей } (A_c)}')}
          <ul style="margin-left: 1.5rem; color: var(--text-secondary); line-height: 1.8; font-size: 0.88rem;">
            <li><strong>${m('m < 1')} (Норма):</strong> Звук чистый и прозрачный. Огибающая волны в точности повторяет форму звуковой волны. Сигнал принимает простейший детектор из одного диода.</li>
            <li><strong>${m('m = 1')} (100% модуляция):</strong> Идеальный баланс максимальной громкости без искажений.</li>
            <li><strong>${m('m > 1')} (Перемодуляция / Хрип):</strong> Звук слишком громкий для несущей! В моменты тишины волна «схлопывается» в ноль и обрезается. В радиоприемнике слышен сильный треск и искажения.</li>
          </ul>
        </div>

        <p class="theory-p">
          <strong>Что показывает спектрограф при АМ? (Всего три пика!):</strong>
        </p>
        ${mb('\\underbrace{F_c - F_m}_{\\text{Нижняя боковая (LSB)}} \\quad \\longleftarrow \\quad \\underbrace{F_c}_{\\text{Несущая волна}} \\quad \\longrightarrow \\quad \\underbrace{F_c + F_m}_{\\text{Верхняя боковая (USB)}}')}
        <p class="theory-p" style="font-size: 0.88rem;">
          В спектре появляется сама несущая частота ${m('F_c')} и две зеркальные копии звука по бокам: ${m('F_c - F_m')} и ${m('F_c + F_m')}.
        </p>

        <p class="theory-p">
          <strong>Сколько места в эфире занимает АМ (Ширина полосы):</strong>
        </p>
        ${mb('\\Delta F_{\\text{AM}} = 2 \\cdot F_m')}
        <p class="theory-p" style="font-size: 0.88rem;">
          <em>Простой пример:</em> Если передавать голос с верхней частотой ${m('F_m = 3')} кГц, радиостанции в эфире потребуется полоса шириной ровно ${m('\\Delta F = 2 \\times 3 = 6')} кГц.
        </p>

        <!-- SSB Explanation -->
        <div style="background: rgba(0, 240, 255, 0.05); border-left: 4px solid var(--accent-cyan); border-radius: var(--radius-sm); padding: 1rem 1.25rem; margin: 1.25rem 0;">
          <h4 style="color: var(--accent-cyan); margin-bottom: 0.4rem; font-size: 0.95rem; font-weight: 700;">
            Лайфхак связистов: Однополосная модуляция (SSB / ОМ)
          </h4>
          <p class="theory-p" style="margin-bottom: 0.5rem; font-size: 0.88rem;">
            Зачем передавать две одинаковые копии звука и тратить 50% энергии передатчика на пустую несущую? Фильтром просто <strong>вырезают половину</strong>:
          </p>
          ${mb('\\Delta F_{\\text{SSB}} = F_m \\quad \\text{(полоса в 2 раза уже!)}')}
          <p class="theory-p" style="margin-bottom: 0; font-size: 0.88rem;">
            Благодаря этому передатчик SSB бьет на тысячи километров при скромной мощности. Так общаются радиолюбители, моряки и дальняя авиация.
          </p>
        </div>

        <div class="theory-workbench-tip">
          🎯 <strong>Как проверить на стенде:</strong> Подключите <em>Источник</em> $\\rightarrow$ <em>Модулятор</em> $\\rightarrow$ <em>Осциллограф</em>. Покрутите ползунок <code>Индекс модуляции m</code> от 0.3 до 1.5. На осциллографе вы наглядно увидите, как огибающая сначала идеально повторяет синусоиду, а при $m > 1$ начинает схлопываться в ноль!
        </div>
      </div>

      <!-- Section 2: Digital Shift Keying (Manipulations) -->
      <div class="theory-section">
        <h2 class="theory-heading">
          2. Цифровая модуляция (Манипуляция): «Как передавать 0 и 1»
        </h2>
        <p class="theory-p">
          Компьютер говорит на языке двоичных бит: <strong>0 и 1</strong> со скоростью ${m('R_b')} бит/с (например, 800 бит/с). 
          У синусоидальной волны есть всего три свойства, которыми можно закодировать бит: <strong>Амплитуда</strong>, <strong>Частота</strong> и <strong>Фаза</strong>.
        </p>

        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.25rem;">
          <!-- 2.1 ASK -->
          <div style="background: rgba(8, 12, 20, 0.5); padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid var(--accent-cyan); border-top: 1px solid var(--bg-card-border); border-right: 1px solid var(--bg-card-border); border-bottom: 1px solid var(--bg-card-border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h3 style="color: var(--accent-cyan); font-size: 1.1rem; font-weight: 700;">
                2.1. ASK (АМн) — «Принцип фонарика / Азбука Морзе»
              </h3>
              <span class="badge" style="background: rgba(0, 240, 255, 0.15); color: #00f0ff; font-family: var(--font-mono); font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px;">OOK</span>
            </div>
            
            <p class="theory-p">
              <strong>Правило:</strong> Передаем бит «1» — включаем радиоволну. Передаем бит «0» — выключаем волну (тишина).
            </p>

            ${mb('\\text{Бит 1} \\longrightarrow A = A_c \\quad (\\text{волна есть}), \\qquad \\text{Бит 0} \\longrightarrow A = 0 \\quad (\\text{тишина})', 'ask-block')}

            <p class="theory-p" style="font-size: 0.88rem;">
              <strong>Сколько места занимает в эфире:</strong>
            </p>
            ${mb('B_{\\text{ASK}} \\approx 2 \\cdot R_b', 'ask-block')}
            <p class="theory-p" style="font-size: 0.88rem;">
              <em>Пример:</em> При битовой скорости ${m('R_b = 800')} бит/с ширина основного спектрального лепестка составит ${m('B \\approx 2 \\times 800 = 1600')} Гц (${m('1.6')} кГц).
            </p>
            <p class="theory-p" style="font-size: 0.88rem;">
              <strong>Плюсы и минусы:</strong> Схема предельно дешевая, но очень чувствительна к помехам. Если пойдет дождь или машина отъедет дальше, радиоволна ослабнет — и приемник перепутает единицу с нулем.<br/>
              <strong>Где встречается:</strong> Брелоки автосигнализаций и шлагбаумов (433 МГц), проездные карты RFID и NFC, ИК-пульты от телевизора.
            </p>

            <div class="theory-workbench-tip">
              🎯 <strong>На стенде:</strong> Выберите режим <code>ASK</code> и введите биты <code>10110010</code>. На осциллографе вы увидите пачки радиоволн: на битах «1» волна идет, а на битах «0» — ровная горизонтальная линия!
            </div>
          </div>

          <!-- 2.2 FSK -->
          <div style="background: rgba(8, 12, 20, 0.5); padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid var(--accent-emerald); border-top: 1px solid var(--bg-card-border); border-right: 1px solid var(--bg-card-border); border-bottom: 1px solid var(--bg-card-border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h3 style="color: var(--accent-emerald); font-size: 1.1rem; font-weight: 700;">
                2.2. FSK (ЧМн) — «Принцип двух свистков»
              </h3>
              <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-family: var(--font-mono); font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px;">2-FSK</span>
            </div>

            <p class="theory-p">
              <strong>Правило:</strong> Представьте, что у вас два свистка разной тональности. Передаем бит «0» — свистим басом (пониже). Передаем бит «1» — свистим писком (повыше).
            </p>

            ${mb('\\text{Бит 0} \\longrightarrow f_0 = F_c - \\Delta F, \\qquad \\text{Бит 1} \\longrightarrow f_1 = F_c + \\Delta F', 'fsk-block')}

            <div class="theory-formula-breakdown">
              <div class="breakdown-item"><strong>${m('F_c')}</strong> — центральная несущая (например, 20 кГц)</div>
              <div class="breakdown-item"><strong>${m('\\Delta F')}</strong> — девиация (сдвиг частоты, например, 3.5 кГц)</div>
            </div>

            <p class="theory-p" style="font-size: 0.88rem;">
              <strong>Сколько места занимает в эфире (Формула Карсона):</strong>
            </p>
            ${mb('B_{\\text{FSK}} \\approx 2 \\cdot (\\Delta F + R_b)', 'fsk-block')}
            <p class="theory-p" style="font-size: 0.88rem;">
              <em>Пример:</em> Если сдвиг частоты ${m('\\Delta F = 3.5')} кГц, а скорость ${m('R_b = 0.8')} кбит/с, полоса составит ${m('B \\approx 2 \\times (3.5 + 0.8) = 8.6')} кГц.
            </p>
            <p class="theory-p" style="font-size: 0.88rem;">
              <strong>Почему FSK надежнее ASK?</strong> В FSK амплитуда волны ВСЕГДА постоянна: ${m('A = \\text{const}')}! Сигнал не выключается ни на секунду. Даже если сигнал в эфире ослабнет из-за препятствий, приемник безошибочно определит частоту.<br/>
              <strong>Где встречается:</strong> Bluetooth Low Energy (фитнес-браслеты, наушники), датчики умного дома LoRa, классические телефонные модемы, радиостанции.
            </p>

            <div class="theory-workbench-tip tip-emerald">
              🎯 <strong>На стенде:</strong> Переключите модулятор в <code>FSK</code> и посмотрите на <em>Спектрограф</em>! Вы увидите два высоких «столбика» (на частотах $f_0$ и $f_1$). Подвигайте ползунок девиации $\\Delta F$ — столбики начнут разъезжаться в стороны!
            </div>
          </div>

          <!-- 2.3 PSK -->
          <div style="background: rgba(8, 12, 20, 0.5); padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid var(--accent-purple); border-top: 1px solid var(--bg-card-border); border-right: 1px solid var(--bg-card-border); border-bottom: 1px solid var(--bg-card-border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h3 style="color: var(--accent-purple); font-size: 1.1rem; font-weight: 700;">
                2.3. PSK (ФМн) — «Принцип переворота волны»
              </h3>
              <span class="badge" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; font-family: var(--font-mono); font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px;">BPSK</span>
            </div>

            <p class="theory-p">
              <strong>Правило:</strong> Частота и амплитуда вообще не меняются! Но когда передается бит «1», волна <strong>мгновенно переворачивается вверх ногами</strong> (скачок фазы на ${m('180^\\circ')} или ${m('\\pi')} радиан).
            </p>

            ${mb('\\text{Бит 0} \\longrightarrow +A_c \\cos(2\\pi F_c t), \\qquad \\text{Бит 1} \\longrightarrow -A_c \\cos(2\\pi F_c t)', 'psk-block')}

            <p class="theory-p" style="font-size: 0.88rem;">
              Компактно математики записывают это как умножение на знак плюс или минус:
            </p>
            ${mb('s_{\\text{BPSK}}(t) = (\\pm 1) \\cdot A_c \\cos(2\\pi F_c t)', 'psk-block')}

            <p class="theory-p" style="font-size: 0.88rem;">
              <strong>Сколько места занимает в эфире:</strong>
            </p>
            ${mb('B_{\\text{BPSK}} \\approx 2 \\cdot R_b', 'psk-block')}

            <p class="theory-p" style="font-size: 0.88rem;">
              <strong>Почему BPSK — мировой чемпион по надежности?</strong> Разница между плюс-волной ($+1$) и перевернутой минус-волной ($-1$) — максимально возможная в природе (дистанция равна 2). Перевернутую синусоиду невозможно перепутать с прямой даже среди сильнейших шумов космоса!<br/>
              <strong>Где встречается:</strong> Спутники GPS и ГЛОНАСС, связь NASA с марсоходами на Марсе, Wi-Fi и сети 4G/5G (служебные сигналы синхронизации).
            </p>

            <div class="theory-workbench-tip tip-purple">
              🎯 <strong>На стенде:</strong> В режиме <code>PSK</code> откройте осциллограф на весь экран (двойным кликом). Найдите границу, где бит 0 сменяется битом 1: синусоида в этой точке резко ломается и разворачивается в обратную сторону!
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Comparative Analysis Table -->
      <div class="theory-section">
        <h2 class="theory-heading">
          3. Шпаргалка: Быстрое сравнение всех типов модуляции
        </h2>
        <div style="overflow-x: auto;">
          <table class="theory-code-table">
            <thead>
              <tr>
                <th>Тип</th>
                <th>Что меняем в волне?</th>
                <th>Аналогия из жизни</th>
                <th>Сколько места в эфире?</th>
                <th>Помехозащита</th>
                <th>Где применяется</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>AM (DSB)</strong></td>
                <td>Амплитуду ${m('A(t)')}</td>
                <td>Громкоговоритель</td>
                <td>${m('\\Delta F = 2 \\cdot F_m')}</td>
                <td>Слабая (хрипит при грозе)</td>
                <td>Радиовещание, авиация</td>
              </tr>
              <tr>
                <td><strong>SSB</strong></td>
                <td>Одну боковую полосу</td>
                <td>Экономный шепот</td>
                <td>${m('\\Delta F = F_m')} (в 2 раза уже!)</td>
                <td>Средняя</td>
                <td>Морская связь, КВ-радиолюбители</td>
              </tr>
              <tr>
                <td><strong>ASK</strong></td>
                <td>Вкл / Выкл амплитуду</td>
                <td>Мигающий фонарик</td>
                <td>${m('B \\approx 2 \\cdot R_b')}</td>
                <td>Слабая</td>
                <td>Шлагбаумы, NFC, брелоки авто</td>
              </tr>
              <tr>
                <td><strong>FSK</strong></td>
                <td>Частоту (${m('f_0')} и ${m('f_1')})</td>
                <td>Два свистка разного тона</td>
                <td>${m('B \\approx 2(\\Delta F + R_b)')}</td>
                <td>Хорошая (${m('A = \\text{const}')})</td>
                <td>Bluetooth, LoRa, модемы</td>
              </tr>
              <tr>
                <td><strong>PSK (BPSK)</strong></td>
                <td>Фазу (${m('0^\\circ')} или ${m('180^\\circ')})</td>
                <td>Переворот волны с ног на голову</td>
                <td>${m('B \\approx 2 \\cdot R_b')}</td>
                <td><strong>Максимальная в мире</strong></td>
                <td>GPS, спутники, Wi-Fi, 4G/5G</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 4: Circuit Block Architecture -->
      <div class="theory-section">
        <h2 class="theory-heading">
          4. Из каких «кирпичиков» строится тракт связи
        </h2>
        <p class="theory-p">
          В виртуальной лаборатории вы собираете полноценный радиоприемопередатчик из 5 ключевых узлов:
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
          <div style="background: rgba(8, 12, 20, 0.4); padding: 1.15rem; border-radius: var(--radius-md); border: 1px solid var(--bg-card-border);">
            <h4 style="color: var(--accent-cyan); margin-bottom: 0.4rem;">1. Источник (Source)</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              <strong>«Кто говорит»:</strong> Ваш голос, чистый тон ${m('F_m')} или генератор двоичных бит ${m('d(t)')}.
            </p>
          </div>
          <div style="background: rgba(8, 12, 20, 0.4); padding: 1.15rem; border-radius: var(--radius-md); border: 1px solid var(--bg-card-border);">
            <h4 style="color: var(--accent-purple); margin-bottom: 0.4rem;">2. Несущая (Oscillator)</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              <strong>«Поезд»:</strong> Высокочастотный кварцевый генератор рабочей частоты ${m('F_c')} (20 кГц), на которую садится сигнал.
            </p>
          </div>
          <div style="background: rgba(8, 12, 20, 0.4); padding: 1.15rem; border-radius: var(--radius-md); border: 1px solid var(--bg-card-border);">
            <h4 style="color: var(--accent-cyan); margin-bottom: 0.4rem;">3. Модулятор (Modulator)</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              <strong>«Станция посадки»:</strong> Перемножает или переключает волну, накладывая звук или биты на несущую.
            </p>
          </div>
          <div style="background: rgba(8, 12, 20, 0.4); padding: 1.15rem; border-radius: var(--radius-md); border: 1px solid var(--bg-card-border);">
            <h4 style="color: var(--accent-emerald); margin-bottom: 0.4rem;">4. Фильтр эфира (Filter)</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              <strong>«Туннель с помехами»:</strong> Ограничивает полосу пропускания канала и подмешивает шум эфира.
            </p>
          </div>
          <div style="background: rgba(8, 12, 20, 0.4); padding: 1.15rem; border-radius: var(--radius-md); border: 1px solid var(--bg-card-border);">
            <h4 style="color: #f59e0b; margin-bottom: 0.4rem;">5. Приемник / Детектор</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              <strong>«Динамик слушателя»:</strong> Снимает модуляцию и восстанавливает исходный чистый звук или биты.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}
