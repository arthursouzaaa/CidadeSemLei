// ===== TRABALHO HONESTO (ENTREGADOR) =====
const DELIVERY = {
  pizza:  { pmin: 250, pmax: 400, len: 4, dmin: 400,  dmax: 800 },
  sushi:  { pmin: 600, pmax: 600, len: 6, dmin: 900,  dmax: 1400 },
  burger: { pmin: 1000, pmax: 1000, len: 4, dmin: 1800, dmax: 2600 }
};
const PIZZA_DENT_FINE = 40;
const RESTS = [
  { name: 'Pizzaria',     type: 'pizza',  cell: [8, 13], col: '#b91c1c', tag: 'PIZZARIA', icon: '🍕' },
  { name: 'Sushi',        type: 'sushi',  cell: [7, 7],  col: '#0e7490', tag: 'SUSHI', icon: '🍣' },
  { name: 'Hamburgueria', type: 'burger', cell: [5, 2],  col: '#a16207', tag: 'BURGER', icon: '🍔' }
];
for (const r of RESTS) {
  const [i, j] = r.cell;
  r.rect = { x: i * CELL + RD + 20, y: j * CELL + RD + 20, w: CELL - RD - 40, h: CELL - RD - 40 };
  r.door = { x: r.rect.x + r.rect.w / 2, y: r.rect.y + r.rect.h + 4 };
  blocks[j * N + i] = {
    x: i * CELL + RD, y: j * CELL + RD, s: CELL - RD, park: false, tr: [],
    bl: [{ x: r.rect.x, y: r.rect.y, w: r.rect.w, h: r.rect.h, z: 100, col: r.col }]
  };
}

const CALL_AT = 40;
const COLD_AT = 120;
let order = null, codeBuf = '';
let deliveryAnimT = 0;

function makeOrder(r) {
  const cfg = DELIVERY[r.type];
  let dest = null;
  for (let t = 0; t < 80 && !dest; t++) {
    const a = rnd(0, TAU), d = rnd(cfg.dmin, cfg.dmax);
    const x = r.door.x + Math.cos(a) * d, y = r.door.y + Math.sin(a) * d;
    if (x > 40 && y > 40 && x < WS - 40 && y < WS - 40 && isRoad(x, y)) dest = [x, y];
  }
  if (!dest) dest = randWalk();
  let code = '';
  for (let k = 0; k < cfg.len; k++) code += Math.floor(R() * 10);
  order = { type: r.type, rest: r.name, icon: r.icon, pay: Math.round(rnd(cfg.pmin, cfg.pmax)), len: cfg.len, code,
    dx: dest[0], dy: dest[1], elapsed: 0, called: false, cold: false,
    lastCar: 0, lastCarRef: null, cd: 0, lastP: P.hp };
  toast('Pedido pronto! Código: ' + code);
  snd(700, .15, 'triangle', .06, 300);
  autoRouteDelivery();
}

function tryRestaurant() {
  if (st !== 'play') return false;
  if (order && hyp(P.x - order.dx, P.y - order.dy) < 70) { openCode(); return true; }
  if (P.veh) return false;
  for (const r of RESTS) {
    if (hyp(P.x - r.door.x, P.y - r.door.y) < 70) {
      if (order) toast('Entregue o pedido atual primeiro.');
      else makeOrder(r);
      return true;
    }
  }
  return false;
}

function openCode() {
  st = 'code';
  codeBuf = '';
  deliveryAnimT = 0;
}

function failOrder(msg) {
  toast(msg);
  snd(120, .4, 'sawtooth', .08, -60);
  order = null;
}

function updDelivery(dt) {
  if (!order || st !== 'play') return;
  const o = order;
  o.cd = Math.max(0, o.cd - dt);
  o.elapsed += dt;

  if (!o.called && o.elapsed >= CALL_AT) {
    o.called = true;
    toast('O cliente está ligando, apresse-se!');
    snd(600, .2, 'square', .05);
  }
  if (!o.cold && o.elapsed >= COLD_AT) {
    o.cold = true;
    o.pay = Math.round(o.pay / 2);
    toast('A comida esfriou! Pagamento reduzido pela metade.');
  }

  const sameCar = P.veh && P.veh === o.lastCarRef;
  const carDrop = sameCar ? o.lastCar - P.veh.hp : 0;
  if (sameCar && carDrop > 0.01) {
    if (o.type === 'sushi') return failOrder('O sushi estragou com a batida!');
    if (o.type === 'pizza' && carDrop > 3 && o.cd <= 0) {
      o.cd = .8; o.pay = Math.max(0, o.pay - PIZZA_DENT_FINE);
      toast('A pizza amassou! -$' + PIZZA_DENT_FINE);
    }
  }
  o.lastCarRef = P.veh;
  o.lastCar = P.veh ? P.veh.hp : 0;

  if (o.type === 'sushi' && P.hp < o.lastP - 0.01) return failOrder('O sushi estragou com o dano!');
  o.lastP = P.hp;
}

function checkCode() {
  if (!order) { st = 'play'; return; }
  if (codeBuf === order.code) {
    money += order.pay; saveGame();
    toast('Entrega concluída! +$' + order.pay);
    snd(600, .3, 'triangle', .07, 500);
    order = null; st = 'play'; codeBuf = '';
  } else {
    toast('Código errado. Confira o código do pedido.');
    snd(150, .2, 'square', .05);
    codeBuf = '';
    deliveryAnimT = 0;
  }
}

addEventListener('keydown', e => {
  if (st !== 'code' || !order) return;
  if (e.code === 'Escape') { st = 'play'; codeBuf = ''; return; }
  if (e.code === 'Backspace') { codeBuf = codeBuf.slice(0, -1); return; }
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { checkCode(); return; }
  const m = e.code.match(/^(Digit|Numpad)(\d)$/);
  if (m && codeBuf.length < order.len) codeBuf += m[2];
});

function drawRestaurants() {
  for (const r of RESTS) {
    const b = r.rect;
    ctx.fillStyle = '#fef3c7'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(r.tag, b.x + b.w / 2, b.y + b.h / 2 + 6);
    const dw = 56, dh = 12, dx = r.door.x - dw / 2, dy = b.y + b.h - 2;
    ctx.fillStyle = '#1c1917'; ctx.fillRect(dx, dy, dw, dh + 6);
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, dw, dh + 6);
  }
}

function drawDeliveryWorld() {
  if (!order) return;
  const r = 30 + Math.sin(tm * 5) * 5;
  ctx.strokeStyle = '#e879f9'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(order.dx, order.dy, r, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#e879f9'; ctx.globalAlpha = .25; ctx.fill(); ctx.globalAlpha = 1;
}

function drawDeliveryMap(dot) {
  for (const r of RESTS) dot(r.door.x, r.door.y, '#fde68a', 4);
  if (order) dot(order.dx, order.dy, '#e879f9', 5);
}

// HUD do pedido: código em destaque no painel inferior (sempre visível durante o pedido)
function drawDeliveryHud() {
  if (st !== 'play') return;
  if (order) {
    const t = Math.max(0, Math.ceil(COLD_AT - order.elapsed));
    const status = order.cold ? 'FRIA' : order.called ? 'CLIENTE LIGANDO' : 'ESFRIA EM ' + t + 's';
    const statusCol = order.cold ? '#f87171' : order.called ? '#facc15' : '#4ade80';

    // Painel do código: fica no canto inferior direito, acima da barra de vida
    const bw = 300, bh = 96, bx = W - bw - 24, by = H - bh - 24;
    ctx.save();
    ctx.fillStyle = 'rgba(2,6,23,0.88)';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 14); ctx.fill();
    ctx.strokeStyle = '#e879f9'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'left'; ctx.fillStyle = '#f0abfc'; ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText((order.icon || '📦') + '  ' + order.rest, bx + 16, by + 24);

    ctx.font = '12px "Consolas", monospace'; ctx.fillStyle = '#94a3b8';
    ctx.fillText('CÓDIGO DO CLIENTE', bx + 16, by + 44);

    // Código grande, em destaque
    ctx.font = 'bold 34px "Consolas", monospace'; ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#facc15'; ctx.shadowBlur = 10;
    ctx.fillText(order.code.split('').join(' '), bx + 16, by + 82);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'right';
    ctx.font = 'bold 18px "Consolas", monospace'; ctx.fillStyle = '#4ade80';
    ctx.fillText('$' + order.pay, bx + bw - 16, by + 24);
    ctx.font = 'bold 11px "Consolas", monospace'; ctx.fillStyle = statusCol;
    ctx.fillText(status, bx + bw - 16, by + 44);

    if (hyp(P.x - order.dx, P.y - order.dy) < 70) {
      label('[E] Entregar pedido', W / 2, H - 210, 20, '#e879f9', 'center');
    }
    return;
  }
  if (P.veh) return;
  for (const r of RESTS) {
    if (hyp(P.x - r.door.x, P.y - r.door.y) < 70) {
      label('[E] Pedir no balcão: ' + r.icon + ' ' + r.name, W / 2, H - 210, 18, '#fde68a', 'center');
      return;
    }
  }
}

// Tela do código: mantém o painel de digitação
function drawCodeOverlay() {
  if (!order) return;
  if (deliveryAnimT < 1) deliveryAnimT += 0.1;
  const animScale = 0.95 + 0.05 * deliveryAnimT;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0, 0, 5, 0.8)'; ctx.fillRect(0, 0, W, H);

  const bw = 660, bh = 520;
  const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
  const cx = W / 2;

  ctx.save();
  ctx.translate(cx, H / 2);
  ctx.scale(animScale, animScale);
  ctx.translate(-cx, -H / 2);

  drawPremiumPanel(bx, by, bw, bh, '#e879f9');

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e879f9';
  ctx.font = 'bold 28px "Segoe UI", sans-serif';
  ctx.shadowColor = '#e879f9'; ctx.shadowBlur = 10;
  ctx.fillText('📦 ENTREGA', cx, by + 50);
  ctx.shadowBlur = 0;

  ctx.font = '14px "Consolas", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(order.icon + '  ' + order.rest.toUpperCase(), cx, by + 74);

  ctx.font = 'bold 15px "Segoe UI", sans-serif'; ctx.fillStyle = '#cbd5e1';
  ctx.fillText('CÓDIGO DO CLIENTE', cx, by + 118);

  const slotW = 82, slotH = 118, gap = 16;
  const totalW = order.len * slotW + (order.len - 1) * gap;
  const sx0 = cx - totalW / 2, sy = by + 140;

  ctx.fillStyle = 'rgba(232,121,249,0.08)';
  ctx.beginPath(); ctx.roundRect(sx0 - 24, sy - 18, totalW + 48, slotH + 36, 18); ctx.fill();

  for (let k = 0; k < order.len; k++) {
    const x = sx0 + k * (slotW + gap);
    const filled = k < codeBuf.length;
    const active = k === codeBuf.length;
    ctx.fillStyle = filled ? 'rgba(232,121,249,0.18)' : 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.roundRect(x, sy, slotW, slotH, 14); ctx.fill();
    ctx.strokeStyle = active ? '#facc15' : (filled ? '#e879f9' : 'rgba(255,255,255,0.15)');
    ctx.lineWidth = active ? 3.5 : 2.5;
    if (active) { ctx.shadowColor = '#facc15'; ctx.shadowBlur = 18; }
    ctx.beginPath(); ctx.roundRect(x, sy, slotW, slotH, 14); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 64px "Consolas", monospace';
    ctx.fillStyle = filled ? '#ffffff' : '#334155';
    if (filled) { ctx.shadowColor = '#e879f9'; ctx.shadowBlur = 12; }
    ctx.fillText(filled ? codeBuf[k] : '•', x + slotW / 2, sy + slotH / 2 + 4);
    ctx.shadowBlur = 0;
    ctx.textBaseline = 'alphabetic';
  }

  ctx.textAlign = 'center'; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillStyle = '#94a3b8';
  ctx.fillText('Pagamento: $' + order.pay + (order.cold ? '  •  comida fria' : ''), cx, by + 300);

  ctx.restore();

  ctx.textAlign = 'center'; ctx.fillStyle = '#475569'; ctx.font = '14px "Consolas", monospace';
  ctx.fillText('0-9 digitar  •  Backspace apagar  •  Enter confirmar  •  ESC cancelar', cx, by + bh - 25);
}