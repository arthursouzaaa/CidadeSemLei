const CELL = 360, RD = 120, N = 16, WS = CELL * N;
const blocks = [];
const ROOFS = ['#7b8794','#a9714b','#5b7c99','#8e6c9f','#6b9080','#b5838d','#8d99ae','#c08552','#6d6875'];

for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
  const x0 = i * CELL + RD, y0 = j * CELL + RD, s = CELL - RD;
  const b = { x: x0, y: y0, s, park: false, bl: [], tr: [] };
  if (R() < .13) {
    b.park = true;
    for (let k = 0; k < 8; k++) b.tr.push([x0 + rnd(30, s - 30), y0 + rnd(30, s - 30), rnd(14, 24)]);
  } else {
    const pad = 20, inn = s - pad * 2, nx = R() < .5 ? 1 : 2, ny = R() < .5 ? 1 : 2, g = 12;
    const w = (inn - g * (nx - 1)) / nx, h = (inn - g * (ny - 1)) / ny;
    for (let a = 0; a < nx; a++) for (let c = 0; c < ny; c++)
      b.bl.push({ x: x0 + pad + a * (w + g), y: y0 + pad + c * (h + g), w, h, z: rnd(50, 180), col: pick(ROOFS) });
  }
  blocks.push(b);
}

function getBlock(x, y) {
  const i = Math.floor(x / CELL), j = Math.floor(y / CELL);
  if (i < 0 || j < 0 || i >= N || j >= N) return null;
  if (x - i * CELL < RD || y - j * CELL < RD) return null;
  return blocks[j * N + i];
}
function isRoad(x, y) {
  return x >= 0 && y >= 0 && x < WS && y < WS && ((x % CELL < RD) || (y % CELL < RD));
}
function inInter(x, y) {
  return x >= 0 && y >= 0 && x < WS && y < WS && (x % CELL < RD) && (y % CELL < RD);
}
function inBld(x, y, r) {
  const b = getBlock(x, y); if (!b) return false;
  for (const q of b.bl)
    if (x > q.x - r && x < q.x + q.w + r && y > q.y - r && y < q.y + q.h + r) return true;
  return false;
}
function walkable(x, y, r) {
  return x > r && y > r && x < WS - r && y < WS - r && !isRoad(x, y) && !inBld(x, y, r);
}
function pushOut(o, r) {
  const b = getBlock(o.x, o.y); if (!b) return 0;
  let hit = 0;
  for (const q of b.bl) {
    const nx = clamp(o.x, q.x, q.x + q.w), ny = clamp(o.y, q.y, q.y + q.h);
    const dx = o.x - nx, dy = o.y - ny, d = hyp(dx, dy);
    if (d > 0 && d < r) {
      o.x += dx / d * (r - d); o.y += dy / d * (r - d);
      o.nx = dx / d; o.ny = dy / d; hit = 1;
    } else if (d === 0) {
      const l = o.x - q.x, rr = q.x + q.w - o.x, t = o.y - q.y, bt = q.y + q.h - o.y;
      const m = Math.min(l, rr, t, bt);
      if (m === l) { o.x = q.x - r; o.nx = -1; o.ny = 0; }
      else if (m === rr) { o.x = q.x + q.w + r; o.nx = 1; o.ny = 0; }
      else if (m === t) { o.y = q.y - r; o.nx = 0; o.ny = -1; }
      else { o.y = q.y + q.h + r; o.nx = 0; o.ny = 1; }
      hit = 1;
    }
  }
  return hit;
}
function randWalk() {
  for (let t = 0; t < 40; t++) {
    const x = rnd(40, WS - 40), y = rnd(40, WS - 40);
    if (walkable(x, y, 12)) return [x, y];
  }
  return [P ? P.x : 100, P ? P.y : 100];
}
const VR = () => hyp(W, H) / 2 / .8 + 60;

function segHitsBld(x1, y1, x2, y2) {
  for (let t = 0; t <= 1; t += 0.15) {
    const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
    if (inBld(x, y, 0)) return true;
  }
  return false;
}