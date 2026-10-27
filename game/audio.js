let ac, nb, eo, eg, radio = true, rStep = 0;

function A() {
  if (!ac) {
    try {
      ac = new AudioContext();
      nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1;
    } catch (e) { ac = null; }
  }
  return ac;
}

function snd(f, d = .1, t = 'square', v = .04, sl = 0) {
  const c = A(); if (!c) return;
  try {
    const o = c.createOscillator(), g = c.createGain(), n = c.currentTime;
    o.type = t;
    o.frequency.setValueAtTime(f, n);
    if (sl) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + sl), n + d);
    g.gain.setValueAtTime(v, n);
    g.gain.exponentialRampToValueAtTime(.001, n + d);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(n + d);
  } catch (e) {}
}

function noise(d = .2, v = .1, fq = 1200) {
  const c = A(); if (!c) return;
  try {
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(), n = c.currentTime;
    s.buffer = nb;
    f.type = 'lowpass'; f.frequency.value = fq;
    g.gain.setValueAtTime(v, n);
    g.gain.exponentialRampToValueAtTime(.001, n + d);
    s.connect(f); f.connect(g); g.connect(c.destination);
    s.start(); s.stop(n + d);
  } catch (e) {}
}

function engine(c) {
  const x = A(); if (!x) return;
  try {
    if (!eo) {
      eo = x.createOscillator(); eg = x.createGain();
      const f = x.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 500;
      eo.type = 'sawtooth'; eg.gain.value = 0;
      eo.connect(f); f.connect(eg); eg.connect(x.destination);
      eo.start();
    }
    if (c) {
      eo.frequency.value = 45 + hyp(c.vx, c.vy) * .22;
      eg.gain.value = .05;
    } else eg.gain.value = 0;
  } catch (e) {}
}

// ----- TENSÃO (substitui a melodia do rádio) -----
let tensionStep = 0;
function tensionTick() {
  let next = 500;
  if (ac && radio && st === 'play' && P.veh && wanted > 0) {
    const lvl = wanted / 5;
    tensionStep = (tensionStep + 1) % 4;
    if (tensionStep === 0) snd(55, .25, 'sine', .10 + lvl * .08, -25);
    if (tensionStep === 2) noise(.05, .02 + lvl * .03, 2500);
    if (lvl > .5 && tensionStep === 1) snd(110, .08, 'triangle', .03 + lvl * .03);
    next = 900 - lvl * 450;
  }
  setTimeout(tensionTick, next);
}
tensionTick();