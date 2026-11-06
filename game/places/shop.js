// ===== HELPERS DE UI (usam o painel premium do render.js) =====
function drawUICard(x, y, w, h, title, color) {
  drawPremiumPanel(x, y, w, h, color);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 30px "Segoe UI", sans-serif';
  ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.fillText(title, x + w / 2, y + 50);
  ctx.shadowBlur = 0;
}

function drawUIButton(x, y, w, h, key, text, price, color, icon) {
  drawPremiumButton(x, y, w, h, key, text, price, color, icon || '');
}

// Animação de entrada das lojas (zerada ao abrir)
let shopAnimT = 0;
let ammuAnimT = 0;

// ===== LOJA VERDE: consumo (sem armas) =====
const SHOP_CELL = { i: 10, j: 5 };
const SHOP_RECT = {
  x: SHOP_CELL.i * CELL + RD + 20, y: SHOP_CELL.j * CELL + RD + 20,
  w: CELL - RD - 40, h: CELL - RD - 40
};
const SHOP_DOOR = { x: SHOP_RECT.x + SHOP_RECT.w / 2, y: SHOP_RECT.y + SHOP_RECT.h + 4 };
blocks[SHOP_CELL.j * NW + SHOP_CELL.i] = {
  x: SHOP_CELL.i * CELL + RD, y: SHOP_CELL.j * CELL + RD, s: CELL - RD, park: false, tr: [],
  bl: [{ x: SHOP_RECT.x, y: SHOP_RECT.y, w: SHOP_RECT.w, h: SHOP_RECT.h, z: 110, col: '#14532d' }]
};

// ===== AMMU-NATION (militar, oeste da garagem) =====
const AM_CELL = { i: 4, j: 5 };
const AM_RECT = {
  x: AM_CELL.i * CELL + RD + 20, y: AM_CELL.j * CELL + RD + 20,
  w: CELL - RD - 40, h: CELL - RD - 40
};
const AM_DOOR = { x: AM_RECT.x + AM_RECT.w / 2, y: AM_RECT.y + AM_RECT.h + 4 };
blocks[AM_CELL.j * NW + AM_CELL.i] = {
  x: AM_CELL.i * CELL + RD, y: AM_CELL.j * CELL + RD, s: CELL - RD, park: false, tr: [],
  bl: [{ x: AM_RECT.x, y: AM_RECT.y, w: AM_RECT.w, h: AM_RECT.h, z: 90, col: '#3f4a2a' }]
};
const AMMU_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'];

function shopNear() { return !P.veh && hyp(P.x - SHOP_DOOR.x, P.y - SHOP_DOOR.y) < 70; }

function shopList() {
  return [
    { name: () => 'Kit médico (vida cheia)', price: () => 120, check: () => P.hp >= 100 ? 'Sua vida já está cheia' : '', run() { P.hp = 100; } },
    { name: () => 'Curativo (+40 de vida)', price: () => 60, check: () => P.hp >= 100 ? 'Sua vida já está cheia' : '', run() { P.hp = Math.min(100, P.hp + 40); } },
    { name: () => 'Colete balístico (60 s, vida máx 150)', price: () => 400, check: () => '', run() { P.hp = Math.min(150, P.hp + 50); vestEnd = tm + 60; } },
    { name: () => 'Celular (em breve)', price: () => 0, check: () => 'Ainda não disponível', run() {} }
  ];
}

function shopBuy(i) {
  const it = shopList()[i];
  if (!it) return;
  const err = it.check();
  if (err) { toast(err); return; }
  const p = it.price();
  if (money < p) { toast('Dinheiro insuficiente ($' + p + ')'); snd(150, .2, 'square', .05); return; }
  money -= p; it.run(); saveGame(); snd(900, .1, 'sine', .05, 300);
  toast('Comprado: ' + it.name() + ' (-$' + p + ')');
}

const AMMU_WARN = 'Isso aqui é coisa do crime, parceiro. Se a polícia te pegar com isso, é cadeia na certa.';

function ammuNear() { return !P.veh && hyp(P.x - AM_DOOR.x, P.y - AM_DOOR.y) < 70; }

function ammuList() {
  return [
    { name: 'Pistola', price: 2000, crime: 0, need: () => owned[0] ? 'Você já tem a pistola' : '', run() { owned[0] = true; ammo[0] = Infinity; } },
    { name: 'Munição Pistola (+30)', price: 150, crime: 0, need: () => owned[0] ? '' : 'Compre a pistola primeiro', run() { ammo[0] = Infinity; } },
    { name: 'SMG', price: 8000, crime: 0, need: () => owned[1] ? 'Você já tem a SMG' : '', run() { owned[1] = true; ammo[1] += 60; } },
    { name: 'Munição SMG (+60)', price: 300, crime: 0, need: () => owned[1] ? '' : 'Compre a SMG primeiro', run() { ammo[1] += 60; } },
    { name: 'Escopeta', price: 12000, crime: 0, need: () => owned[2] ? 'Você já tem a escopeta' : '', run() { owned[2] = true; ammo[2] += 12; } },
    { name: 'Munição Escopeta (+12)', price: 400, crime: 0, need: () => owned[2] ? '' : 'Compre a escopeta primeiro', run() { ammo[2] += 12; } },
    { name: 'Faca (silenciosa)', price: 200, crime: 0, need: () => '', run() { inv.faca++; } },
    { name: 'Bastão', price: 120, crime: 0, need: () => '', run() { inv.bastao++; } },
    { name: 'C4', price: 800, crime: 2, need: () => '', run() { inv.c4++; } },
    { name: 'Granada', price: 400, crime: 2, need: () => '', run() { inv.granada++; } },
    { name: 'Molotov', price: 250, crime: 1, need: () => '', run() { inv.molotov++; } }
  ];
}

function ammuBuy(i) {
  const it = ammuList()[i];
  if (!it) return;
  const err = it.need();
  if (err) { toast(err); return; }
  if (money < it.price) { toast('Dinheiro insuficiente ($' + it.price + ')'); snd(150, .2, 'square', .05); return; }
  money -= it.price; it.run(); saveGame(); snd(900, .1, 'sine', .05, 300);
  if (it.crime) { crime(it.crime); toast(AMMU_WARN); }
  else toast('Comprado: ' + it.name + ' (-$' + it.price + ')');
}

function updVest() {
  if (vestEnd && tm >= vestEnd) {
    vestEnd = 0;
    P.hp = Math.min(P.hp, 100);
    toast('O colete acabou.');
  }
}

addEventListener('keydown', e => {
  if (st === 'play' && e.code === 'KeyE' && shopNear()) { st = 'shop'; shopAnimT = 0; return; }
  if (st === 'shop') {
    if (e.code === 'Escape' || e.code === 'KeyE') { st = 'play'; return; }
    const map = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
    if (e.code in map) shopBuy(map[e.code]);
    return;
  }
  if (st === 'play' && e.code === 'KeyE' && ammuNear()) { st = 'ammu'; ammuAnimT = 0; return; }
  if (st === 'ammu') {
    if (e.code === 'Escape' || e.code === 'KeyE') { st = 'play'; return; }
    const i = AMMU_KEYS.indexOf(e.code);
    if (i >= 0) ammuBuy(i);
  }
});

function drawShopBuilding() {
  const b = SHOP_RECT;
  ctx.fillStyle = '#4ade80'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('LOJA', b.x + b.w / 2, b.y + b.h / 2 + 6);
  const dw = 56, dh = 12, dx = SHOP_DOOR.x - dw / 2, dy = b.y + b.h - 2;
  ctx.fillStyle = '#052e16'; ctx.fillRect(dx, dy, dw, dh + 6);
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, dw, dh + 6);
}

function drawAmmuBuilding() {
  const b = AM_RECT;
  ctx.fillStyle = '#3f4a2a'; ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  for (let k = 0; k < 6; k++) ctx.fillRect(b.x + 8 + k * 30, b.y + 8, 18, b.h - 16);
  ctx.strokeStyle = '#65a30d'; ctx.lineWidth = 2; ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = '#d9f99d'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('AMMU-NATION', b.x + b.w / 2, b.y + b.h / 2 + 5);
  const dw = 56, dh = 12, dx = AM_DOOR.x - dw / 2, dy = b.y + b.h - 2;
  ctx.fillStyle = '#1a1f10'; ctx.fillRect(dx, dy, dw, dh + 6);
  ctx.strokeStyle = '#a3e635'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, dw, dh + 6);
}

function drawAmmuPrompt() {
  if (st === 'play' && ammuNear()) label('[E] Entrar na Ammu-Nation', W / 2, H - 150, 18, '#a3e635', 'center');
}

function drawShopOverlay() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (shopAnimT < 1) shopAnimT += 0.1;
  const animScale = 0.95 + 0.05 * shopAnimT;

  ctx.fillStyle = 'rgba(0, 0, 5, 0.75)'; ctx.fillRect(0, 0, W, H);

  const bw = 680, bh = 560;
  const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
  const cx = W / 2;

  ctx.save();
  ctx.translate(cx, H / 2);
  ctx.scale(animScale, animScale);
  ctx.translate(-cx, -H / 2);

  drawPremiumPanel(bx, by, bw, bh, '#4ade80');

  ctx.textAlign = 'center';
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 32px "Segoe UI", sans-serif';
  ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 10;
  ctx.fillText('🛒 LOJA 24H', cx, by + 55);
  ctx.shadowBlur = 0;

  ctx.font = '14px "Consolas", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('KIT DE SOBREVIVÊNCIA E CONVENIÊNCIA', cx, by + 80);

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.roundRect(bx + 40, by + 100, bw - 80, 44, 12); ctx.fill();
  ctx.textAlign = 'left';
  ctx.font = '14px "Consolas", monospace'; ctx.fillStyle = '#94a3b8';
  ctx.fillText('SEU SALDO', bx + 60, by + 127);
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px "Consolas", monospace'; ctx.fillStyle = '#4ade80';
  ctx.fillText('$' + money.toLocaleString('pt-BR'), bx + bw - 60, by + 130);

  const items = shopList();
  const descs = [
    'Restaura a vida ao máximo',
    'Recupera 40 de vida',
    'Vida máx 150 por 60 segundos',
    'Disponível em uma atualização futura'
  ];
  const startY = by + 170;
  items.forEach((it, i) => {
    const oy = startY + i * 82;
    const err = it.check();
    const disabled = !!err || i === 3;
    const price = it.price();
    const color = disabled ? '#475569' : '#4ade80';
    const hover = !disabled && mouseInRect(mouse.x, mouse.y, bx + 40, oy, bw - 80, 66);

    ctx.save();
    if (hover) { ctx.shadowColor = color; ctx.shadowBlur = 14; }
    ctx.fillStyle = hover ? 'rgba(30,41,59,1)' : 'rgba(15,23,42,0.85)';
    ctx.beginPath(); ctx.roundRect(bx + 40, oy, bw - 80, 66, 12); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = hover ? color : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(bx + 40, oy, bw - 80, 66, 12); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(bx + 40, oy, 6, 66, [12, 0, 0, 12]); ctx.fill();
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.fillStyle = disabled ? '#64748b' : (hover ? '#fff' : '#e2e8f0');
    ctx.font = 'bold 17px "Segoe UI", sans-serif';
    ctx.fillText('[' + (i + 1) + '] ' + it.name(), bx + 65, oy + 30);
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(descs[i], bx + 65, oy + 52);

    ctx.textAlign = 'right';
    ctx.font = 'bold 20px "Consolas", monospace';
    ctx.fillStyle = disabled ? '#64748b' : (price > money ? '#f87171' : '#facc15');
    const label2 = i === 3 ? 'EM BREVE' : (err ? '' : '$' + price);
    ctx.fillText(label2, bx + bw - 60, oy + 40);
    if (err && i !== 3) {
      ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillStyle = '#f87171';
      ctx.fillText(err, bx + bw - 60, oy + 58);
    }

    if (mouse.clicked && hover) {
      shopBuy(i);
      mouse.clicked = false;
    }
  });

  ctx.restore();

  ctx.textAlign = 'center'; ctx.fillStyle = '#475569'; ctx.font = '14px "Consolas", monospace';
  ctx.fillText('1-4 comprar  •  ESC ou E: sair', cx, by + bh - 25);
}

function drawAmmuOverlay() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (ammuAnimT < 1) ammuAnimT += 0.1;
  ctx.fillStyle = 'rgba(0, 0, 5, 0.8)'; ctx.fillRect(0, 0, W, H);
  const bw = 640, bh = 640;
  const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
  const cx = W / 2;
  let startY = by + 100;
  drawUICard(bx, by, bw, bh, '🔫 AMMU-NATION', '#a3e635');

  ctx.textAlign = 'center'; ctx.fillStyle = '#facc15'; ctx.font = 'bold 20px "Segoe UI", sans-serif';
  ctx.fillText('Dinheiro: $' + money.toLocaleString('pt-BR'), cx, startY - 20);
  ctx.font = 'italic 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#94a3b8';
  ctx.fillText('"Aqui é só pra quem sabe o que quer."', cx, startY + 5);
  startY += 30;

  ammuList().forEach((it, i) => {
    const oy = startY + i * 42;
    const err = it.need();
    const col = it.crime ? '#f87171' : '#a3e635';
    const prefix = it.crime ? '⚠️ ' : '';

    const hover = mouseInRect(mouse.x, mouse.y, bx + 40, oy, bw - 80, 36);
    ctx.fillStyle = hover ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.roundRect(bx + 40, oy, bw - 80, 36, 8); ctx.fill();
    ctx.fillStyle = err ? '#475569' : col;
    ctx.beginPath(); ctx.roundRect(bx + 40, oy, 6, 36, [8, 0, 0, 8]); ctx.fill();

    ctx.textAlign = 'left'; ctx.fillStyle = err ? '#94a3b8' : '#fff'; ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('[' + (i + 1) + '] ' + prefix + it.name, bx + 65, oy + 23);
    ctx.textAlign = 'right'; ctx.fillStyle = err ? '#ef4444' : col; ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText(err || ('$' + it.price), bx + bw - 60, oy + 23);

    if (mouse.clicked && hover && !err) {
      ammuBuy(i);
      mouse.clicked = false;
    }
  });

  ctx.textAlign = 'center'; ctx.fillStyle = '#fb923c'; ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillText('Itens com ⚠️ são ilegais e aumentam o nível de procurado.', cx, by + bh - 50);
  ctx.fillStyle = '#64748b';
  ctx.fillText('ESC ou E para sair', cx, by + bh - 25);
}

addEventListener('mousedown', e => {
  if ((st === 'shop' || st === 'ammu') && e.button === 0) {
    const bw = 640, bh = st === 'shop' ? 680 : 640;
    const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
    if (!mouseInRect(e.clientX, e.clientY, bx, by, bw, bh)) {
      st = 'play';
    }
  }
});