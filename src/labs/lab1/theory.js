export function renderTheory() {
  return `
    <div class="theory-wrapper">
      <!-- Section 1: Analog Amplitude Modulation -->
      <div class="theory-section">
        <h2 class="theory-heading">
          1. Физические основы амплитудной модуляции (AM, DSB, SSB)
        </h2>
        <p class="theory-p">
          <strong>Амплитудная модуляция (АМ / AM)</strong> — процесс изменения амплитуды высокочастотного несущего колебания (несущей) по закону низкочастотного непрерывного информационного сигнала (сообщения: речь, аудиотон, видео).
        </p>
        <p class="theory-p">
          Пусть модулирующий аналоговый сигнал: <code>s<sub>m</sub>(t) = A<sub>m</sub> cos(2π F<sub>m</sub> t)</code>,<br/>
          а несущее высокочастотное колебание: <code>c(t) = A<sub>c</sub> cos(2π F<sub>c</sub> t)</code>, где <code>F<sub>c</sub> ≫ F<sub>m</sub></code>.
        </p>
        <p class="theory-p">
          Тогда амплитудно-модулированный сигнал с несущей (<strong>DSB-FC</strong> — Double Sideband Full Carrier) описывается выражением:
        </p>
        <div style="background: rgba(8, 12, 20, 0.6); padding: 1rem 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--bg-card-border); font-family: var(--font-mono); font-size: 1rem; color: var(--accent-cyan); margin-bottom: 1.25rem;">
          s<sub>AM</sub>(t) = A<sub>c</sub> [1 + m · cos(2π F<sub>m</sub> t)] · cos(2π F<sub>c</sub> t)
        </div>
        <p class="theory-p">
          где <strong>m = A<sub>m</sub> / A<sub>c</sub></strong> — <em>коэффициент глубины модуляции</em> (индекс модуляции):
        </p>
        <ul style="margin-left: 1.5rem; color: var(--text-secondary); line-height: 1.8; margin-bottom: 1.5rem;">
          <li><strong>m &lt; 1 (недомодуляция):</strong> огибающая точно повторяет форму сообщения; сигнал легко детектируется простейшим диодным пиковым детектором огибающей.</li>
          <li><strong>m = 1 (100% модуляция):</strong> предельный случай максимальной мощности информационных боковых полос без искажения огибающей.</li>
          <li><strong>m &gt; 1 (перемодуляция):</strong> искажение формы («срез» огибающей в нуле) со скачком фазы на 180°, появление паразитных гармоник и расширение занимаемой полосы частот.</li>
        </ul>
      </div>

      <!-- Section 2: Digital Shift Keying (Manipulations) -->
      <div class="theory-section">
        <h2 class="theory-heading">
          2. Дискретные манипуляции (Цифровая модуляция: ASK, FSK, PSK)
        </h2>
        <p class="theory-p">
          В современных цифровых сетях и телекоммуникациях для передачи двоичных данных <code>d(t) ∈ {0, 1}</code> с битовой скоростью <code>R<sub>b</sub></code> (бит/с) используется <strong>дискретная модуляция (манипуляция, Shift Keying)</strong>. При манипуляции один из параметров несущего колебания — амплитуда, частота или начальная фаза — скачкообразно изменяется в моменты смены битов.
        </p>

        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.25rem;">
          <!-- 2.1 ASK -->
          <div style="background: rgba(8, 12, 20, 0.5); padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid var(--accent-cyan); border-top: 1px solid var(--bg-card-border); border-right: 1px solid var(--bg-card-border); border-bottom: 1px solid var(--bg-card-border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h3 style="color: var(--accent-cyan); font-size: 1.1rem; font-weight: 700;">
                Амплитудная манипуляция (АМн / ASK — Amplitude Shift Keying)
              </h3>
              <span class="badge" style="background: rgba(0, 240, 255, 0.15); color: #00f0ff; font-family: var(--font-mono); font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px;">OOK / 2-ASK</span>
            </div>
            <p class="theory-p">
              При амплитудной манипуляции информационный бит определяет амплитуду несущего гармонического колебания. В простейшем и наиболее распространенном случае <strong>OOK (On-Off Keying — манипуляция включением/выключением)</strong> передача логической единицы «1» осуществляется посылкой несущей максимальной амплитуды <code>A<sub>c</sub></code>, а логического нуля «0» — полным отключением несущей или излучением посылки минимального уровня <code>k · A<sub>c</sub></code>:
            </p>
            <div style="background: rgba(0, 0, 0, 0.4); padding: 0.75rem 1.25rem; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.95rem; color: #38bdf8; margin: 0.75rem 0;">
              s<sub>ASK</sub>(t) = d(t) · A<sub>c</sub> · cos(2π F<sub>c</sub> t)
            </div>
            <p class="theory-p" style="font-size: 0.88rem;">
              <strong>Спектр ASK:</strong> Представляет собой спектр несущей частоты <code>F<sub>c</sub></code> с боковыми лепестками функции sinc(f), ширина главного лепестка по первым нулям составляет <code>B ≈ 2 · R<sub>b</sub></code>.
              <br/>
              <strong>Применение:</strong> Простейшие радиометки RFID, бесконтактные смарт-карты, NFC, брелоки автосигнализаций (433/868 МГц), оптические волоконные линии связи (где лазер включается и выключается).
            </p>
          </div>

          <!-- 2.2 FSK -->
          <div style="background: rgba(8, 12, 20, 0.5); padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid var(--accent-emerald); border-top: 1px solid var(--bg-card-border); border-right: 1px solid var(--bg-card-border); border-bottom: 1px solid var(--bg-card-border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h3 style="color: var(--accent-emerald); font-size: 1.1rem; font-weight: 700;">
                Частотная манипуляция (ЧМн / FSK — Frequency Shift Keying)
              </h3>
              <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-family: var(--font-mono); font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px;">2-FSK / BFSK</span>
            </div>
            <p class="theory-p">
              При частотной манипуляции амплитуда колебания остается постоянной (<code>A(t) = A<sub>c</sub> = const</code>), а частота несущей переключается между двумя дискретными значениями в зависимости от передаваемого бита:
            </p>
            <ul style="margin-left: 1.5rem; color: var(--text-secondary); line-height: 1.8; margin-bottom: 0.75rem; font-size: 0.9rem;">
              <li>Символ «0» (Space): частота <code>f<sub>0</sub> = F<sub>c</sub> - ΔF</code></li>
              <li>Символ «1» (Mark): частота <code>f<sub>1</sub> = F<sub>c</sub> + ΔF</code></li>
            </ul>
            <p class="theory-p" style="font-size: 0.88rem;">
              где <strong>ΔF</strong> — <em>девиация частоты</em> (частотный сдвиг от номинальной несущей гетеродина).
            </p>
            <div style="background: rgba(0, 0, 0, 0.4); padding: 0.75rem 1.25rem; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.95rem; color: #34d399; margin: 0.75rem 0;">
              s<sub>FSK</sub>(t) = A<sub>c</sub> · cos[2π (F<sub>c</sub> + (2·d(t) - 1)·ΔF) t]
            </div>
            <p class="theory-p" style="font-size: 0.88rem;">
              <strong>Спектр FSK:</strong> На анализаторе спектра четко наблюдаются два выраженных энергетических пика на частотах <code>f<sub>0</sub></code> и <code>f<sub>1</sub></code>. Ширина спектра по правилу Карсона: <code>B ≈ 2 · (ΔF + R<sub>b</sub>)</code>.
              <br/>
              <strong>Преимущества:</strong> Постоянная огибающая позволяет использовать энергоэффективные нелинейные усилители мощности класса С без искажений; высокая помехоустойчивость к амплитудным шумам и затуханиям.
              <br/>
              <strong>Применение:</strong> Телефонные модемы (Bell 103/202, V.21/V.23), промышленная телеметрия HART, передатчики Caller ID, радиоканалы Bluetooth LE (GFSK), системы учета энергоресурсов LoRa/FSK.
            </p>
          </div>

          <!-- 2.3 PSK -->
          <div style="background: rgba(8, 12, 20, 0.5); padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid var(--accent-purple); border-top: 1px solid var(--bg-card-border); border-right: 1px solid var(--bg-card-border); border-bottom: 1px solid var(--bg-card-border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h3 style="color: var(--accent-purple); font-size: 1.1rem; font-weight: 700;">
                Фазовая манипуляция (ФМн / PSK — Phase Shift Keying)
              </h3>
              <span class="badge" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; font-family: var(--font-mono); font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px;">BPSK / 2-PSK</span>
            </div>
            <p class="theory-p">
              При двоичной фазовой манипуляции (<strong>BPSK — Binary PSK</strong>) амплитуда и частота несущей неизменны, а начальная фаза колебания скачкообразно изменяется на <strong>180° (π радиан)</strong> при смене логического состояния передаваемого бита:
            </p>
            <ul style="margin-left: 1.5rem; color: var(--text-secondary); line-height: 1.8; margin-bottom: 0.75rem; font-size: 0.9rem;">
              <li>Символ «0»: фаза <code>φ = 0°</code> → <code>s(t) = +A<sub>c</sub> cos(2π F<sub>c</sub> t)</code></li>
              <li>Символ «1»: фаза <code>φ = 180° (π)</code> → <code>s(t) = A<sub>c</sub> cos(2π F<sub>c</sub> t + π) = -A<sub>c</sub> cos(2π F<sub>c</sub> t)</code></li>
            </ul>
            <div style="background: rgba(0, 0, 0, 0.4); padding: 0.75rem 1.25rem; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.95rem; color: #c084fc; margin: 0.75rem 0;">
              s<sub>BPSK</sub>(t) = (-1)<sup>d(t)</sup> · A<sub>c</sub> · cos(2π F<sub>c</sub> t)
            </div>
            <p class="theory-p" style="font-size: 0.88rem;">
              <strong>Осциллограмма и спектр BPSK:</strong> На осциллограмме в моменты смены битов виден резкий разворот синусоиды (инверсия фазы на 180° при переходе через ноль). В спектре непрерывная несущая <code>F<sub>c</sub></code> отсутствует (подавлена при равновероятных битах), а мощность сосредоточена в информационной полосе шириной <code>B ≈ 2 · R<sub>b</sub></code>.
              <br/>
              <strong>Преимущества:</strong> BPSK обладает <strong>наивысшей помехоустойчивостью</strong> среди всех методов двоичной модуляции. При заданном отношении сигнал/шум (E<sub>b</sub>/N<sub>0</sub>) BPSK обеспечивает минимальную вероятность битовой ошибки (BER).
              <br/>
              <strong>Применение:</strong> Спутниковая навигация (GPS / ГЛОНАСС), глубокий космический радиоканал (NASA Deep Space Network), стандарты Wi-Fi (IEEE 802.11b/g на базовой скорости), сотовая связь 3G/4G/5G, кабельные модемы DOCSIS.
            </p>
          </div>
        </div>
      </div>

      <!-- Section 3: Comparative Analysis Table -->
      <div class="theory-section">
        <h2 class="theory-heading">
          3. Сравнительная характеристика аналоговых модуляций и цифровых манипуляций
        </h2>
        <div style="overflow-x: auto;">
          <table class="theory-code-table">
            <thead>
              <tr>
                <th>Тип сигнала</th>
                <th>Модулируемый параметр</th>
                <th>Ширина спектра (B)</th>
                <th>Помехоустойчивость</th>
                <th>Сложность детектора</th>
                <th>Типовое применение</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>DSB-FC</strong> (AM)</td>
                <td>Амплитуда A(t)</td>
                <td>2 · F<sub>m</sub></td>
                <td>Низкая</td>
                <td>Очень простая (диодный пиковый детектор)</td>
                <td>ДВ/СВ/КВ радиовещание, авиация (118-137 МГц)</td>
              </tr>
              <tr>
                <td><strong>SSB</strong> (USB/LSB)</td>
                <td>Амплитуда одной боковой</td>
                <td>F<sub>m</sub> (в 2 раза уже!)</td>
                <td>Средняя</td>
                <td>Высокая (требует точного генератора несущей)</td>
                <td>КВ любительская, морская и военная радиосвязь</td>
              </tr>
              <tr>
                <td><strong>ASK</strong> (АМн / OOK)</td>
                <td>Амплитуда импульсов</td>
                <td>≈ 2 · R<sub>b</sub></td>
                <td>Низкая (чувствительна к затуханию)</td>
                <td>Простая (детектор уровня / компаратор)</td>
                <td>RFID метки, брелоки авто, оптические каналы связи</td>
              </tr>
              <tr>
                <td><strong>FSK</strong> (ЧМн / 2-FSK)</td>
                <td>Частота: f<sub>0</sub> и f<sub>1</sub></td>
                <td>2·(ΔF + R<sub>b</sub>)</td>
                <td>Высокая (амплитудные шумы не влияют)</td>
                <td>Средняя (частотный дискриминатор / ФАПЧ)</td>
                <td>Телефонные модемы, Bluetooth LE, радиореле, LoRa</td>
              </tr>
              <tr>
                <td><strong>PSK</strong> (ФМн / BPSK)</td>
                <td>Начальная фаза (0° / 180°)</td>
                <td>≈ 2 · R<sub>b</sub></td>
                <td><strong>Максимальная</strong> (эталон помехоустойчивости)</td>
                <td>Повышенная (когерентный синхронный детектор)</td>
                <td>Спутниковая связь, GPS/ГЛОНАСС, Wi-Fi, 4G/5G, ZigBee</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 4: Circuit Block Architecture -->
      <div class="theory-section">
        <h2 class="theory-heading">
          4. Функциональные блоки схемотехнического конструктора
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;">
          <div style="background: rgba(8, 12, 20, 0.4); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--bg-card-border);">
            <h4 style="color: var(--accent-cyan); margin-bottom: 0.5rem;">Источник сообщения (Source)</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              Генерирует первичный информационный сигнал: <strong>Аналоговый тон (Fm)</strong>, <strong>Двухтональную речь</strong>, либо <strong>Цифровую битовую последовательность</strong> (поток нулей и единиц заданной скорости передачи Rb).
            </p>
          </div>
          <div style="background: rgba(8, 12, 20, 0.4); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--bg-card-border);">
            <h4 style="color: var(--accent-purple); margin-bottom: 0.5rem;">Несущая (Oscillator)</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              Кварцевый высокочастотный генератор гармонической несущей волны частоты F<sub>c</sub> и амплитуды A<sub>c</sub>, задающий рабочую частоту радиоканала в эфире.
            </p>
          </div>
          <div style="background: rgba(8, 12, 20, 0.4); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--bg-card-border);">
            <h4 style="color: var(--accent-cyan); margin-bottom: 0.5rem;">Модулятор / Манипулятор</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              Универсальный радиочастотный смеситель/ключ. Осуществляет аналоговое перемножение (AM, DSB, SSB) либо цифровую коммутацию амплитуды (ASK), частоты (FSK) или фазы (PSK).
            </p>
          </div>
          <div style="background: rgba(8, 12, 20, 0.4); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--bg-card-border);">
            <h4 style="color: var(--accent-emerald); margin-bottom: 0.5rem;">Полосовой фильтр канала</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              Моделирует физическую линию связи: ограничивает полосу частот (ΔF) и вносит аддитивный белый гауссов шум (AWGN), имитируя реальные помехи в эфире.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}
