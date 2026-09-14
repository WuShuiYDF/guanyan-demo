/* ══════ 程序化环境音引擎（移植自 innook ambient-engine.ts，Web Audio API） ══════
   零音频素材：雨/风/溪流/海浪由噪声+滤波+LFO 合成；鸟鸣/篝火由振荡器与噪声脉冲调度。 */
'use strict';

class AmbientEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.channels = new Map();
    this.timers = new Map();
    this.activeIds = new Set();
    this.masterVolume = 0.65;
  }
  resume() {
    this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }
  ensure() {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio not supported');
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterVolume;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
    return this.ctx;
  }
  getAudioContext() { return this.ctx; }
  setMasterVolume(v) {
    this.masterVolume = v;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }
  isActive(id) { return this.activeIds.has(id); }
  setChannel(id, on, volume = 1) {
    if (on) {
      this.resume();
      const ch = this.getOrCreate(id);
      ch.start();
      ch.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.6);
      this.activeIds.add(id);
    } else {
      const ch = this.channels.get(id);
      if (ch && this.ctx) ch.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
      this.activeIds.delete(id);
      this.clearTimers(id);
      setTimeout(() => {
        const c = this.channels.get(id);
        if (c && !this.activeIds.has(id)) c.stop();
      }, 1500);
    }
  }
  stopAll() { for (const id of Array.from(this.activeIds)) this.setChannel(id, false); }
  dispose() {
    this.stopAll();
    for (const [, ids] of this.timers) ids.forEach(clearTimeout);
    this.timers.clear();
    this.channels.clear();
    void (this.ctx && this.ctx.close().catch(() => undefined));
    this.ctx = null; this.master = null;
  }
  clearTimers(id) { const ids = this.timers.get(id); if (ids) ids.forEach(clearTimeout); this.timers.delete(id); }
  addTimer(id, t) { this.timers.set(id, [...(this.timers.get(id) ?? []), t]); }

  getOrCreate(id) {
    const existing = this.channels.get(id);
    if (existing) return existing;
    const ctx = this.ensure();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.master);
    const nodes = this.buildChannel(id, gain);
    this.channels.set(id, nodes);
    return nodes;
  }
  buildChannel(id, out) {
    switch (id) {
      case 'rain':
        return this.buildNoiseChannel(out, (src) => {
          const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400;
          const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
          const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.03;
          const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 0.06;
          const base = this.ctx.createGain(); base.gain.value = 0.22;
          lfo.connect(lfoGain).connect(base.gain);
          src.connect(hp).connect(lp).connect(base).connect(out);
          lfo.start(); return [lfo];
        });
      case 'stream':
        return this.buildNoiseChannel(out, (src) => {
          const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 0.7;
          const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.5;
          const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 550;
          lfo.connect(lfoGain).connect(bp.frequency);
          const body = this.ctx.createBiquadFilter(); body.type = 'bandpass'; body.frequency.value = 700; body.Q.value = 0.5;
          const g1 = this.ctx.createGain(); g1.gain.value = 0.5;
          const g2 = this.ctx.createGain(); g2.gain.value = 0.25;
          src.connect(bp).connect(g1).connect(out);
          src.connect(body).connect(g2).connect(out);
          lfo.start(); return [lfo];
        });
      case 'wind':
        return this.buildNoiseChannel(out, (src) => {
          const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480; lp.Q.value = 0.6;
          const gust = this.ctx.createOscillator(); gust.frequency.value = 0.05;
          const gustGain = this.ctx.createGain(); gustGain.gain.value = 260;
          gust.connect(gustGain).connect(lp.frequency);
          const swell = this.ctx.createOscillator(); swell.frequency.value = 0.08;
          const swellGain = this.ctx.createGain(); swellGain.gain.value = 0.14;
          const base = this.ctx.createGain(); base.gain.value = 0.34;
          swell.connect(swellGain).connect(base.gain);
          src.connect(lp).connect(base).connect(out);
          gust.start(); swell.start(); return [gust, swell];
        });
      case 'waves':
        return this.buildNoiseChannel(out, (src) => {
          const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
          const tide = this.ctx.createOscillator(); tide.frequency.value = 0.07;
          const tideGain = this.ctx.createGain(); tideGain.gain.value = 0.16;
          const base = this.ctx.createGain(); base.gain.value = 0.2;
          tide.connect(tideGain).connect(base.gain);
          const shimmer = this.ctx.createBiquadFilter(); shimmer.type = 'bandpass'; shimmer.frequency.value = 1400; shimmer.Q.value = 0.4;
          const sg = this.ctx.createGain(); sg.gain.value = 0.03;
          src.connect(lp).connect(base).connect(out);
          src.connect(shimmer).connect(sg).connect(base);
          tide.start(); return [tide];
        });
      case 'fire':
        return this.buildNoiseChannel(out, (src) => {
          const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
          const rumble = this.ctx.createGain(); rumble.gain.value = 0.5;
          src.connect(lp).connect(rumble).connect(out);
          this.scheduleCrackle(out);
          return [];
        });
      case 'birds':
        return { gain: out, start: () => this.scheduleBird(out), stop: () => undefined };
    }
  }
  buildNoiseChannel(out, wire) {
    let sources = [];
    let src = null;
    const start = () => {
      if (src) return;
      const ctx = this.ensure();
      src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      sources = wire(src);
      src.start();
    };
    const stop = () => {
      try { src && src.stop(); } catch (e) { /* already stopped */ }
      src = null;
      sources.forEach(s => { try { s.stop(); } catch (e) { /* ignore */ } });
      sources = [];
    };
    return { gain: out, start, stop };
  }
  scheduleCrackle(out) {
    const tick = () => {
      if (!this.activeIds.has('fire') || !this.ctx) return;
      const ctx = this.ctx;
      const dur = 0.02 + Math.random() * 0.06;
      const src = ctx.createBufferSource();
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200 + Math.random() * 1800;
      const g = ctx.createGain(); g.gain.value = 0.05 + Math.random() * 0.12;
      src.connect(hp).connect(g).connect(out);
      src.start();
      this.addTimer('fire', setTimeout(tick, 60 + Math.random() * 900));
    };
    this.addTimer('fire', setTimeout(tick, 300 + Math.random() * 600));
  }
  scheduleBird(out) {
    const phrase = () => {
      if (!this.activeIds.has('birds') || !this.ctx) return;
      const ctx = this.ctx;
      const notes = 2 + Math.floor(Math.random() * 4);
      const baseFreq = 2200 + Math.random() * 1800;
      for (let i = 0; i < notes; i++) {
        const t0 = ctx.currentTime + i * (0.12 + Math.random() * 0.1);
        const osc = ctx.createOscillator(); osc.type = 'sine';
        const f0 = baseFreq * (0.9 + Math.random() * 0.3);
        const f1 = f0 * (1.1 + Math.random() * 0.5);
        osc.frequency.setValueAtTime(f0, t0);
        osc.frequency.exponentialRampToValueAtTime(f1, t0 + 0.06);
        osc.frequency.exponentialRampToValueAtTime(f0 * 0.85, t0 + 0.13);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.045 + Math.random() * 0.03, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
        osc.connect(g).connect(out);
        osc.start(t0); osc.stop(t0 + 0.16);
      }
      this.addTimer('birds', setTimeout(phrase, 2500 + Math.random() * 6500));
    };
    this.addTimer('birds', setTimeout(phrase, 800 + Math.random() * 1500));
  }
}

let _engine = null;
function getAmbientEngine() { if (!_engine) _engine = new AmbientEngine(); return _engine; }
/** 番茄钟完成提示音（柔和双音钟声） */
function playChime() {
  try {
    const eng = getAmbientEngine();
    eng.resume();
    const ctx = eng.getAudioContext();
    if (!ctx) return;
    for (const [freq, delay] of [[880, 0], [659.25, 0.18]]) {
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + 1.5);
    }
  } catch (e) { /* ignore */ }
}
