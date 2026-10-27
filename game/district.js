// ===== BAIRROS FIXOS (visual e comportamento; a geometria do mapa não muda) =====
const DISTRICTS = {
  centro: { n: 'Centro (comercial)', i0: 5, i1: 10, j0: 0, j1: 7, ground: null, road: null,
    bld: ['#1e293b', '#334155', '#475569', '#0f766e', '#1e3a8a'], z: [200, 280] },
  industrial: { n: 'Zona industrial', i0: 11, i1: 15, j0: 0, j1: 6, ground: '#5f6163', road: null,
    bld: ['#57534e', '#78716c', '#44403c'], z: [40, 70] },
  periferia: { n: 'Periferia', i0: 0, i1: 4, j0: 8, j1: 15, ground: '#7c6a4f', road: '#5b4a36',
    bld: ['#b45309', '#92400e', '#a8a29e', '#6b7280'], z: [30, 50] },
  praia: { n: 'Orla / Praia', i0: 11, i1: 15, j0: 10, j1: 15, ground: '#e0c08a', road: null,
    bld: ['#38bdf8', '#f472b6', '#fde68a', '#fff7ed'], z: [30, 60] }
};
const SPECIAL_CELLS = new Set(['5,5', '10,5', '4,5', '8,13', '7,7', '5,2', '13,3']);

function districtAt(x, y) {
  const i = Math.floor(x / CELL), j = Math.floor(y / CELL);
  for (const k in DISTRICTS) {
    const d = DISTRICTS[k];
    if (i >= d.i0 && i <= d.i1 && j >= d.j0 && j <= d.j1) return k;
  }
  return null;
}
function cellDistrict(i, j) { return districtAt(i * CELL + 1, j * CELL + 1); }

const PALMS = [], GRASS = [];
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
  const key = cellDistrict(i, j);
  if (!key || SPECIAL_CELLS.has(i + ',' + j)) continue;
  const d = DISTRICTS[key], b = blocks[j * N + i];
  for (const q of b.bl) { q.col = pick(d.bld); q.z = rnd(d.z[0], d.z[1]); }
  if (key === 'praia' && !b.park)
    for (let k = 0; k < 3; k++) PALMS.push({ x: i * CELL + RD + rnd(20, CELL - 40), y: j * CELL + RD + rnd(20, CELL - 40), s: rnd(.9, 1.3) });
  if (key === 'periferia')
    for (let k = 0; k < 10; k++) GRASS.push({ x: i * CELL + RD + rnd(0, CELL - RD), y: j * CELL + RD + rnd(0, CELL - RD) });
}

const SEA_X = 15 * CELL + RD + 90;
function paintSea(x0, y0, x1, y1) {
  if (x1 < SEA_X - 40) return;
  const top = 10 * CELL, bot = WS;
  if (y1 < top || y0 > bot) return;
  const sx = Math.max(SEA_X, x0), w = x1 - sx + 20;
  const g = ctx.createLinearGradient(SEA_X, 0, WS, 0);
  g.addColorStop(0, '#0e7490'); g.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = g;
  ctx.fillRect(SEA_X, top, WS - SEA_X + 200, bot - top + 200);
  ctx.strokeStyle = 'rgba(224,242,254,.35)'; ctx.lineWidth = 2;
  for (let y = top + 20; y < bot; y += 36) {
    ctx.beginPath();
    for (let x = sx; x < x1 + 20; x += 16) {
      const yy = y + Math.sin(x * .03 + tm * 2 + y * .05) * 3;
      if (x === sx) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let y = top; y < bot; y += 12) {
    const x = SEA_X - 6 + Math.sin(y * .05 + tm * 1.5) * 4;
    if (y === top) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function paintDistricts(x0, y0, x1, y1) {
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const X = i * CELL, Y = j * CELL;
    if (X + CELL < x0 || X > x1 || Y + CELL < y0 || Y > y1) continue;
    const key = cellDistrict(i, j); if (!key) continue;
    const d = DISTRICTS[key], b = blocks[j * N + i];
    if (key === 'praia' && !b.park) {
      ctx.fillStyle = '#e8cc96'; ctx.fillRect(X + RD, Y + RD, CELL - RD, CELL - RD);
      ctx.fillStyle = 'rgba(180,140,80,.25)';
      for (let k = 0; k < 12; k++) ctx.fillRect(X + RD + ((k * 53) % (CELL - RD)), Y + RD + ((k * 97) % (CELL - RD)), 3, 2);
      continue;
    }
    if (d.road) { ctx.fillStyle = d.road; ctx.fillRect(X, Y, CELL, RD); ctx.fillRect(X, Y, RD, CELL); }
    if (d.ground && !b.park) { ctx.fillStyle = d.ground; ctx.fillRect(X + RD, Y + RD, CELL - RD, CELL - RD); }
  }
  for (let j = 10; j < N; j++) {
    const X = 11 * CELL, Y = j * CELL;
    if (X + CELL < x0 || X > x1 || Y + CELL < y0 || Y > y1) continue;
    ctx.fillStyle = 'rgba(120,53,15,.35)';
    for (let k = 0; k < 6; k++) ctx.fillRect(X + RD, Y + RD + k * 18, 6, 6);
  }
  ctx.fillStyle = '#4d7c0f';
  for (const g of GRASS) if (g.x > x0 && g.x < x1 && g.y > y0 && g.y < y1) ctx.fillRect(g.x, g.y, 4, 3);
  paintSea(x0, y0, x1, y1);
  for (const p of PALMS) {
    if (p.x < x0 - 30 || p.x > x1 + 30 || p.y < y0 - 30 || p.y > y1 + 30) continue;
    drawPalm(p);
  }
}

function drawPalm(p) {
  const s = p.s;
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(p.x + 6, p.y + 4, 12 * s, 6 * s, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 4 * s;
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x + 5 * s, p.y - 10 * s, p.x + 2 * s, p.y - 18 * s); ctx.stroke();
  const tx = p.x + 2 * s, ty = p.y - 18 * s;
  ctx.fillStyle = '#15803d';
  for (let k = 0; k < 6; k++) {
    const a = k * TAU / 6 + .3;
    ctx.beginPath(); ctx.ellipse(tx + Math.cos(a) * 9 * s, ty + Math.sin(a) * 4 * s, 9 * s, 3 * s, a, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = '#84cc16';
  ctx.beginPath(); ctx.arc(tx, ty, 2.5 * s, 0, TAU); ctx.fill();
}

const _drawDecalsBase = drawDecals;
drawDecals = function (x0, y0, x1, y1) {
  paintDistricts(x0, y0, x1, y1);
  _drawDecalsBase(x0, y0, x1, y1);
};

setInterval(() => {
  if (st !== 'play') return;
  const i = 11 + ((R() * 5) | 0), j = (R() * 7) | 0;
  if (cellDistrict(i, j) !== 'industrial') return;
  smoke(i * CELL + RD + 30, j * CELL + RD + 20, '#9ca3af');
}, 350);

const _spawnPedBase = spawnPed;
spawnPed = function (init, cop) {
  const p = _spawnPedBase(init, cop);
  if (p && !cop && districtAt(p.x, p.y) === 'centro' && R() < .6) {
    p.col = pick(['#111827', '#1f2937', '#e5e7eb']);
    p.exec = true;
  }
  return p;
};

let curDistrict = null;
const _updateBase = update;
update = function (dt) {
  _updateBase(dt);
  if (st !== 'play') return;
  const d = districtAt(P.x, P.y);
  if (d !== curDistrict) {
    curDistrict = d;
    if (d) toast('Você entrou: ' + DISTRICTS[d].n);
  }
};

function drawDistrictName() {
  if (st === 'play' && curDistrict) label('Bairro: ' + DISTRICTS[curDistrict].n, 20, 40, 16, '#fde68a');
}