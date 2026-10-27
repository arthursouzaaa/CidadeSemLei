// ===== ZOOM DA CÂMERA =====
const ZOOM_BASE = 1.25;

// ===== OFICINA: pintura, turbo e reparo (prédio na zona industrial, quarteirão 13,3) =====
const OF_CELL = { i: 13, j: 3 };
const OF_RECT = {
  x: OF_CELL.i * CELL + RD + 20, y: OF_CELL.j * CELL + RD + 20,
  w: CELL - RD - 40, h: CELL - RD - 40
};
const OF_DOOR = { x: OF_RECT.x + OF_RECT.w / 2, y: OF_RECT.y + OF_RECT.h + 4 };
blocks[OF_CELL.j * N + OF_CELL.i] = {
  x: OF_CELL.i * CELL + RD, y: OF_CELL.j * CELL + RD, s: CELL - RD, park: false, tr: [],
  bl: [{ x: OF_RECT.x, y: OF_RECT.y, w: OF_RECT.w, h: OF_RECT.h, z: 100, col: '#525252' }]
};

const PAINT_PRICE = 500, TURBO_PRICE = 1000, TURBO_MAX = 3, TURBO_STEP = 0.15;
const REPAIR_PRICE_PER_HP = 3;

function oficinaNearAny() { return hyp(P.x - OF_DOOR.x, P.y - OF_DOOR.y) < 70; }

function applyTurbo(c) { c.max = MODELS[c.model].max * (1 + TURBO_STEP * (c.turbo || 0)); }

function oficinaPaint() {
  const c = P.veh;
  if (!c) return toast('Entre no carro e traga ele até a oficina.');
  if (money < PAINT_PRICE) return toast('Dinheiro insuficiente ($' + PAINT_PRICE + ')');
  c.col = pick(CC.filter(x => x !== c.col));
  money -= PAINT_PRICE; saveGame();
  toast('Pintura nova! (-$' + PAINT_PRICE + ')');
}

function oficinaTurbo() {
  const c = P.veh;
  if (!c) return toast('Entre no carro e traga ele até a oficina.');
  if ((c.turbo || 0) >= TURBO_MAX) return toast('Turbo no máximo (' + TURBO_MAX + '/' + TURBO_MAX + ').');
  if (money < TURBO_PRICE) return toast('Dinheiro insuficiente ($' + TURBO_PRICE + ')');
  money -= TURBO_PRICE;
  c.turbo = (c.turbo || 0) + 1;
  applyTurbo(c); saveGame();
  toast('Turbo ' + c.turbo + '/' + TURBO_MAX + ': velocidade máxima +' + Math.round(c.turbo * TURBO_STEP * 100) + '%');
}

function oficinaRepair() {
  const c = P.veh;
  if (!c) return toast('Entre no carro e traga ele até a oficina.');
  if (c.hp >= 100) return toast('O carro já está inteiro.');
  const p = Math.round((100 - c.hp) * REPAIR_PRICE_PER_HP);
  if (money < p) return toast('Dinheiro insuficiente ($' + p + ')');
  money -= p; c.hp = 100; saveGame();
  toast('Carro reparado (-$' + p + ')');
}

addEventListener('keydown', e => {
  if (st === 'play' && e.code === 'KeyE' && oficinaNearAny() && !garageAnim) {
    if (!P.veh) { toast('Entre num carro para usar a oficina.'); return; }
    st = 'oficina';
    e.stopImmediatePropagation();
    return;
  }
  if (st !== 'oficina') return;
  if (e.code === 'Escape' || e.code === 'KeyE') { st = 'play'; e.stopImmediatePropagation(); return; }
  if (e.code === 'Digit1') { oficinaPaint(); e.stopImmediatePropagation(); }
  if (e.code === 'Digit2') { oficinaTurbo(); e.stopImmediatePropagation(); }
  if (e.code === 'Digit3') { oficinaRepair(); e.stopImmediatePropagation(); }
});

const _finishGarageBase = finishGarage;
finishGarage = function () {
  const a = garageAnim;
  const outG = a && a.mode === 'out' ? garage[garage.length - 1] : null;
  _finishGarageBase();
  if (!a) return;
  if (a.mode === 'in') {
    const g = garage[garage.length - 1];
    if (g) { g.turbo = a.car.turbo || 0; g.col = a.car.col; }
    saveGame();
  } else if (outG) {
    const c = cars[cars.length - 1];
    c.turbo = outG.turbo || 0;
    applyTurbo(c);
  }
};

function drawOficinaSign() {
  const b = OF_RECT;
  ctx.fillStyle = '#fb923c'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('OFICINA', b.x + b.w / 2, b.y + b.h / 2 + 6);
  const dw = 56, dh = 12, dx = OF_DOOR.x - dw / 2, dy = b.y + b.h - 2;
  ctx.fillStyle = '#1c1917'; ctx.fillRect(dx, dy, dw, dh + 6);
  ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, dw, dh + 6);
}

function drawOficinaHint() {
  if (st === 'play' && oficinaNearAny()) {
    label(P.veh ? '[E] Entrar na oficina' : 'Entre num carro para usar a oficina', W / 2, H - 150, 18, '#fb923c', 'center');
  }
}

function drawOficinaOverlay() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,10,.75)'; ctx.fillRect(0, 0, W, H);
  label('OFICINA', W / 2, H / 2 - 150, 48, '#fb923c', 'center');
  label('Dinheiro: $' + money.toLocaleString('pt-BR'), W / 2, H / 2 - 110, 20, '#facc15', 'center');
  const c = P.veh;
  label(c ? MODELS[c.model].n + '  •  turbo ' + (c.turbo || 0) + '/' + TURBO_MAX
          : 'Entre num carro e traga ele para a oficina',
        W / 2, H / 2 - 70, 18, c ? '#e2e8f0' : '#f87171', 'center');
  const repairPrice = c ? Math.round((100 - c.hp) * REPAIR_PRICE_PER_HP) : 0;
  [['[1] Pintura nova', '$' + PAINT_PRICE],
   ['[2] Turbo (+15% de velocidade máxima)', '$' + TURBO_PRICE],
   ['[3] Reparar carro (vida cheia)', c && c.hp < 100 ? '$' + repairPrice : 'inteiro']]
    .forEach(([name, price], i) => {
      const y = H / 2 - 20 + i * 56;
      ctx.fillStyle = 'rgba(20,20,50,.9)'; ctx.fillRect(W / 2 - 260, y - 22, 520, 46);
      ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2; ctx.strokeRect(W / 2 - 260, y - 22, 520, 46);
      label(name, W / 2 - 240, y + 6, 18, '#fff');
      label(price, W / 2 + 240, y + 6, 18, '#fb923c', 'right');
    });
  label('Aperte 1, 2 ou 3 para usar   •   ESC ou E para sair', W / 2, H / 2 + 160, 16, '#94a3b8', 'center');
}

const _poisBase = mapPois;
mapPois = function () {
  const L = _poisBase();
  L.push({ key: 'oficina', name: 'Oficina (pintura, turbo e reparo)', icon: '🔧', col: '#fb923c', x: OF_DOOR.x, y: OF_DOOR.y });
  return L;
};