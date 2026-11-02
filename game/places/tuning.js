// ===== OFICINA: pintura, turbo, blindagem e reparo =====
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
const ARMOR_PRICE = 1500, ARMOR_MAX = 3, ARMOR_STEP = 0.15;
let oficinaAnimTimer = 0;

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

function oficinaArmor() {
  const c = P.veh;
  if (!c) return toast('Entre no carro e traga ele até a oficina.');
  if ((c.armorLevel || 0) >= ARMOR_MAX) return toast('Blindagem no máximo (' + ARMOR_MAX + '/' + ARMOR_MAX + ').');
  if (money < ARMOR_PRICE) return toast('Dinheiro insuficiente ($' + ARMOR_PRICE + ')');
  money -= ARMOR_PRICE;
  c.armorLevel = (c.armorLevel || 0) + 1;
  c.armor = Math.max(0.1, c.armor * (1 - ARMOR_STEP));
  saveGame();
  toast('Blindagem ' + c.armorLevel + '/' + ARMOR_MAX + ': dano recebido -' + Math.round(c.armorLevel * ARMOR_STEP * 100) + '%');
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
    oficinaAnimTimer = 0;
    e.stopImmediatePropagation();
    return;
  }
  if (st !== 'oficina') return;
  if (e.code === 'Escape' || e.code === 'KeyE') { st = 'play'; e.stopImmediatePropagation(); return; }
  if (e.code === 'Digit1') { oficinaPaint(); e.stopImmediatePropagation(); }
  if (e.code === 'Digit2') { oficinaTurbo(); e.stopImmediatePropagation(); }
  if (e.code === 'Digit3') { oficinaRepair(); e.stopImmediatePropagation(); }
  if (e.code === 'Digit4') { oficinaArmor(); e.stopImmediatePropagation(); }
});

// Garagem e animações de salvamento
const _finishGarageBase = finishGarage;
finishGarage = function () {
  const a = garageAnim;
  const outG = a && a.mode === 'out' ? garage[garage.length - 1] : null;
  _finishGarageBase();
  if (!a) return;
  if (a.mode === 'in') {
    const g = garage[garage.length - 1];
    if (g) { g.turbo = a.car.turbo || 0; g.col = a.car.col; g.armorLevel = a.car.armorLevel || 0; g.armor = a.car.armor; }
    saveGame();
  } else if (outG) {
    const c = cars[cars.length - 1];
    c.turbo = outG.turbo || 0;
    c.armorLevel = outG.armorLevel || 0;
    c.armor = outG.armor || c.armor;
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
  if (oficinaAnimTimer < 1) oficinaAnimTimer += 0.1;
  const animScale = 0.95 + (0.05 * oficinaAnimTimer);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0, 0, 5, 0.75)'; ctx.fillRect(0, 0, W, H);

  const bw = 680, bh = 560;
  const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;

  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.scale(animScale, animScale);
  ctx.translate(-W/2, -H/2);

  drawPremiumPanel(bx, by, bw, bh, '#fb923c');

  const cx = W / 2;
  let startY = by + 70;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fb923c';
  ctx.font = 'bold 32px "Segoe UI", sans-serif';
  ctx.shadowColor = '#fb923c'; ctx.shadowBlur = 10;
  ctx.fillText('🔧 OFICINA', cx, startY);
  ctx.shadowBlur = 0;
  
  ctx.font = '14px "Consolas", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('TUNING E PERFORMANCE', cx, startY + 20);

  const c = P.veh;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.roundRect(bx + 40, startY + 40, bw - 80, 60, 12); ctx.fill();
  
  if (c) {
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px "Consolas", monospace'; ctx.fillStyle = '#fff';
    ctx.fillText(MODELS[c.model].n.toUpperCase(), bx + 60, startY + 75);
    
    ctx.textAlign = 'right';
    ctx.font = '16px "Consolas", monospace';
    ctx.fillStyle = '#fb923c';
    ctx.fillText('TURBO: ' + (c.turbo || 0) + '/' + TURBO_MAX + '  |  BLINDAGEM: ' + (c.armorLevel || 0) + '/' + ARMOR_MAX, bx + bw - 60, startY + 75);
  } else {
    ctx.textAlign = 'center';
    ctx.font = '16px "Segoe UI", sans-serif'; ctx.fillStyle = '#f87171';
    ctx.fillText('ENTRE NUM CARRO E TRAGA ELE PARA A OFICINA', cx, startY + 75);
  }

  startY += 120;

  const repairPrice = c ? Math.round((100 - c.hp) * REPAIR_PRICE_PER_HP) : 0;
  const options = [
    { icon: '🎨', text: 'PINTURA NOVA', key: '[1]', color: '#38bdf8', price: '$' + PAINT_PRICE, action: oficinaPaint },
    { icon: '🔥', text: 'TURBO (+15% Vel. Máx)', key: '[2]', color: '#fb923c', price: '$' + TURBO_PRICE, action: oficinaTurbo },
    { icon: '🛠️', text: 'REPARAR CARRO', key: '[3]', color: '#4ade80', price: c && c.hp < 100 ? '$' + repairPrice : 'INTEIRO', action: oficinaRepair },
    { icon: '🛡️', text: 'BLINDAGEM (-15% Dano)', key: '[4]', color: '#cbd5e1', price: '$' + ARMOR_PRICE, action: oficinaArmor }
  ];

  options.forEach((opt, i) => {
    const oy = startY + i * 70;
    drawPremiumButton(bx + 50, oy, bw - 100, 56, opt.key, opt.text, opt.price, opt.color, opt.icon);
    if (mouse.clicked && mouseInRect(mouse.x, mouse.y, bx + 50, oy, bw - 100, 56)) {
      opt.action();
      mouse.clicked = false;
    }
  });

  ctx.restore();

  ctx.textAlign = 'center'; ctx.fillStyle = '#475569'; ctx.font = '14px "Consolas", monospace';
  ctx.fillText('ESC: SAIR', cx, by + bh - 25);
}

addEventListener('mousedown', e => {
  if (st === 'oficina' && e.button === 0) {
    const bw = 680, bh = 560;
    const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
    if (!mouseInRect(e.clientX, e.clientY, bx, by, bw, bh)) {
      st = 'play';
    }
  }
});

const _poisBase = mapPois;
mapPois = function () {
  const L = _poisBase();
  L.push({ key: 'oficina', name: 'Oficina', icon: '🔧', col: '#fb923c', x: OF_DOOR.x, y: OF_DOOR.y });
  return L;
};