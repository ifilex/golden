/**
 * Golden Axe 16-bit Retro FM Synthesizer & Web Audio Engine
 * Pure Web Audio API: 100% self-contained, no external asset dependencies, zero latency.
 */

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private currentTrack: string | null = null;
  private isMuted: boolean = false;
  private musicInterval: number | null = null;
  private musicStep: number = 0;
  private activeVoices: OscillatorNode[] = [];

  constructor() {
    // Lazy initialize on first user gesture
  }

  private init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.45;

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.7;

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolumes(music: number, sfx: number) {
    if (!this.musicGain || !this.sfxGain) return;
    this.musicGain.gain.value = Math.max(0, Math.min(1, music));
    this.sfxGain.gain.value = Math.max(0, Math.min(1, sfx));
  }

  // --- Sound Effects ---

  public playSwordSwing(heavy: boolean = false) {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Filtered noise swoosh
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(heavy ? 600 : 1200, t);
    filter.frequency.exponentialRampToValueAtTime(heavy ? 200 : 400, t + 0.14);
    filter.Q.value = 2.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  public playHit(heavy: boolean = false) {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Punchy impact oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = heavy ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(heavy ? 180 : 260, t);
    osc.frequency.exponentialRampToValueAtTime(heavy ? 35 : 55, t + 0.18);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);

    // Crunch noise
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.5, t);
    nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    noise.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(t);
  }

  public playJump() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playPotionCollect() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const notes = [1318.51, 1567.98, 2093.00, 2637.02]; // E6, G6, C7, E7
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = t + idx * 0.05;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.35, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(st);
      osc.stop(st + 0.22);
    });
  }

  public playMeatCollect() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(440, t + 0.08);
    osc.frequency.linearRampToValueAtTime(660, t + 0.16);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playGnomeKick() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Squeak!
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.07);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playMagicCast(element: "Earth" | "Fire" | "Lightning", level: number) {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    if (element === "Fire") {
      // Roaring fire blast & dragon scream
      const duration = 1.2 + level * 0.2;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, t);
      filter.frequency.linearRampToValueAtTime(2500, t + 0.5);
      filter.frequency.exponentialRampToValueAtTime(200, t + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);

      // Dragon tone
      const osc = this.ctx.createOscillator();
      const oGain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.3);
      osc.frequency.exponentialRampToValueAtTime(80, t + duration);
      oGain.gain.setValueAtTime(0.5, t);
      oGain.gain.exponentialRampToValueAtTime(0.01, t + duration);
      osc.connect(oGain);
      oGain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + duration);
    } else if (element === "Lightning") {
      // Crackling high-voltage arpeggio + thunder clap
      const duration = 1.0 + level * 0.2;
      for (let i = 0; i < 8; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const st = t + i * 0.06;
        osc.type = "square";
        osc.frequency.setValueAtTime(300 + Math.random() * 1200, st);
        gain.gain.setValueAtTime(0.5, st);
        gain.gain.exponentialRampToValueAtTime(0.01, st + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(st);
        osc.stop(st + 0.12);
      }
      // Thunder crack
      const bSize = this.ctx.sampleRate * 0.6;
      const buff = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
      const d = buff.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bSize * 0.3));
      const n = this.ctx.createBufferSource();
      n.buffer = buff;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.9, t + 0.15);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
      n.connect(g);
      g.connect(this.sfxGain);
      n.start(t + 0.15);
    } else {
      // Earth: deep volcanic quake and stone crush
      const duration = 1.3 + level * 0.2;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(75, t);
      osc.frequency.linearRampToValueAtTime(45, t + duration);
      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + duration);

      // Low pass rumble
      const bSize = this.ctx.sampleRate * duration;
      const buff = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
      const d = buff.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1);
      const n = this.ctx.createBufferSource();
      n.buffer = buff;
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(140, t);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.7, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + duration);
      n.connect(f);
      f.connect(g);
      g.connect(this.sfxGain);
      n.start(t);
    }
  }

  public playCoin() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(987.77, t); // B5
    osc1.frequency.setValueAtTime(1318.51, t + 0.08); // E6
    osc2.frequency.setValueAtTime(1975.53, t + 0.08); // B6

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t + 0.08);
    osc1.stop(t + 0.4);
    osc2.stop(t + 0.4);
  }

  public playMountAttack(type: "chicken_leg" | "fire_dragon") {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    if (type === "chicken_leg") {
      // Whipping tail crack
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.16);
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.18);
    } else {
      // Fire breath
      const bSize = this.ctx.sampleRate * 0.4;
      const buff = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
      const d = buff.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1);
      const n = this.ctx.createBufferSource();
      n.buffer = buff;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(800, t);
      f.frequency.exponentialRampToValueAtTime(300, t + 0.35);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.8, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.38);
      n.connect(f);
      f.connect(g);
      g.connect(this.sfxGain);
      n.start(t);
    }
  }

  public playDownPlunge() {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  // --- Dynamic 16-Bit Music Generator ---

  public playMusic(track: "wilderness" | "battle" | "turtle" | "campfire" | "death_adder" | "title") {
    if (this.currentTrack === track && this.musicInterval) return;
    this.stopMusic();
    this.currentTrack = track;
    this.resume();
    if (!this.ctx || !this.musicGain) return;

    this.musicStep = 0;
    const bpm = track === "battle" ? 145 : track === "campfire" ? 130 : track === "death_adder" ? 120 : 125;
    const stepDurationMs = (60 / bpm / 4) * 1000;

    // Pattern definitions in semitones relative to root
    const melodyPatterns: Record<string, number[][]> = {
      wilderness: [
        // Golden Axe Wilderness Theme motif: D minor heroic drive
        [62, 0, 62, 65, 67, 0, 65, 64, 62, 0, 60, 62, 65, 0, 64, 0],
        [62, 0, 62, 65, 67, 69, 67, 65, 67, 0, 65, 64, 62, 0, 0, 0],
        [65, 0, 65, 69, 72, 0, 69, 67, 65, 0, 64, 65, 67, 0, 65, 0],
        [64, 0, 64, 67, 69, 0, 67, 65, 62, 0, 60, 58, 60, 0, 62, 0],
      ],
      battle: [
        // Driving intense boss theme
        [50, 50, 62, 50, 50, 63, 50, 65, 50, 50, 65, 63, 62, 60, 62, 65],
        [50, 50, 62, 50, 50, 63, 50, 65, 67, 65, 63, 62, 63, 62, 60, 58],
        [53, 53, 65, 53, 53, 67, 53, 69, 53, 53, 69, 67, 65, 63, 65, 69],
        [50, 50, 62, 50, 50, 63, 50, 65, 72, 70, 69, 67, 65, 63, 62, 60],
      ],
      turtle: [
        [57, 0, 60, 62, 64, 0, 62, 60, 57, 0, 57, 60, 62, 0, 60, 0],
        [55, 0, 59, 60, 62, 0, 60, 59, 55, 0, 55, 59, 60, 0, 62, 0],
      ],
      campfire: [
        // Playful thief thief chasing groove
        [60, 0, 64, 0, 67, 64, 60, 64, 62, 0, 65, 0, 69, 65, 62, 65],
        [60, 0, 64, 0, 67, 64, 60, 64, 67, 0, 71, 0, 72, 0, 0, 0],
      ],
      death_adder: [
        // Menacing heavy dark chords
        [46, 0, 46, 58, 46, 0, 58, 61, 46, 0, 61, 65, 64, 0, 61, 58],
        [44, 0, 44, 56, 44, 0, 56, 59, 44, 0, 59, 63, 62, 0, 59, 56],
      ],
      title: [
        // Epic Title March
        [50, 0, 50, 50, 55, 0, 57, 0, 58, 0, 57, 55, 53, 0, 55, 0],
        [50, 0, 50, 50, 55, 0, 57, 0, 62, 0, 60, 58, 57, 0, 0, 0],
      ]
    };

    const bassPatterns: Record<string, number[]> = {
      wilderness: [38, 38, 50, 38, 41, 38, 43, 38, 45, 38, 43, 38, 41, 38, 40, 38],
      battle:     [38, 38, 38, 38, 38, 38, 38, 38, 41, 41, 41, 41, 43, 43, 40, 40],
      turtle:     [33, 33, 45, 33, 33, 45, 33, 45, 35, 35, 47, 35, 35, 47, 35, 47],
      campfire:   [36, 0, 48, 0, 36, 0, 48, 0, 38, 0, 50, 0, 38, 0, 50, 0],
      death_adder:[34, 34, 46, 34, 34, 46, 34, 46, 32, 32, 44, 32, 32, 44, 32, 44],
      title:      [38, 0, 38, 0, 43, 0, 45, 0, 46, 0, 45, 0, 41, 0, 43, 0],
    };

    const patternList = melodyPatterns[track] || melodyPatterns.wilderness;
    const bass = bassPatterns[track] || bassPatterns.wilderness;

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;
      const t = this.ctx.currentTime;

      const currentBar = Math.floor(this.musicStep / 16) % patternList.length;
      const noteIdx = this.musicStep % 16;
      const melodyNote = patternList[currentBar][noteIdx];
      const bassNote = bass[noteIdx];

      // 1. Bassline (Punchy FM-style sawtooth/square)
      if (bassNote > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = "sawtooth";
        bOsc.frequency.setValueAtTime(this.midiToFreq(bassNote), t);

        const bFilter = this.ctx.createBiquadFilter();
        bFilter.type = "lowpass";
        bFilter.frequency.setValueAtTime(450, t);
        bFilter.frequency.exponentialRampToValueAtTime(160, t + 0.12);

        bGain.gain.setValueAtTime(0.45, t);
        bGain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

        bOsc.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(this.musicGain);

        bOsc.start(t);
        bOsc.stop(t + 0.15);
      }

      // 2. Melody Lead (16-bit square wave with vibrato)
      if (melodyNote > 0) {
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = "square";
        mOsc.frequency.setValueAtTime(this.midiToFreq(melodyNote), t);

        mGain.gain.setValueAtTime(0.3, t);
        mGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

        mOsc.connect(mGain);
        mGain.connect(this.musicGain);

        mOsc.start(t);
        mOsc.stop(t + 0.2);
      }

      // 3. Rhythm / Drum Beat (Retro noise snare on beat 4, 12, kick on 0, 8)
      if (noteIdx === 0 || noteIdx === 8) {
        // Kick drum
        const kOsc = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kOsc.type = "sine";
        kOsc.frequency.setValueAtTime(130, t);
        kOsc.frequency.exponentialRampToValueAtTime(35, t + 0.09);
        kGain.gain.setValueAtTime(0.6, t);
        kGain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
        kOsc.connect(kGain);
        kGain.connect(this.musicGain);
        kOsc.start(t);
        kOsc.stop(t + 0.1);
      } else if (noteIdx === 4 || noteIdx === 12) {
        // Snare drum
        const bSize = Math.floor(this.ctx.sampleRate * 0.08);
        const buff = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const d = buff.getChannelData(0);
        for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bSize * 0.3));
        const sn = this.ctx.createBufferSource();
        sn.buffer = buff;
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.35, t);
        sGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        sn.connect(sGain);
        sGain.connect(this.musicGain);
        sn.start(t);
      } else if (noteIdx % 2 === 0) {
        // Hi-hat
        const bSize = Math.floor(this.ctx.sampleRate * 0.02);
        const buff = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const d = buff.getChannelData(0);
        for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1);
        const hh = this.ctx.createBufferSource();
        hh.buffer = buff;
        const hf = this.ctx.createBiquadFilter();
        hf.type = "highpass";
        hf.frequency.value = 6000;
        const hGain = this.ctx.createGain();
        hGain.gain.setValueAtTime(0.12, t);
        hGain.gain.exponentialRampToValueAtTime(0.005, t + 0.02);
        hh.connect(hf);
        hf.connect(hGain);
        hGain.connect(this.musicGain);
        hh.start(t);
      }

      this.musicStep++;
    }, stepDurationMs);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = null;
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
}

export const soundEngine = new RetroAudioEngine();
