// Circuit Graph Engine for Telecommunications & Signal Processing
// Evaluates signal flow across arbitrary connected nodes (Sources, Oscillators, Modulators, Filters, Instruments)

export class CircuitGraph {
  constructor() {
    this.nodes = new Map(); // id -> node instance
    this.wires = [];        // list of { id, fromNode, fromPort, toNode, toPort, color }
    this.listeners = new Set();
  }

  addNode(node) {
    this.nodes.set(node.id, node);
    this.notify();
    return node;
  }

  removeNode(nodeId) {
    // Remove connected wires first
    this.wires = this.wires.filter(w => w.fromNode !== nodeId && w.toNode !== nodeId);
    this.nodes.delete(nodeId);
    this.notify();
  }

  connect(fromNode, fromPort, toNode, toPort, color) {
    // Prevent duplicate connection to the same input port
    this.wires = this.wires.filter(w => !(w.toNode === toNode && w.toPort === toPort));
    
    const wire = {
      id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      fromNode,
      fromPort,
      toNode,
      toPort,
      color: color || '#00f0ff'
    };
    this.wires.push(wire);
    this.notify();
    return wire;
  }

  disconnect(wireId) {
    this.wires = this.wires.filter(w => w.id !== wireId);
    this.notify();
  }

  disconnectPort(nodeId, portId) {
    this.wires = this.wires.filter(w => 
      !(w.fromNode === nodeId && w.fromPort === portId) &&
      !(w.toNode === nodeId && w.toPort === portId)
    );
    this.notify();
  }

  clear() {
    this.nodes.clear();
    this.wires = [];
    this.notify();
  }

  // Find wire feeding an input port
  getInputWire(nodeId, portId) {
    return this.wires.find(w => w.toNode === nodeId && w.toPort === portId);
  }

  // Evaluate the instantaneous signal voltage V(t) at any output/input in the graph
  evaluateSignal(nodeId, portId, t, visited = new Set()) {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;

    // Prevent cyclic infinite loops
    const visitKey = `${nodeId}:${portId}`;
    if (visited.has(visitKey)) return 0;
    visited.add(visitKey);

    switch (node.type) {
      case 'source': {
        const fm = node.params.fm || 1000;
        const am = node.params.am || 1.0;
        const w = 2 * Math.PI * fm;

        if (node.params.sourceType === 'digital_bits') {
          const bits = node.params.bitPattern || '10110010';
          const bitRate = node.params.bitRate || 800; // Baud / bit rate (Hz)
          const bitDuration = 1 / bitRate;
          const totalDuration = bits.length * bitDuration;
          const pos = (t % totalDuration + totalDuration) % totalDuration;
          const bitIdx = Math.floor(pos / bitDuration);
          const bit = parseInt(bits[bitIdx] || '1', 10);
          return bit === 1 ? am : 0;
        } else if (node.params.sourceType === 'audio_dual') {
          return (am * 0.7 * Math.cos(w * t)) + (am * 0.4 * Math.cos(w * 2.4 * t));
        } else if (node.params.sourceType === 'video_step') {
          const period = 1 / fm;
          const phase = (t % period) / period;
          if (phase < 0.2) return -am * 0.5;
          return am * (phase - 0.2) / 0.8;
        }
        return am * Math.cos(w * t);
      }

      case 'oscillator': {
        const fc = node.params.fc || 20000;
        const ac = node.params.ac || 2.0;
        return ac * Math.cos(2 * Math.PI * fc * t);
      }

      case 'modulator': {
        const wireAudio = this.getInputWire(nodeId, 'mod-in-audio');
        const wireCarrier = this.getInputWire(nodeId, 'mod-in-carrier');

        // Without carrier: no RF wave
        if (!wireCarrier) return 0;

        const carrierSignal = this.evaluateSignal(wireCarrier.fromNode, wireCarrier.fromPort, t, new Set(visited));
        
        // Carrier node params for frequency reference
        const carrierNode = this.nodes.get(wireCarrier.fromNode);
        const fc = carrierNode ? (carrierNode.params.fc || 20000) : 20000;
        const ac = carrierNode ? (carrierNode.params.ac || 2.0) : 2.0;
        const wc = 2 * Math.PI * fc;

        // If message is disconnected: pure unmodulated carrier
        if (!wireAudio) {
          return carrierSignal;
        }

        const messageSignal = this.evaluateSignal(wireAudio.fromNode, wireAudio.fromPort, t, new Set(visited));
        const mode = node.params.mode || 'dsb-fc';
        const modIndex = node.params.modIndex !== undefined ? node.params.modIndex : 0.8;

        // Analog Modulations
        if (mode === 'dsb-fc') {
          // Classical AM with carrier
          return ac * (1 + modIndex * (messageSignal / (node.params.amRef || 1.0))) * Math.cos(wc * t);
        } else if (mode === 'dsb-sc') {
          // Balanced modulation (suppressed carrier)
          return messageSignal * ac * Math.cos(wc * t);
        } else if (mode === 'ssb-usb') {
          // Upper sideband: s_m(t)*cos(wc*t) - s_hat(t)*sin(wc*t)
          const audioNode = this.nodes.get(wireAudio.fromNode);
          const fm = audioNode ? (audioNode.params.fm || 1000) : 1000;
          const hilbert = messageSignal * Math.sin(2 * Math.PI * fm * t);
          return (messageSignal * ac * Math.cos(wc * t) - hilbert * ac * Math.sin(wc * t)) * 0.5;
        } else if (mode === 'ssb-lsb') {
          // Lower sideband: s_m(t)*cos(wc*t) + s_hat(t)*sin(wc*t)
          const audioNode = this.nodes.get(wireAudio.fromNode);
          const fm = audioNode ? (audioNode.params.fm || 1000) : 1000;
          const hilbert = messageSignal * Math.sin(2 * Math.PI * fm * t);
          return (messageSignal * ac * Math.cos(wc * t) + hilbert * ac * Math.sin(wc * t)) * 0.5;
        }

        // Digital Shift Keying (Манипуляции: ASK, FSK, PSK)
        const isBit1 = messageSignal > 0.3;

        if (mode === 'ask') {
          // Amplitude Shift Keying (АМн / OOK)
          // Logic 1: high amplitude Ac; Logic 0: low amplitude Ac * askLowRatio
          const askLowRatio = node.params.askLowRatio !== undefined ? node.params.askLowRatio : 0.05;
          const amp = isBit1 ? ac : ac * askLowRatio;
          return amp * Math.cos(wc * t);
        } else if (mode === 'fsk') {
          // Frequency Shift Keying (ЧМн / 2-FSK)
          // Space frequency f0 = fc - deltaF, Mark frequency f1 = fc + deltaF
          const deltaF = node.params.fskDeltaF || 3000;
          const fInst = isBit1 ? (fc + deltaF) : (fc - deltaF);
          return ac * Math.cos(2 * Math.PI * fInst * t);
        } else if (mode === 'psk') {
          // Phase Shift Keying (ФМн / BPSK)
          // Logic 0: phase 0; Logic 1: phase 180° (PI) -> inverts carrier
          const phase = isBit1 ? Math.PI : 0;
          return ac * Math.cos(wc * t + phase);
        }
        return 0;
      }

      case 'filter': {
        const inWire = this.getInputWire(nodeId, 'filter-in');
        if (!inWire) {
          // Unconnected filter output = only noise
          if (node.params.noise > 0) {
            return (Math.random() - 0.5) * (node.params.noise / 100) * 1.5;
          }
          return 0;
        }

        const inSignal = this.evaluateSignal(inWire.fromNode, inWire.fromPort, t, new Set(visited));
        let out = inSignal;

        if (node.params.noise > 0) {
          const noise = (Math.random() - 0.5) * 2 * (node.params.noise / 100) * 1.2;
          out += noise;
        }
        return out;
      }

      case 'oscilloscope':
      case 'spectrograph':
      case 'receiver': {
        // Read from their input port
        const inWire = this.getInputWire(nodeId, 'in');
        if (!inWire) return 0;
        return this.evaluateSignal(inWire.fromNode, inWire.fromPort, t, new Set(visited));
      }

      default:
        return 0;
    }
  }

  // Get active spectral peaks for a node or wire (supports multiple input ports, e.g. 'in' and 'in-2')
  getSpectralPeaks(nodeId, portId = 'in') {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    if (node.type === 'source') {
      const am = node.params.am || 1.0;
      if (node.params.sourceType === 'digital_bits') {
        const rb = node.params.bitRate || 800;
        return [
          { freq: rb, amp: am * 0.8, label: `Rb (${rb} Гц)`, color: '#00f0ff' },
          { freq: rb * 3, amp: am * 0.28, label: `3·Rb (${rb * 3} Гц)`, color: '#38bdf8' }
        ];
      }
      const fm = node.params.fm || 1000;
      const peaks = [{ freq: fm, amp: am, label: `Fm (${(fm/1000).toFixed(1)}k)`, color: '#00f0ff' }];
      if (node.params.sourceType === 'audio_dual') {
        peaks.push({ freq: fm * 2.4, amp: am * 0.5, label: `Fm2 (${(fm*2.4/1000).toFixed(1)}k)`, color: '#38bdf8' });
      }
      return peaks;
    }

    if (node.type === 'oscillator') {
      const fc = node.params.fc || 20000;
      const ac = node.params.ac || 2.0;
      return [{ freq: fc, amp: ac, label: `Fc (${(fc/1000).toFixed(1)}k)`, color: '#a855f7' }];
    }

    if (node.type === 'spectrograph' || node.type === 'oscilloscope' || node.type === 'receiver' || node.type === 'filter' || node.type === 'modulator') {
      let targetNode = node;
      if (node.type === 'spectrograph' || node.type === 'oscilloscope' || node.type === 'receiver') {
        const inWire = this.getInputWire(nodeId, portId);
        if (!inWire) return [];
        targetNode = this.nodes.get(inWire.fromNode);
        if (!targetNode) return [];
      }

      if (targetNode.type === 'source') return this.getSpectralPeaks(targetNode.id);
      if (targetNode.type === 'oscillator') return this.getSpectralPeaks(targetNode.id);

      if (targetNode.type === 'modulator' || targetNode.type === 'filter') {
        const modNode = targetNode.type === 'modulator' ? targetNode : (() => {
          const w = this.getInputWire(targetNode.id, 'filter-in');
          return w ? this.nodes.get(w.fromNode) : null;
        })();

        if (!modNode) return [];

        const wireCarrier = this.getInputWire(modNode.id, 'mod-in-carrier');
        if (!wireCarrier) return [];

        const carrierNode = this.nodes.get(wireCarrier.fromNode);
        const fc = carrierNode ? (carrierNode.params.fc || 20000) : 20000;
        const ac = carrierNode ? (carrierNode.params.ac || 2.0) : 2.0;

        const wireAudio = this.getInputWire(modNode.id, 'mod-in-audio');
        const audioNode = wireAudio ? this.nodes.get(wireAudio.fromNode) : null;
        const fm = audioNode ? (audioNode.params.fm || 1000) : 1000;

        const filterNode = (node.type === 'filter') ? node : (() => {
          if (node.type === 'spectrograph' || node.type === 'oscilloscope' || node.type === 'receiver') {
            const inWire = this.getInputWire(node.id, portId);
            if (inWire) {
              const src = this.nodes.get(inWire.fromNode);
              if (src && src.type === 'filter') return src;
            }
          }
          return null;
        })();

        const calcAtten = (f) => {
          if (!filterNode) return 1.0;
          const bw = filterNode.params.filterBandwidth || 6000;
          const dist = Math.abs(fc - f);
          if (dist <= bw / 2) return 1.0;
          return Math.max(0.04, 1.0 - (dist - bw / 2) / 2000);
        };

        const mode = modNode.params.mode || 'dsb-fc';
        const modIndex = modNode.params.modIndex || 0.8;
        const rawPeaks = [];

        if (mode === 'dsb-fc') {
          rawPeaks.push({ freq: fc, amp: ac, label: `Fc (${(fc/1000).toFixed(1)}k)`, color: '#a855f7' });
        }

        if (mode === 'ask') {
          const bitRate = (audioNode && audioNode.params.bitRate) ? audioNode.params.bitRate : 800;
          rawPeaks.push({ freq: fc, amp: ac * 0.75, label: `Fc (${(fc/1000).toFixed(1)}k)`, color: '#a855f7' });
          rawPeaks.push({ freq: fc - bitRate, amp: ac * 0.35, label: `Fc-Rb (${((fc-bitRate)/1000).toFixed(1)}k)`, color: '#00f0ff' });
          rawPeaks.push({ freq: fc + bitRate, amp: ac * 0.35, label: `Fc+Rb (${((fc+bitRate)/1000).toFixed(1)}k)`, color: '#00f0ff' });
        } else if (mode === 'fsk') {
          const deltaF = modNode.params.fskDeltaF || 3000;
          const f0 = fc - deltaF;
          const f1 = fc + deltaF;
          rawPeaks.push({ freq: f0, amp: ac * 0.7, label: `f₀ "0" (${(f0/1000).toFixed(1)}k)`, color: '#38bdf8' });
          rawPeaks.push({ freq: f1, amp: ac * 0.7, label: `f₁ "1" (${(f1/1000).toFixed(1)}k)`, color: '#10b981' });
        } else if (mode === 'psk') {
          const bitRate = (audioNode && audioNode.params.bitRate) ? audioNode.params.bitRate : 800;
          rawPeaks.push({ freq: fc - bitRate * 0.6, amp: ac * 0.55, label: `LSB (${((fc - bitRate*0.6)/1000).toFixed(1)}k)`, color: '#38bdf8' });
          rawPeaks.push({ freq: fc, amp: ac * 0.15, label: `Fc (BPSK)`, color: '#a855f7' });
          rawPeaks.push({ freq: fc + bitRate * 0.6, amp: ac * 0.55, label: `USB (${((fc + bitRate*0.6)/1000).toFixed(1)}k)`, color: '#10b981' });
        } else if (audioNode) {
          if (mode === 'dsb-fc' || mode === 'dsb-sc' || mode === 'ssb-lsb') {
            const sideAmp = mode === 'dsb-fc' ? (ac * modIndex / 2) : (ac / 2);
            rawPeaks.push({ freq: fc - fm, amp: sideAmp, label: `LSB (${((fc - fm)/1000).toFixed(1)}k)`, color: '#3b82f6' });
          }
          if (mode === 'dsb-fc' || mode === 'dsb-sc' || mode === 'ssb-usb') {
            const sideAmp = mode === 'dsb-fc' ? (ac * modIndex / 2) : (ac / 2);
            rawPeaks.push({ freq: fc + fm, amp: sideAmp, label: `USB (${((fc + fm)/1000).toFixed(1)}k)`, color: '#10b981' });
          }
        }

        return rawPeaks.map(p => ({
          ...p,
          amp: p.amp * calcAtten(p.freq)
        }));
      }
    }

    return [];
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }
}
