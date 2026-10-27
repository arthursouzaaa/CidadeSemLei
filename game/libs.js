// ===== BIBLIOTECAS: Howler (sons) e Matter (física de teste) =====

// ----- SONS GERADOS EM MEMÓRIA (sem arquivos) -----
// Cada som é uma onda sintetizada convertida em WAV e entregue ao Howler.
// Se um dia houver MP3 em game/sounds/, playSfx usa o arquivo no lugar.
const SFX_SYNTH = {
  tiro:     { f: 220, d: .08, type: 'square', v: .5, slide: -160 },
  explosao: { f: 70,  d: .7,  type: 'sawtooth', v: .6, slide: -50, noise: true },
  batida:   { f: 90,  d: .18, type: 'sawtooth', v: .5, slide: -40, noise: true },
  sirene:   { f: 720, d: .45, type: 'sine', v: .35, slide: 240 },
  moeda:    { f: 880, d: .12, type: 'sine', v: .35, slide: 300 },
  alarme:   { f: 440, d: .25, type: 'square', v: .3, slide: 0 }
};
const SFX = {};

function wavFromSynth(p, sr = 22050) {
  const n = Math.floor(sr * p.d), buf = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n, f = p.f + (p.slide || 0) * t;
    ph += f / sr;
    let s;
    if (p.type === 'square') s = (ph % 1) < .5 ? 1 : -1;
    else if (p.type === 'sawtooth') s = (ph % 1) * 2 - 1;
    else s = Math.sin(ph * TAU);
    if (p.noise) s = s * .6 + (Math.random() * 2 - 1) * .4;
    buf[i] = s * p.v * (1 - t);
  }
  // codifica como WAV 16 bits mono
  const out = new DataView(new ArrayBuffer(44 + n * 2));
  const w = (o, str) => { for (let i = 0; i < str.length; i++) out.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); w(8, 'WAVE');
  w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
  w(36, 'data'); out.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, buf[i])) * 32767, true);
  return URL.createObjectURL(new Blob([out], { type: 'audio/wav' }));
}

function getSfx(name) {
  if (typeof Howl === 'undefined') return null;
  if (!SFX[name]) {
    const p = SFX_SYNTH[name];
    if (!p) return null;
    SFX[name] = new Howl({ src: [wavFromSynth(p)], volume: 1 });
  }
  return SFX[name];
}

// playSfx('tiro') toca o som gerado; nada acontece se o nome não existir
function playSfx(name, volume = 1) {
  const h = getSfx(name);
  if (!h) return;
  h.volume(volume);
  h.play();
}

// ----- MÚSICA DE TENSÃO EM LOOP (gerada) -----
// Um compasso curto de bumbo e chiado, repetido. Tocada enquanto há procurado.
let music = null, musicOn = false;
function buildTensionLoop() {
  const sr = 22050, beat = .5, bars = 4, total = beat * 4 * bars;
  const n = Math.floor(sr * total), buf = new Float32Array(n);
  for (let k = 0; k < 16; k++) {
    const start = Math.floor(k * beat / 2 * sr);
    const kick = k % 4 === 0, hat = k % 2 === 1;
    for (let i = 0; i < sr * .25 && start + i < n; i++) {
      const t = i / sr;
      if (kick) buf[start + i] += Math.sin(TAU * (55 - 30 * t) * t) * Math.exp(-t * 14) * .6;
      if (hat) buf[start + i] += (Math.random() * 2 - 1) * Math.exp(-t * 60) * .15;
    }
  }
  const out = new DataView(new ArrayBuffer(44 + n * 2));
  const w = (o, str) => { for (let i = 0; i < str.length; i++) out.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); w(8, 'WAVE');
  w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
  w(36, 'data'); out.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, buf[i])) * 32767, true);
  return URL.createObjectURL(new Blob([out], { type: 'audio/wav' }));
}

function playMusic(volume = .25) {
  if (typeof Howl === 'undefined') return;
  if (!music) music = new Howl({ src: [buildTensionLoop()], loop: true, volume });
  music.volume(volume);
  if (!music.playing()) music.play();
  musicOn = true;
}
function stopMusic() { if (music) music.stop(); musicOn = false; }

// Liga a música quando há procurado e dentro do carro; desliga fora disso
setInterval(() => {
  const want = typeof st !== 'undefined' && st === 'play' && P && P.veh && wanted > 0 && radio;
  if (want && !musicOn) playMusic(.2 + wanted * .04);
  else if (!want && musicOn) stopMusic();
}, 400);

// Eventos do jogo tocam os efeitos (ganchos, sem mexer nas funções originais)
function hookSfx(name, fn) {
  const base = window[name];
  if (typeof base !== 'function') return;
  window[name] = function (...args) { const r = base.apply(this, args); playSfx(fn(args)); return r; };
}
addEventListener('load', () => {
  hookSfx('explode', () => 'explosao');
  hookSfx('detonateAtm', () => 'explosao');
  hookSfx('crime', () => 'alarme');
  hookSfx('startSteal', () => 'alarme');
});

// ----- FÍSICA DE TESTE (Matter.js) -----
const Matter_ = typeof Matter !== 'undefined' ? Matter : null;