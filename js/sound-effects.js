/* ==============================================================================
   WolfEye - Tactical Audio Synthesizer (Web Audio API)
   Generates pure procedural sci-fi audio effects without external dependencies
   ============================================================================== */

class TacticalSoundFX {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('wolfeye_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('wolfeye_muted', this.isMuted);
    return this.isMuted;
  }

  /* Short High-Tech UI Click */
  playClick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  /* Cinematic Iris Aperture Whoosh & Unlock Sound */
  playApertureWhoosh() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // 1. Sub Bass Drop & Rise
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.9);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      // Low pass filter sweep
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.linearRampToValueAtTime(2400, now + 0.4);
      filter.frequency.linearRampToValueAtTime(400, now + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);

      // 2. High Shutter Click / Servo Chime
      setTimeout(() => {
        if (this.isMuted || !this.ctx) return;
        const chime = this.ctx.createOscillator();
        const cGain = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(1800, this.ctx.currentTime);
        chime.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.15);
        cGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        cGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        chime.connect(cGain);
        cGain.connect(this.ctx.destination);
        chime.start();
        chime.stop(this.ctx.currentTime + 0.15);
      }, 350);

    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  /* Hazard Alert Siren (Simulates MQ-5 Gas / High Temp Alarm) */
  playAlertSiren() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Emergency alternating warble
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(1400, now + 0.18);
      osc.frequency.linearRampToValueAtTime(880, now + 0.36);
      osc.frequency.linearRampToValueAtTime(1400, now + 0.54);
      osc.frequency.linearRampToValueAtTime(880, now + 0.72);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  /* Arduino Piezo Buzzer Replica (2700Hz pulse) */
  playBuzzerPulse() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(2700, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn("Buzzer error:", e);
    }
  }

  /* Telemetry Data Sync Beep */
  playSyncBeep() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc.frequency.setValueAtTime(1250, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }
}

window.tacticalSound = new TacticalSoundFX();
