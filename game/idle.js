// ===== VIDA NA CIDADE: grupos conversando, ações idle e locutor de rádio =====
const IDLE_MAX = 14;

const _updPedBase = updPed;
updPed = function (p, dt) {
  if (p.idle) {
    if (p.dead || p.cop || p.fl > 0) p.idle = null;
    else {
      p.idle.t -= dt;
      if (p.idle.kind === 'smoke' && R() < dt * 2.5) smoke(p.x + 5, p.y - 8, '#9ca3af');
      if (p.idle.t <= 0) p.idle = null;
      else return;
    }
  }
  _updPedBase(p, dt);
};

function idleCount() { return peds.filter(p => p.idle && !p.dead).length; }

function idleBlock() {
  for (let t = 0; t < 40; t++) {
    const i = (R() * N) | 0, j = (R() * N) | 0;
    const d = hyp(i * CELL + CELL / 2 - P.x, j * CELL + CELL / 2 - P.y);
    if (d >= 200 && d <= 900) return { i, j, b: blocks[j * N + i] };
  }
  return null;
}

function spawnIdleGroup() {
  const s = idleBlock(); if (!s) return;
  const cx = s.i * CELL + CELL / 2, cy = s.j * CELL + CELL / 2;
  if (!walkable(cx, cy, 12)) return;
  for (let k = 0; k < 3; k++) {
    const a = k * TAU / 3, x = cx + Math.cos(a) * 14, y = cy + Math.sin(a) * 14;
    if (!walkable(x, y, 8)) continue;
    const p = mkPed(x, y);
    p.a = Math.atan2(cy - y, cx - x);
    p.idle = { kind: 'talk', t: rnd(8, 14) };
    peds.push(p);
  }
}

function spawnSmoker() {
  const s = idleBlock(); if (!s || !s.b.bl.length) return;
  const q = pick(s.b.bl);
  const x = q.x + q.w / 2, y = q.y + q.h + 12;
  if (!walkable(x, y, 8)) return;
  const p = mkPed(x, y);
  p.a = -Math.PI / 2;
  p.idle = { kind: 'smoke', t: rnd(10, 16) };
  peds.push(p);
}

function spawnSleeper() {
  const s = idleBlock(); if (!s) return;
  const x = s.i * CELL + RD + 8, y = s.j * CELL + RD + 8;
  if (!walkable(x, y, 8)) return;
  const p = mkPed(x, y);
  p.col = '#6b7280'; p.spd = 0;
  p.idle = { kind: 'sleep', t: rnd(20, 30) };
  peds.push(p);
}

function spawnBench() {
  const s = idleBlock(); if (!s || !s.b.park) return;
  const x = s.i * CELL + RD + 30, y = s.j * CELL + RD + CELL / 2;
  if (!walkable(x, y, 8)) return;
  const p = mkPed(x, y);
  p.idle = { kind: 'bench', t: rnd(12, 20) };
  peds.push(p);
}

setInterval(() => {
  if (st !== 'play' || idleCount() >= IDLE_MAX) return;
  const r = R();
  if (r < .4) spawnIdleGroup();
  else if (r < .6) spawnSmoker();
  else if (r < .8) spawnSleeper();
  else spawnBench();
}, 1200);

const RADIO_LINES = [
  'Bom dia, Cidade Sem Lei! O trânsito está parado na zona sul...',
  'Atenção motoristas: bloqueio policial na avenida central.',
  'Previsão: noite com neblina e alta chance de procurados.',
  'Promoção da pizzaria hoje: entregas rápidas valem mais!',
  'Ouvintes, cuidado com os bombeiros passando pela sirene.'
];
let radioTimer = null;
function radioIntro() {
  if (!radio) return;
  clearTimeout(radioTimer);
  const lines = [pick(RADIO_LINES), pick(RADIO_LINES)];
  let k = 0;
  const next = () => {
    if (!P.veh || !radio || st !== 'play' || k >= lines.length) return;
    toast('[Rádio] ' + lines[k++]);
    radioTimer = setTimeout(next, 4500);
  };
  next();
}

const _toggleBase = toggleVeh;
toggleVeh = function () {
  const was = P.veh;
  _toggleBase();
  if (!was && P.veh) radioIntro();
  else if (was && !P.veh) clearTimeout(radioTimer);
};