// ===== SEMÁFOROS, BOMBEIROS E RESPOSTA A INCIDENTES =====
const LIGHT_HALF = 8;
const LIGHT_YELLOW = 1;
let fireSpawnT = 20;

// Fase atual do cruzamento: 'h', 'v', 'yh' (amarelo horizontal) ou 'yv' (amarelo vertical).
function lightPhase(i, j) {
  const cycle = LIGHT_HALF * 2 + LIGHT_YELLOW * 2;
  const t = (tm + (((i + j) & 1) ? LIGHT_HALF + LIGHT_YELLOW : 0)) % (cycle * 2);
  const half = t % cycle;
  if (half < LIGHT_HALF) return t < cycle ? 'h' : 'v';
  if (half < LIGHT_HALF + LIGHT_YELLOW) return t < cycle ? 'yh' : 'yv';
  return t < cycle ? 'v' : 'h';
}

// Carro comum vê o sinal do eixo dele. Amarelo: quem está perto da faixa ainda passa.
function redAhead(c) {
  if (c.cop || c.fire) return false;
  const d = c.dir, horiz = d % 2 === 0;
  let ni, nj, ahead;
  if (horiz) {
    nj = Math.round((c.y - RD / 2) / CELL);
    if (Math.abs(c.y - (nj * CELL + RD / 2)) > RD / 2) return false;
    ni = d === 0 ? Math.floor((c.x - RD / 2) / CELL) + 1 : Math.ceil((c.x - RD / 2) / CELL) - 1;
    ahead = Math.abs(ni * CELL + RD / 2 - c.x);
  } else {
    ni = Math.round((c.x - RD / 2) / CELL);
    if (Math.abs(c.x - (ni * CELL + RD / 2)) > RD / 2) return false;
    nj = d === 1 ? Math.floor((c.y - RD / 2) / CELL) + 1 : Math.ceil((c.y - RD / 2) / CELL) - 1;
    ahead = Math.abs(nj * CELL + RD / 2 - c.y);
  }
  if (ni < 0 || nj < 0 || ni >= N || nj >= N) return false;
  if (ahead <= 12 || ahead > 110) return false;
  const ph = lightPhase(ni, nj), axis = horiz ? 'h' : 'v';
  if (ph === axis) return false;
  if (ph === (axis === 'h' ? 'yh' : 'yv') && ahead < 50) return false;
  return true;
}

function gridPath(si, sj, ei, ej) {
  const prev = new Map(), k = (i, j) => i + ',' + j;
  const q = [[si, sj]]; let h = 0; prev.set(k(si, sj), null);
  while (h < q.length) {
    const [i, j] = q[h++];
    if (i === ei && j === ej) break;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N || prev.has(k(ni, nj))) continue;
      prev.set(k(ni, nj), [i, j]); q.push([ni, nj]);
    }
  }
  const out = []; let cur = [ei, ej];
  while (cur) { out.unshift(nodeXY(cur[0], cur[1])); cur = prev.get(k(cur[0], cur[1])) || null; }
  return out;
}

function mkFire(x, y, a) {
  const c = mkCar(x, y, a, { ai: true, model: 'sedan', col: '#dc2626' });
  c.fire = true; c.L = 62; c.Wd = 26; c.max = 470; c.acc = 260;
  c.path = []; c.target = null; c.inc = false; c.wait = 0; c.siren = 0; c.pol = false;
  return c;
}

function sirenTick(c, dt) {
  c.siren -= dt;
  if (c.siren <= 0 && hyp(c.x - P.x, c.y - P.y) < 900) {
    c.siren = .45;
    snd(c.sirenHi ? 960 : 720, .4, 'sine', .03);
    c.sirenHi = !c.sirenHi;
  }
}

const FIRE_SPEED = 230;
function updFire(c, dt) {
  if (!c.ai) { c.fire = false; return updCar(c, dt); }
  if (!c.path || !c.path.length) {
    if (c.inc) { c.inc = false; c.wait = 5; }
    if (c.wait > 0) {
      c.wait -= dt; c.vx = 0; c.vy = 0; c.sp = 0;
      sirenTick(c, dt);
      return;
    }
    const [ci, cj] = nearestNode(c.x, c.y);
    const t = c.target || [(R() * N) | 0, (R() * N) | 0];
    c.target = null;
    c.path = gridPath(ci, cj, t[0], t[1]);
    c.path.shift();
    if (!c.path.length) return;
  }
  const [tx, ty] = c.path[0];
  const dx = tx - c.x, dy = ty - c.y, d = hyp(dx, dy);
  c.a += clamp(angD(Math.atan2(dy, dx), c.a), -4 * dt, 4 * dt);
  c.sp = FIRE_SPEED;
  c.vx = Math.cos(c.a) * FIRE_SPEED; c.vy = Math.sin(c.a) * FIRE_SPEED;
  c.x += c.vx * dt; c.y += c.vy * dt;
  if (d < 14) c.path.shift();
  for (const p of peds) if (!p.dead && hyp(p.x - c.x, p.y - c.y) < 60)
    panic(p, Math.atan2(p.y - c.y, p.x - c.x), 1.5);
  sirenTick(c, dt);
}

function callIncident(x, y) {
  if (st !== 'play') return;
  if (cars.some(c => c.fire && c.inc)) return;
  const [ni, nj] = nearestNode(x, y);
  for (let t = 0; t < 60; t++) {
    const i = (R() * N) | 0, j = (R() * N) | 0, [sx, sy] = nodeXY(i, j);
    const d = hyp(sx - x, sy - y);
    if (d < 500 || d > 900) continue;
    const c = mkFire(sx, sy, Math.atan2(y - sy, x - sx));
    c.target = [ni, nj]; c.inc = true;
    cars.push(c);
    toast('Bombeiros a caminho do incidente!');
    return;
  }
}

function updFireSpawn(dt) {
  if (st !== 'play') return;
  fireSpawnT -= dt;
  if (fireSpawnT > 0) return;
  fireSpawnT = 40 + R() * 30;
  if (cars.filter(c => c.fire && !c.dead).length >= 2) return;
  for (let t = 0; t < 40; t++) {
    const [sx, sy] = nodeXY((R() * N) | 0, (R() * N) | 0);
    const d = hyp(sx - P.x, sy - P.y);
    if (d < 700 || d > 1100) continue;
    cars.push(mkFire(sx, sy, 0));
    return;
  }
}

function drawFireTruck(c) {
  const hl = c.L / 2, hw = c.Wd / 2;
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.roundRect(-hl + 2, -hw + 3, c.L, c.Wd, 6); ctx.fill();
  ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.roundRect(-hl, -hw, c.L, c.Wd, 6); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-hl + 4, -3, c.L - 18, 6);
  ctx.fillStyle = '#16202e'; ctx.fillRect(hl - 16, -hw + 2, 12, c.Wd - 4);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(hl - 12, -hw + 4, 4, c.Wd - 8);
  ctx.fillStyle = '#fde68a'; ctx.fillRect(hl - 2, -hw + 2, 3, 5); ctx.fillRect(hl - 2, hw - 7, 3, 5);
  const f = Math.floor(tm * 10) % 2;
  ctx.fillStyle = f ? '#ef4444' : '#1e3a8a'; ctx.fillRect(-8, -5, 7, 4);
  ctx.fillStyle = f ? '#1e3a8a' : '#ef4444'; ctx.fillRect(-8, 1, 7, 4);
  ctx.restore();
}

function drawTrafficLights(i0, i1, j0, j1) {
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const cx = i * CELL + RD / 2, cy = j * CELL + RD / 2;
    const ph = lightPhase(i, j);
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(cx - 14, cy - 2, 4, 14);
    ctx.fillStyle = '#111827';
    ctx.beginPath(); ctx.roundRect(cx - 26, cy - 22, 22, 26, 4); ctx.fill();
    const hOn = ph === 'h' ? 'g' : ph === 'yh' ? 'y' : 'r';
    const lamp = (y, col, on) => {
      ctx.fillStyle = on ? col : 'rgba(255,255,255,.12)';
      ctx.beginPath(); ctx.arc(cx - 15, y, 3.5, 0, TAU); ctx.fill();
    };
    lamp(cy - 16, '#ef4444', hOn === 'r');
    lamp(cy - 9, '#facc15', hOn === 'y');
    lamp(cy - 2, '#22c55e', hOn === 'g');
  }
}