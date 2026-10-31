const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const lc = document.createElement('canvas');
const lx = lc.getContext('2d');
let W, H;

function rs() {
  W = cv.width = innerWidth;
  H = cv.height = innerHeight;
  lc.width = W >> 2;
  lc.height = H >> 2;
}
addEventListener('resize', rs);
rs();

const R = Math.random, TAU = Math.PI * 2, hyp = Math.hypot;
const rnd = (a, b) => a + R() * (b - a);
const pick = a => a[(R() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angD = (a, b) => {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};

const ls = document.createElement('canvas');
ls.width = ls.height = 128;
{
  const g = ls.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
}