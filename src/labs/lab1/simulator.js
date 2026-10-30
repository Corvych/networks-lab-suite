// High-precision Amplitude Modulation (AM, DSB, SSB), Schematic Engine & Instruments
export class AMSimulator {
  constructor(options = {}) {
    this.oscCanvas = options.oscCanvas;
    this.specCanvas = options.specCanvas;
    this.oscCtx = this.oscCanvas.getContext('2d');
    this.specCtx = this.specCanvas.getContext('2d');

    // Circuit Parameters State
    this.params = {
      // Source
      sourceType: 'audio_single', // 'audio_single', 'audio_dual', 'video_step'
      fm: 1000,                   // Modulating Frequency (Hz)
      am: 1.0,                    // Modulating Amplitude (V)
      
      // Local Oscillator (Carrier)
      fc: 20000,                  // Carrier Frequency (Hz) (20 kHz for crisp visual demo)
      ac: 2.0,                    // Carrier Amplitude (V)
      
      // Modulator
      mode: 'dsb-fc',             // 'dsb-fc', 'dsb-sc', 'ssb-usb', 'ssb-lsb'
      modIndex: 0.8,              // Modulation Index (0.1 .. 1.5)
      
      // Bandpass Filter
      filterCenter: 20000,        // Filter center (Hz)
      filterBandwidth: 6000,      // Filter bandwidth (Hz)
      channelNoise: 0,            // Noise % (0 .. 50)

      // Active probe point for display
      activeProbe: 'tp3',         // 'tp1' (Source), 'tp2' (Carrier), 'tp3' (Modulator), 'tp4' (Filter out)
      compareWithSource: true     // Show reference modulating envelope on osc
    };

    // Node canvas positions
    this.nodes = [
      { id: 'source', label: '1. Источник сообщения', type: 'source', x: 40, y: 35 },
      { id: 'oscillator', label: '2. Несущая (ВЧ)', type: 'oscillator', x: 40, y: 220 },
      { id: 'modulator', label: '3. Модулятор / Смеситель', type: 'modulator', x: 330, y: 120 },
      { id: 'filter', label: '4. Полосовой фильтр (Канал)', type: 'filter', x: 620, y: 120 },
      { id: 'receiver', label: '5. Демодулятор / Выход', type: 'receiver', x: 910, y: 120 }
    ];

    // Audio context for acoustic demonstration
    this.audioCtx = null;
    this.audioGainNode = null;
    this.audioOscNode = null;
    this.isPlayingAudio = false;

    this.animationId = null;
    this.timeOffset = 0;
    this.isPaused = false;

    // Cable connection states
    this.connections = options.connections || [];
    this.updateConnectionFlags();

    this.initCanvases();
    this.startAnimation();
  }

  setConnections(conns) {
    this.connections = conns || [];
    this.updateConnectionFlags();
    if (this.isPlayingAudio) {
      this.updateAudioSynth();
    }
    this.draw();
  }

  updateConnectionFlags() {
    this.hasSourceToMod = this.connections.some(c => 
      (c.from === 'node-source' && c.to === 'node-modulator') || 
      (c.from === 'node-modulator' && c.to === 'node-source')
    );
    this.hasCarrierToMod = this.connections.some(c => 
      (c.from === 'node-oscillator' && c.to === 'node-modulator') || 
      (c.from === 'node-modulator' && c.to === 'node-oscillator')
    );
    this.hasModToFilter = this.connections.some(c => 
      (c.from === 'node-modulator' && c.to === 'node-filter') || 
      (c.from === 'node-filter' && c.to === 'node-modulator')
    );
    this.hasFilterToReceiver = this.connections.some(c => 
      (c.from === 'node-filter' && c.to === 'node-receiver') || 
      (c.from === 'node-receiver' && c.to === 'node-filter')
    );
  }

  initCanvases() {
    this.resizeCanvas(this.oscCanvas, this.oscCtx);
    this.resizeCanvas(this.specCanvas, this.specCtx);
  }

  resizeCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.scale(dpr, dpr);
  }

  setParam(key, value) {
    this.params[key] = value;
    if (this.isPlayingAudio) {
      this.updateAudioSynth();
    }
    this.draw();
  }

  setActiveProbe(probeId) {
    this.params.activeProbe = probeId;
    this.draw();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  // Calculate message signal s_m(t) at time t (seconds)
  getMessageSignal(t) {
    const { sourceType, fm, am } = this.params;
    const w = 2 * Math.PI * fm;

    if (sourceType === 'digital_bits') {
      const bits = this.params.bitPattern || '10110010';
      const bitRate = this.params.bitRate || 800;
      const bitDuration = 1 / bitRate;
      const totalDuration = bits.length * bitDuration;
      const pos = (t % totalDuration + totalDuration) % totalDuration;
      const bitIdx = Math.floor(pos / bitDuration);
      return (bits[bitIdx] === '1') ? am : 0;
    } else if (sourceType === 'audio_single') {
      // Clean tone
      return am * Math.cos(w * t);
    } else if (sourceType === 'audio_dual') {
      // Speech dual tone: f1 = fm, f2 = 2.4 * fm
      return (am * 0.7 * Math.cos(w * t)) + (am * 0.4 * Math.cos(w * 2.4 * t));
    } else if (sourceType === 'video_step') {
      // Pseudo-video: sync pulse + sawtooth ramp
      const period = 1 / fm;
      const phase = (t % period) / period;
      if (phase < 0.2) return -am * 0.5; // Sync pulse
      return am * (phase - 0.2) / 0.8;    // Video ramp
    }
    return am * Math.cos(w * t);
  }

  // Calculate Hilbert transform of message signal for SSB phase-shift generation
  getHilbertSignal(t) {
    const { sourceType, fm, am } = this.params;
    const w = 2 * Math.PI * fm;

    if (sourceType === 'audio_single') {
      // Hilbert of cos is sin
      return am * Math.sin(w * t);
    } else if (sourceType === 'audio_dual') {
      return (am * 0.7 * Math.sin(w * t)) + (am * 0.4 * Math.sin(w * 2.4 * t));
    }
    // Approximation for general signal
    return am * Math.sin(w * t);
  }

  // Calculate RF modulated signal s_rf(t)
  getModulatedSignal(t) {
    // If neither is connected
    if (!this.hasCarrierToMod && !this.hasSourceToMod) {
      return 0;
    }

    const { fc, ac, mode, modIndex } = this.params;
    const wc = 2 * Math.PI * fc;

    // If carrier is connected, but source message is disconnected: pure unmodulated carrier
    if (this.hasCarrierToMod && !this.hasSourceToMod) {
      return ac * Math.cos(wc * t);
    }

    // If message is connected, but carrier is not: no RF carrier wave at modulator output
    if (!this.hasCarrierToMod && this.hasSourceToMod) {
      return 0;
    }

    // Both connected: full AM / DSB / SSB or Shift Keying
    const sm = this.getMessageSignal(t);

    if (mode === 'dsb-fc') {
      // Classical AM with carrier: s(t) = Ac * [1 + m * (sm / Am)] * cos(wc * t)
      const normSm = sm / (this.params.am || 1);
      return ac * (1 + modIndex * normSm) * Math.cos(wc * t);
    } else if (mode === 'dsb-sc') {
      // Suppressed carrier: s(t) = sm(t) * Ac * cos(wc * t)
      return sm * ac * Math.cos(wc * t);
    } else if (mode === 'ssb-usb') {
      // Upper sideband: s(t) = sm(t)*cos(wc*t) - s_hat(t)*sin(wc*t)
      const sh = this.getHilbertSignal(t);
      return (sm * ac * Math.cos(wc * t) - sh * ac * Math.sin(wc * t)) * 0.5;
    } else if (mode === 'ssb-lsb') {
      // Lower sideband: s(t) = sm(t)*cos(wc*t) + s_hat(t)*sin(wc*t)
      const sh = this.getHilbertSignal(t);
      return (sm * ac * Math.cos(wc * t) + sh * ac * Math.sin(wc * t)) * 0.5;
    } else if (mode === 'ask') {
      const isBit1 = sm > 0.3 * (this.params.am || 1);
      const lowRatio = this.params.askLowRatio !== undefined ? this.params.askLowRatio : 0.05;
      return (isBit1 ? ac : ac * lowRatio) * Math.cos(wc * t);
    } else if (mode === 'fsk') {
      const isBit1 = sm > 0.3 * (this.params.am || 1);
      const deltaF = this.params.fskDeltaF || 3000;
      const fInst = isBit1 ? (fc + deltaF) : (fc - deltaF);
      return ac * Math.cos(2 * Math.PI * fInst * t);
    } else if (mode === 'psk') {
      const isBit1 = sm > 0.3 * (this.params.am || 1);
      const phase = isBit1 ? Math.PI : 0;
      return ac * Math.cos(wc * t + phase);
    }
    return 0;
  }

  // Calculate filtered signal passing through bandpass channel
  getFilteredSignal(t) {
    // If modulator output is not connected to filter input: no signal passes
    if (!this.hasModToFilter) {
      if (this.params.channelNoise > 0) {
        const u = 1 - Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return z * (this.params.channelNoise / 100) * (this.params.ac * 0.2);
      }
      return 0;
    }

    const rf = this.getModulatedSignal(t);
    const { filterCenter, filterBandwidth, fc, mode, channelNoise } = this.params;

    // Filter attenuation based on frequency match
    let attenuation = 1.0;
    const dist = Math.abs(filterCenter - fc);
    if (dist > filterBandwidth / 2) {
      attenuation = Math.max(0.05, 1 - (dist - filterBandwidth / 2) / (filterBandwidth * 0.5));
    }

    // Bandwidth clipping of modulation if filter bandwidth is too narrow
    const requiredBw = (mode.startsWith('ssb') ? this.params.fm : 2 * this.params.fm);
    if (filterBandwidth < requiredBw) {
      const bwRatio = filterBandwidth / requiredBw;
      attenuation *= bwRatio;
    }

    let out = rf * attenuation;

    // Additive Gaussian channel noise
    if (channelNoise > 0) {
      const u = 1 - Math.random();
      const v = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      out += z * (channelNoise / 100) * (this.params.ac * 0.4);
    }

    return out;
  }

  // Sample probe signal based on active probe selection
  getProbeSignal(t) {
    switch (this.params.activeProbe) {
      case 'tp1': // Message Source
        return this.getMessageSignal(t);
      case 'tp2': // Carrier Local Oscillator
        return this.params.ac * Math.cos(2 * Math.PI * this.params.fc * t);
      case 'tp3': // Modulator Output
        return this.getModulatedSignal(t);
      case 'tp4': // Filter Output
        return this.getFilteredSignal(t);
      default:
        return this.getModulatedSignal(t);
    }
  }

  // Animation Loop
  startAnimation() {
    const animate = () => {
      if (!this.isPaused) {
        this.timeOffset += 0.00002;
      }
      this.draw();
      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }

  draw() {
    this.drawOscilloscope();
    this.drawSpectrograph();
  }

  // 1. Draw Oscilloscope Screen
  drawOscilloscope() {
    const ctx = this.oscCtx;
    const w = this.oscCanvas.getBoundingClientRect().width;
    const h = this.oscCanvas.getBoundingClientRect().height;
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);

    const padL = 50;
    const padR = 25;
    const padT = 35;
    const padB = 35;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const yCenter = padT + plotH / 2;

    // Draw Oscilloscope Grid (10x8 divisions)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    const divX = 10;
    const divY = 8;
    for (let i = 0; i <= divX; i++) {
      const x = padL + (i / divX) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }
    for (let j = 0; j <= divY; j++) {
      const y = padT + (j / divY) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }

    // Center Crosshair Axis
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(padL, yCenter);
    ctx.lineTo(padL + plotW, yCenter);
    ctx.stroke();

    // Voltage Scale Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    const vScale = 4.0; // Volts max
    ctx.fillText(`+${vScale}V`, padL - 8, padT + 10);
    ctx.fillText('0V', padL - 8, yCenter + 3);
    ctx.fillText(`-${vScale}V`, padL - 8, padT + plotH - 5);

    // Time window for oscilloscope view (shows 2 full cycles of message signal)
    const timeSpan = 2 / this.params.fm;
    const samples = 800;

    // Draw Reference Modulating Envelope if probe is TP3 or TP4 and enabled
    if (this.params.compareWithSource && (this.params.activeProbe === 'tp3' || this.params.activeProbe === 'tp4')) {
      ctx.save();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      // Upper envelope
      ctx.beginPath();
      for (let i = 0; i < samples; i++) {
        const t = this.timeOffset + (i / samples) * timeSpan;
        const env = this.params.mode === 'dsb-fc' 
          ? this.params.ac * (1 + this.params.modIndex * (this.getMessageSignal(t) / this.params.am))
          : Math.abs(this.getMessageSignal(t)) * (this.params.ac / this.params.am);

        const x = padL + (i / samples) * plotW;
        const y = yCenter - (env / vScale) * (plotH * 0.45);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lower envelope (for DSB-FC)
      if (this.params.mode === 'dsb-fc') {
        ctx.beginPath();
        for (let i = 0; i < samples; i++) {
          const t = this.timeOffset + (i / samples) * timeSpan;
          const env = -this.params.ac * (1 + this.params.modIndex * (this.getMessageSignal(t) / this.params.am));
          const x = padL + (i / samples) * plotW;
          const y = yCenter - (env / vScale) * (plotH * 0.45);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw Main Waveform Trace
    ctx.save();
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    for (let i = 0; i < samples; i++) {
      const t = this.timeOffset + (i / samples) * timeSpan;
      const v = this.getProbeSignal(t);
      const x = padL + (i / samples) * plotW;
      const y = yCenter - (v / vScale) * (plotH * 0.45);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Oscilloscope Header Badge
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    const probeNames = {
      tp1: 'ВХОД: Источник сообщения (НЧ)',
      tp2: 'ВХОД: Несущая (ВЧ)',
      tp3: 'ВЫХОД: Модулятор АМ',
      tp4: 'ВЫХОД: Полосовой фильтр канала'
    };
    ctx.fillText(`OSC CH1: [${probeNames[this.params.activeProbe] || 'TP3'}]`, padL + 10, padT + 18);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.fillText(`T/DIV: ${(timeSpan / divX * 1000).toFixed(2)} ms | V/DIV: ${(vScale / (divY / 2)).toFixed(1)} V`, padL + 10, padT + 32);
  }

  // 2. Draw Spectrum Analyzer (Spectrograph) Screen
  drawSpectrograph() {
    const ctx = this.specCtx;
    const w = this.specCanvas.getBoundingClientRect().width;
    const h = this.specCanvas.getBoundingClientRect().height;
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);

    const padL = 55;
    const padR = 25;
    const padT = 35;
    const padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const yBase = padT + plotH;

    // Frequency Span on X-axis: 0 to 40 kHz
    const maxFreq = 40000; // 40 kHz
    const fToX = (f) => padL + (f / maxFreq) * plotW;

    // Draw Spectrum Grid
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.08)';
    ctx.lineWidth = 1;
    const fTicks = [0, 5, 10, 15, 20, 25, 30, 35, 40];
    fTicks.forEach(khz => {
      const x = fToX(khz * 1000);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, yBase);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${khz}k`, x, yBase + 16);
    });

    // dB Power scale lines
    const dbSteps = [0, -10, -20, -30, -40];
    dbSteps.forEach((db, idx) => {
      const y = padT + (idx / (dbSteps.length - 1)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${db}dB`, padL - 8, y + 3);
    });

    // Draw Bandpass Filter Window Overlay if looking at RF or Filter
    if (this.params.activeProbe === 'tp3' || this.params.activeProbe === 'tp4') {
      const fStart = Math.max(0, this.params.filterCenter - this.params.filterBandwidth / 2);
      const fEnd = Math.min(maxFreq, this.params.filterCenter + this.params.filterBandwidth / 2);
      const xStart = fToX(fStart);
      const xEnd = fToX(fEnd);

      ctx.save();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(xStart, padT, xEnd - xStart, plotH);
      ctx.strokeRect(xStart, padT, xEnd - xStart, plotH);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ПОЛОСА ФИЛЬТРА ΔF=${(this.params.filterBandwidth / 1000).toFixed(1)} кГц`, (xStart + xEnd) / 2, padT + 12);
      ctx.restore();
    }

    // Compute Analytical Spectral Components for Active Probe
    const peaks = [];
    const { fc, fm, ac, am, mode, modIndex, activeProbe } = this.params;

    if (activeProbe === 'tp1') {
      // Modulating signal
      if (this.params.sourceType === 'digital_bits') {
        const rb = this.params.bitRate || 800;
        peaks.push({ freq: rb, amp: am * 0.8, label: `Rb (${rb} Гц)`, color: '#00f0ff' });
        peaks.push({ freq: rb * 3, amp: am * 0.3, label: `3·Rb (${rb*3} Гц)`, color: '#38bdf8' });
      } else {
        peaks.push({ freq: fm, amp: am, label: `Fm (${(fm/1000).toFixed(1)}k)`, color: '#00f0ff' });
        if (this.params.sourceType === 'audio_dual') {
          peaks.push({ freq: fm * 2.4, amp: am * 0.5, label: `Fm2 (${(fm*2.4/1000).toFixed(1)}k)`, color: '#38bdf8' });
        }
      }
    } else if (activeProbe === 'tp2') {
      // Carrier only
      peaks.push({ freq: fc, amp: ac, label: `Fc (${(fc/1000).toFixed(1)}k)`, color: '#a855f7' });
    } else {
      // Modulated / Filtered (TP3 / TP4)
      const isFiltered = activeProbe === 'tp4';
      const calcAtten = (f) => {
        if (!isFiltered) return 1.0;
        const dist = Math.abs(this.params.filterCenter - f);
        return dist <= this.params.filterBandwidth / 2 ? 1.0 : Math.max(0.04, 1 - (dist - this.params.filterBandwidth / 2) / 2000);
      };

      const hasModSignal = isFiltered ? (this.hasModToFilter && this.hasCarrierToMod) : this.hasCarrierToMod;
      if (hasModSignal) {
        if (mode === 'dsb-fc') {
          peaks.push({ freq: fc, amp: ac * calcAtten(fc), label: `Fc (${(fc/1000).toFixed(1)}k)`, color: '#a855f7' });
        }

        if (mode === 'ask') {
          const rb = this.params.bitRate || 800;
          peaks.push({ freq: fc, amp: ac * 0.75 * calcAtten(fc), label: `Fc (${(fc/1000).toFixed(1)}k)`, color: '#a855f7' });
          peaks.push({ freq: fc - rb, amp: ac * 0.35 * calcAtten(fc - rb), label: `Fc-Rb (${((fc-rb)/1000).toFixed(1)}k)`, color: '#00f0ff' });
          peaks.push({ freq: fc + rb, amp: ac * 0.35 * calcAtten(fc + rb), label: `Fc+Rb (${((fc+rb)/1000).toFixed(1)}k)`, color: '#00f0ff' });
        } else if (mode === 'fsk') {
          const deltaF = this.params.fskDeltaF || 3000;
          const f0 = fc - deltaF;
          const f1 = fc + deltaF;
          peaks.push({ freq: f0, amp: ac * 0.7 * calcAtten(f0), label: `f₀ "0" (${(f0/1000).toFixed(1)}k)`, color: '#38bdf8' });
          peaks.push({ freq: f1, amp: ac * 0.7 * calcAtten(f1), label: `f₁ "1" (${(f1/1000).toFixed(1)}k)`, color: '#10b981' });
        } else if (mode === 'psk') {
          const rb = this.params.bitRate || 800;
          peaks.push({ freq: fc - rb * 0.6, amp: ac * 0.55 * calcAtten(fc - rb * 0.6), label: `LSB (${((fc - rb*0.6)/1000).toFixed(1)}k)`, color: '#38bdf8' });
          peaks.push({ freq: fc, amp: ac * 0.15 * calcAtten(fc), label: `Fc (BPSK)`, color: '#a855f7' });
          peaks.push({ freq: fc + rb * 0.6, amp: ac * 0.55 * calcAtten(fc + rb * 0.6), label: `USB (${((fc + rb*0.6)/1000).toFixed(1)}k)`, color: '#10b981' });
        } else if (this.hasSourceToMod) {
          if (mode === 'dsb-fc' || mode === 'dsb-sc' || mode === 'ssb-lsb') {
            const sideAmp = mode === 'dsb-fc' ? (ac * modIndex / 2) : (ac / 2);
            peaks.push({ 
              freq: fc - fm, 
              amp: sideAmp * calcAtten(fc - fm), 
              label: `LSB: ${( (fc - fm)/1000 ).toFixed(1)}k`, 
              color: '#3b82f6' 
            });
          }
          if (mode === 'dsb-fc' || mode === 'dsb-sc' || mode === 'ssb-usb') {
            const sideAmp = mode === 'dsb-fc' ? (ac * modIndex / 2) : (ac / 2);
            peaks.push({ 
              freq: fc + fm, 
              amp: sideAmp * calcAtten(fc + fm), 
              label: `USB: ${( (fc + fm)/1000 ).toFixed(1)}k`, 
              color: '#10b981' 
            });
          }
        }
      }
    }

    // Noise floor line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, yBase - 15);
    for (let x = padL; x <= padL + plotW; x += 4) {
      const noise = (Math.random() - 0.5) * 8 + (this.params.channelNoise * 0.4);
      ctx.lineTo(x, yBase - 15 - Math.max(0, noise));
    }
    ctx.stroke();

    // Draw Spectral Peaks (Needles with glowing tips and labels)
    peaks.forEach(peak => {
      const x = fToX(peak.freq);
      if (x < padL || x > padL + plotW) return;

      const normAmp = Math.min(1.0, peak.amp / 3.0);
      const peakH = normAmp * (plotH * 0.78);
      const yPeak = yBase - 15 - peakH;

      ctx.save();
      // Glowing needle
      ctx.shadowColor = peak.color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = peak.color;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(x, yBase - 15);
      ctx.lineTo(x, yPeak);
      ctx.stroke();

      // Dot at top
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, yPeak, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Peak Label
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = peak.color;
      ctx.textAlign = 'center';
      ctx.fillText(peak.label, x, yPeak - 10);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.fillText(`${peak.amp.toFixed(2)}V`, x, yPeak - 22);

      ctx.restore();
    });

    // Spectrograph Title / Header
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SPECTRUM ANALYZER [0 - 40 kHz] (FFT MAGNITUDE)', padL + 10, padT + 18);
  }

  // Web Audio Demonstration
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

      // Synthesize tone based on modulating frequency Fm
      this.audioOscNode = this.audioCtx.createOscillator();
      this.audioGainNode = this.audioCtx.createGain();

      this.audioOscNode.type = 'sine';
      this.audioOscNode.frequency.setValueAtTime(this.params.fm, this.audioCtx.currentTime);

      this.audioGainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime);

      this.audioOscNode.connect(this.audioGainNode);
      this.audioGainNode.connect(this.audioCtx.destination);

      this.audioOscNode.start();
      this.isPlayingAudio = true;
    } catch (e) {
      console.warn('Web Audio start failed:', e);
    }
  }

  updateAudioSynth() {
    if (!this.audioCtx || !this.audioOscNode) return;
    try {
      this.audioOscNode.frequency.setValueAtTime(this.params.fm, this.audioCtx.currentTime);
    } catch (e) {
      // Audio node already stopped
    }
  }

  stopAudio() {
    try {
      if (this.audioOscNode) {
        this.audioOscNode.stop();
        this.audioOscNode.disconnect();
      }
      if (this.audioCtx) {
        this.audioCtx.close();
      }
    } catch (e) {}
    this.audioOscNode = null;
    this.audioCtx = null;
    this.isPlayingAudio = false;
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.stopAudio();
  }
}
