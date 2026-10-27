// ===== TRABALHO HONESTO: PIZZARIA, SUSHI E HAMBURGUERIA =====
const DELIVERY = {
  pizza:  { pmin: 50, pmax: 80, len: 4, dmin: 400,  dmax: 800 },
  sushi:  { pmin: 150, pmax: 150, len: 6, dmin: 900, dmax: 1400 },
  burger: { pmin: 300, pmax: 300, len: 4, dmin: 1800, dmax: 2600 }
};
const RESTS = [
  { name: 'Pizzaria',     type: 'pizza',  cell: [8, 13], col: '#b91c1c', tag: 'PIZZARIA' },
  { name: 'Sushi',        type: 'sushi',  cell: [7, 7],  col: '#0e7490', tag: 'SUSHI' },
  { name: 'Hamburgueria', type: 'burger', cell: [5, 2],  col: '#a16207', tag: 'BURGER' }
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
  order = {
    type: r.type, rest: r.name, pay: Math.round(rnd(cfg.pmin, cfg.pmax)), len: cfg.len, code,
    dx: dest[0], dy: dest[1],
    elapsed: 0, called: false, cold: false,
    lastCar: 0, lastCarRef: null, cd: 0, lastP: P.hp
  };
  toast('Pedido pronto! Código de entrega: ' + code);
  snd(700, .15, 'triangle', .06, 300);
  autoRouteDelivery();
}

function tryRestaurant() {
  if (st !== 'play') return false;
  if (order && hyp(P.x - order.dx, P.y - order.dy) < 70) { openCode(); return true; }
  if (P.veh) return false;
  for (const r of RESTS) {
    if (hyp(P.x - r.door.x, P.y - r.door.y) < 70) {
      if (order) toast('Entregue o pedido atual primeiro (' + order.rest + ').');
      else makeOrder(r);
      return true;
    }
  }
  return false;
}

function openCode() { st = 'code'; codeBuf = ''; }

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
      o.cd = .8; o.pay = Math.max(0, o.pay - 20); toast('A pizza amassou! -$20');
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

function drawDeliveryHud() {
  if (st !== 'play') return;
  if (order) {
    const t = Math.ceil(COLD_AT - order.elapsed);
    const status = order.cold ? 'FRIA' : order.called ? 'cliente ligando!' : ('esfria em ' + Math.max(0, t) + 's');
    label('Pedido: ' + order.rest + '  •  $' + order.pay + '  •  código ' + order.code + '  •  ' + status, W / 2, 150, 16, '#f0abfc', 'center');
    if (hyp(P.x - order.dx, P.y - order.dy) < 70) label('[E] Entregar pedido', W / 2, H - 210, 18, '#e879f9', 'center');
    return;
  }
  if (P.veh) return;
  for (const r of RESTS) {
    if (hyp(P.x - r.door.x, P.y - r.door.y) < 70) {
      label('[E] Pedir no balcão (' + r.name + ')', W / 2, H - 210, 18, '#fde68a', 'center');
      return;
    }
  }
}

function drawCodeOverlay() {
  if (!order) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,10,.55)'; ctx.fillRect(0, 0, W, H);
  const bw = 480, bh = 300, bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
  ctx.fillStyle = 'rgba(20,20,40,.97)'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#f0abfc'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
  label('Entrega: ' + order.rest, W / 2, by + 36, 22, '#f0abfc', 'center');
  label('Código do cliente: ' + order.code, W / 2, by + 80, 26, '#facc15', 'center');
  label('Digite o código abaixo e aperte Enter', W / 2, by + 112, 14, '#cbd5e1', 'center');
  let slots = '';
  for (let k = 0; k < order.len; k++) slots += (codeBuf[k] || '_') + ' ';
  label(slots.trim(), W / 2, by + 180, 40, '#fde047', 'center');
  label('Backspace apagar  •  Esc cancelar', W / 2, by + bh - 20, 14, '#94a3b8', 'center');
}