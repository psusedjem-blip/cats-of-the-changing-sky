// Part of the single main.js extension bundle.

let audioStarted = false;
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let effectsGain: GainNode | null = null;
let brushBuffer: AudioBuffer | null = null;
let musicNext = 0;
let musicBar = 0;
let musicChapterBand = -1;
let musicLift = 0;
let musicDescending = false;

let muted = localStorage.getItem('zima-skybells-muted') === '1';
function savedAudioLevel(key: string): number {
  const stored = localStorage.getItem(key);
  if (stored === null) return 1;
  const value = Number(stored);
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
}
let musicLevel = savedAudioLevel('zima-skybells-music-level');
let effectsLevel = savedAudioLevel('zima-skybells-effects-level');

type MusicContext = {
  theme: ThemeName;
  altitude: number;
  verticalVelocity: number;
  state: GameState;
  descentDistance: number;
  viewportHeight: number;
  chapter: number;
};

function setMusicLevel(level: number): void {
  musicLevel = Math.max(0, Math.min(1, level));
  localStorage.setItem('zima-skybells-music-level', String(musicLevel));
  if (musicGain && audioCtx) musicGain.gain.setTargetAtTime(0.87 * musicLevel, audioCtx.currentTime, 0.025);
}

function setEffectsLevel(level: number): void {
  effectsLevel = Math.max(0, Math.min(1, level));
  localStorage.setItem('zima-skybells-effects-level', String(effectsLevel));
  if (effectsGain && audioCtx) effectsGain.gain.setTargetAtTime(0.94 * effectsLevel, audioCtx.currentTime, 0.025);
}

function resumeAudioContext(): void {
  if (audioCtx?.state === 'suspended') void audioCtx.resume();
}

function resumeMusicClock(): void {
  if (audioCtx) musicNext = audioCtx.currentTime + 0.08;
}

function resetMusicForTheme(): void {
  if (!audioCtx) return;
  resumeMusicClock();
  musicBar = 0;
  musicChapterBand = -1;
}

function syncMasterAudio(isPaused: boolean): void {
  if (audioCtx && masterGain) {
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.setTargetAtTime(muted || isPaused ? 0 : 1, audioCtx.currentTime, 0.025);
  }
}

function toggleMute(isPaused: boolean): void {
  muted = !muted;
  localStorage.setItem('zima-skybells-muted', muted ? '1' : '0');
  syncMasterAudio(isPaused);
  if (!muted && audioCtx) musicNext = audioCtx.currentTime + 0.08;
}

function ensureAudio(): void {
  if (audioStarted) return;
  audioStarted = true;
  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = muted ? 0 : 1;
  masterGain.connect(audioCtx.destination);
  musicGain = audioCtx.createGain(); musicGain.gain.value = 0.87 * musicLevel; musicGain.connect(masterGain);
  effectsGain = audioCtx.createGain(); effectsGain.gain.value = 0.94 * effectsLevel; effectsGain.connect(masterGain);
  brushBuffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.13), audioCtx.sampleRate);
  const samples = brushBuffer.getChannelData(0);
  let noiseSeed = 0x62a5d;
  for (let i = 0; i < samples.length; i++) {
    noiseSeed = (Math.imul(noiseSeed, 1664525) + 1013904223) >>> 0;
    samples[i] = (noiseSeed / 2147483648 - 1) * (1 - i / samples.length);
  }
  musicNext = audioCtx.currentTime + 0.18;
  musicBar = 0;
  musicChapterBand = -1;
}

function ping(freq: number, attack: number, duration: number, type: OscillatorType): void {
  if (!audioCtx || muted) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.055, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(effectsGain!);
  osc.start(now); osc.stop(now + duration + 0.03);
}

function midiToHz(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function schedulePiano(note: number, when: number, duration: number, level = 0.026): void {
  if (!audioCtx || muted) return;
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc1.type = 'triangle';
  osc2.type = 'sine';
  osc1.frequency.setValueAtTime(midiToHz(note), when);
  osc2.frequency.setValueAtTime(midiToHz(note) * 2.001, when);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2900, when);
  filter.Q.value = 0.45;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(level, when + 0.012);
  gain.gain.exponentialRampToValueAtTime(level * 0.38, when + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain).connect(musicGain!);
  osc1.start(when); osc2.start(when);
  osc1.stop(when + duration + 0.04); osc2.stop(when + duration + 0.04);
}

function scheduleCello(note: number, when: number, duration: number, level = 0.018): void {
  if (!audioCtx || muted) return;
  const osc = audioCtx.createOscillator();
  const sub = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = 'sawtooth';
  sub.type = 'sine';
  osc.frequency.setValueAtTime(midiToHz(note), when);
  sub.frequency.setValueAtTime(midiToHz(note - 12), when);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(720, when);
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(level, when + 0.18);
  gain.gain.setValueAtTime(level * 0.9, when + Math.max(0.22, duration - 0.22));
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(filter);
  sub.connect(filter);
  filter.connect(gain).connect(musicGain!);
  osc.start(when); sub.start(when);
  osc.stop(when + duration + 0.04); sub.stop(when + duration + 0.04);
}

function scheduleChime(note: number, when: number, duration: number, level = 0.015): void {
  if (!audioCtx || muted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(midiToHz(note), when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(level, when + 0.01);
  gain.gain.exponentialRampToValueAtTime(level * 0.28, when + duration * 0.42);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(gain).connect(musicGain!);
  osc.start(when); osc.stop(when + duration + 0.03);
}

function scheduleWarmPad(note: number, when: number, duration: number, level = 0.006): void {
  if (!audioCtx || muted) return;
  const voice = audioCtx.createOscillator();
  const overtone = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  voice.type = 'triangle';
  overtone.type = 'sine';
  voice.frequency.setValueAtTime(midiToHz(note), when);
  overtone.frequency.setValueAtTime(midiToHz(note + 12) * 1.002, when);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1050, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(level, when + 0.25);
  gain.gain.setValueAtTime(level * 0.75, when + duration * 0.72);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  voice.connect(filter); overtone.connect(filter);
  filter.connect(gain).connect(musicGain!);
  voice.start(when); overtone.start(when);
  voice.stop(when + duration + 0.03); overtone.stop(when + duration + 0.03);
}

function schedulePixelPluck(note: number, when: number, duration = 0.20, level = 0.006): void {
  if (!audioCtx || muted) return;
  const voice = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  voice.type = 'square';
  voice.frequency.setValueAtTime(midiToHz(note), when);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1500, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(level, when + 0.009);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  voice.connect(filter).connect(gain).connect(musicGain!);
  voice.start(when); voice.stop(when + duration + 0.03);
}

function scheduleBrush(when: number, level = 0.0025): void {
  if (!audioCtx || !brushBuffer || muted) return;
  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  source.buffer = brushBuffer;
  filter.type = 'highpass'; filter.frequency.setValueAtTime(1600, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(level, when + 0.007);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.11);
  source.connect(filter).connect(gain).connect(musicGain!);
  source.start(when); source.stop(when + 0.12);
}

function scheduleMallet(note: number, when: number, duration = 0.50, level = 0.010): void {
  if (!audioCtx || muted) return;
  const fundamental = audioCtx.createOscillator();
  const overtone = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  fundamental.type = 'triangle';
  overtone.type = 'sine';
  fundamental.frequency.setValueAtTime(midiToHz(note), when);
  overtone.frequency.setValueAtTime(midiToHz(note) * 3.01, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(level, when + 0.012);
  gain.gain.exponentialRampToValueAtTime(level * 0.30, when + duration * 0.32);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  fundamental.connect(gain); overtone.connect(gain); gain.connect(musicGain!);
  fundamental.start(when); overtone.start(when);
  fundamental.stop(when + duration + 0.03); overtone.stop(when + duration + 0.03);
}

function scheduleChapterOrnaments(bar: number, when: number, length: number, chapter: number, theme: ThemeName): void {
  const phrase = Math.floor(bar / 8);
  const base = theme === 'winter' ? 62 : theme === 'spring' ? 67 : theme === 'summer' ? 69 : 64;
  const chapterNote = [0, 2, 5][chapter];
  const pulse = !musicDescending && phrase >= 1 && phrase < 3;
  if (pulse && bar % 2 === 0) scheduleBrush(when + length * 0.52, 0.0018 + musicLift * 0.0010);
  if (pulse && phrase === 2 && bar % 4 === 1) scheduleBrush(when + length * 0.76, 0.0015);
  if (!musicDescending && phrase === 1 && bar % 4 === 1) schedulePixelPluck(base + chapterNote + 12, when + length * 0.72, 0.16, 0.0036);
  if (phrase === 2 && bar % 4 === 2) scheduleMallet(base + chapterNote + 12, when + length * 0.62, 0.42, 0.007);
  if (phrase === 3 && bar % 4 === 0) {
    scheduleMallet(base + chapterNote + 12, when + length * 0.25, 0.48, 0.006);
    if (!musicDescending) schedulePixelPluck(base + chapterNote + 19, when + length * 0.80, 0.16, 0.0032);
  }
}

function scheduleWinterBar(bar: number, when: number): number {
  const eighth = 0.34;
  const barLen = eighth * 6;
  const progression = [
    { root: 50, chord: [50, 53, 57, 62], melody: [69, 67] },
    { root: 46, chord: [46, 50, 53, 58], melody: [65, 62] },
    { root: 41, chord: [41, 45, 48, 53], melody: [64, 65] },
    { root: 48, chord: [48, 52, 55, 60], melody: [67, 64] },
    { root: 43, chord: [43, 46, 50, 55], melody: [62, 65] },
    { root: 50, chord: [50, 53, 57, 62], melody: [69, 72] },
    { root: 45, chord: [45, 49, 52, 57], melody: [73, 69] },
    { root: 50, chord: [50, 53, 57, 62], melody: [69, 65] },
  ];
  const p = progression[(bar + Math.floor(bar / 8) * 2) % progression.length];
  const arp = [0, 1, 2, 3, 2, 1];
  const phrase = Math.floor(bar / 8);
  for (let i = 0; i < 6; i++) if ((phrase === 1 || phrase === 2 ? i !== 2 && i !== 5 : i % 2 === 0))
    schedulePiano(p.chord[arp[i]] + 12, when + i * eighth, eighth * 1.6, i === 0 ? 0.025 : 0.017);
  if (bar % 4 !== 3) scheduleMallet(p.melody[0] + 12, when + eighth * 1.5, 0.65, 0.010);
  if (bar % 4 === 1 || bar % 4 === 2) scheduleMallet(p.melody[1] + 12, when + eighth * 4.1, 0.55, 0.008);
  scheduleCello(p.root, when, barLen * 0.96, phrase === 3 || musicDescending ? 0.010 : 0.014);
  if (phrase === 1 && bar % 2 === 0) scheduleCello(p.root + 7, when + eighth * 3, eighth * 2.8, 0.006);
  scheduleWarmPad(p.chord[2], when, barLen * 0.96, 0.006 + musicLift * 0.002);
  if (phrase === 2 && bar % 2 === 1) schedulePixelPluck(p.chord[3] + 12, when + eighth * 5, 0.18, 0.004);
  return barLen;
}

function scheduleSpringBar(bar: number, when: number): number {
  const eighth = 0.32;
  const barLen = eighth * 6;
  const progression = [
    { root: 48, chord: [48, 52, 55, 60], melody: [72, 76, 74] },
    { root: 55, chord: [55, 59, 62, 67], melody: [74, 79, 76] },
    { root: 57, chord: [57, 60, 64, 69], melody: [76, 81, 79] },
    { root: 53, chord: [53, 57, 60, 65], melody: [74, 76, 72] },
  ];
  const p = progression[(bar + Math.floor(bar / 8)) % progression.length];
  const arp = [0, 1, 2, 3, 2, 1];
  const phrase = Math.floor(bar / 8);
  for (let i = 0; i < 6; i++) if (phrase === 1 || phrase === 2 ? i !== 2 && i !== 5 : i % 2 === 0)
    schedulePiano(p.chord[arp[i]] + 12, when + i * eighth, eighth * 1.25, 0.016);
  if (bar % 4 !== 3) scheduleChime(p.melody[0], when + 0.16, 0.42, 0.012);
  if (bar % 4 === 1 || bar % 4 === 2) scheduleMallet(p.melody[1], when + eighth * 2.2, 0.48, 0.009);
  if (bar % 4 === 2) scheduleChime(p.melody[2], when + eighth * 4.1, 0.40, 0.009);
  scheduleCello(p.root, when, barLen * 0.95, 0.009);
  scheduleWarmPad(p.chord[2], when, barLen * 0.94, 0.005 + musicLift * 0.002);
  if (phrase === 1 && bar % 2 === 1) schedulePixelPluck(p.chord[3] + 12, when + eighth * 4.5, 0.16, 0.004);
  return barLen;
}

function scheduleSummerBar(bar: number, when: number): number {
  const eighth = 0.31;
  const barLen = eighth * 6;
  const progression = [
    { root: 53, chord: [53, 57, 60, 65], melody: [72, 76] },
    { root: 48, chord: [48, 52, 55, 60], melody: [71, 74] },
    { root: 55, chord: [55, 59, 62, 67], melody: [74, 79] },
    { root: 57, chord: [57, 60, 64, 69], melody: [76, 81] },
  ];
  const p = progression[(bar + Math.floor(bar / 8) * 2) % progression.length];
  const arp = [0, 2, 1, 3, 2, 1];
  const phrase = Math.floor(bar / 8);
  for (let i = 0; i < 6; i++) if (phrase === 1 || phrase === 2 ? i !== 1 && i !== 4 : i % 2 === 0)
    schedulePiano(p.chord[arp[i]] + 12, when + i * eighth, eighth * 1.2, i === 0 ? 0.023 : 0.016);
  if (bar % 4 !== 3) scheduleMallet(p.melody[0], when + eighth * 1.5, 0.50, 0.010);
  if (bar % 4 === 1 || bar % 4 === 2) scheduleChime(p.melody[1], when + eighth * 4.2, 0.52, 0.010);
  scheduleCello(p.root, when, barLen * 0.92, 0.010);
  if (phrase === 1 && bar % 2 === 0) scheduleCello(p.root + 7, when + eighth * 3, barLen * 0.42, 0.005);
  scheduleWarmPad(p.chord[2], when, barLen * 0.90, 0.005 + musicLift * 0.002);
  if (phrase === 2 && bar % 2 === 0) schedulePixelPluck(p.chord[3] + 12, when + eighth * 5, 0.18, 0.005);
  return barLen;
}

function scheduleAutumnBar(bar: number, when: number): number {
  const eighth = 0.35;
  const barLen = eighth * 6;
  const progression = [
    { root: 50, chord: [50, 53, 57, 62], melody: [69, 65] },
    { root: 46, chord: [46, 50, 53, 58], melody: [65, 62] },
    { root: 41, chord: [41, 45, 48, 53], melody: [60, 64] },
    { root: 48, chord: [48, 52, 55, 60], melody: [67, 64] },
  ];
  const p = progression[(bar + Math.floor(bar / 8)) % progression.length];
  const arp = [0, 1, 2, 1, 3, 2];
  const phrase = Math.floor(bar / 8);
  for (let i = 0; i < 6; i++) if (phrase === 1 || phrase === 2 ? i !== 2 && i !== 5 : i % 2 === 0)
    schedulePiano(p.chord[arp[i]] + 12, when + i * eighth, eighth * 1.55, i === 0 ? 0.020 : 0.015);
  if (bar % 4 !== 3) scheduleMallet(p.melody[0] + 12, when + eighth * 2.2, 0.62, 0.009);
  if (bar % 4 === 1 || bar % 4 === 2) schedulePiano(p.melody[1] + 12, when + eighth * 4.6, 0.54, 0.009);
  scheduleCello(p.root, when, barLen * 0.98, phrase === 3 || musicDescending ? 0.009 : 0.013);
  scheduleWarmPad(p.chord[2], when, barLen * 0.96, 0.006 + musicLift * 0.001);
  if (phrase === 1 && bar % 2 === 1) schedulePixelPluck(p.chord[1] + 12, when + eighth * 2.5, 0.19, 0.004);
  return barLen;
}

function updateMusic(context: MusicContext): void {
  if (!audioCtx || audioCtx.state !== 'running' || muted) return;
  const now = audioCtx.currentTime;
  if (musicNext < now - 0.5) musicNext = now + 0.08;
  while (musicNext < now + 0.65) {
    musicLift += (Math.max(0, Math.min(1, context.altitude / 8200)) - musicLift) * 0.16;
    musicDescending = context.verticalVelocity < -220 && (context.state === 'falling'
      || (context.state === 'playing' && context.descentDistance > context.viewportHeight * 0.7));
    let len = 2.0;
    if (context.theme === 'winter') len = scheduleWinterBar(musicBar, musicNext);
    else if (context.theme === 'spring') len = scheduleSpringBar(musicBar, musicNext);
    else if (context.theme === 'summer') len = scheduleSummerBar(musicBar, musicNext);
    else len = scheduleAutumnBar(musicBar, musicNext);
    const chapter = context.chapter;
    scheduleChapterOrnaments(musicBar, musicNext, len, chapter, context.theme);
    if (chapter !== musicChapterBand) {
      scheduleChime((context.theme === 'winter' ? 74 : context.theme === 'spring' ? 79 : context.theme === 'summer' ? 81 : 76) + chapter * 2,
        musicNext + len * 0.15, 0.34, 0.006);
      musicChapterBand = chapter;
    }
    musicNext += len;
    musicBar = (musicBar + 1) % 32;
  }
}
