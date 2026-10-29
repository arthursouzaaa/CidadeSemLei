// ===== LOJA VERDE: consumo (sem armas) =====
const SHOP_CELL = { i: 10, j: 5 };
const SHOP_RECT = {
  x: SHOP_CELL.i * CELL + RD + 20, y: SHOP_CELL.j * CELL + RD + 20,
  w: CELL - RD - 40, h: CELL - RD - 40
};
const SHOP_DOOR = { x: SHOP_RECT.x + SHOP_RECT.w / 2, y: SHOP_RECT.y + SHOP_RECT.h + 4 };
blocks[SHOP_CELL.j * N + SHOP_CELL.i] = {
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
blocks[AM_CELL.j * N + AM_CELL.i] = {
  x: AM_CELL.i * CELL + RD, y: AM_CELL.j * CELL + RD, s: CELL - RD, park: false, tr: [],
  bl: [{ x: AM_RECT.x, y: AM_RECT.y, w: AM_RECT.w, h: AM_RECT.h, z: 90, col: '#3f4a2a' }]
};
const AMMU_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'];

function shopNear() { return !P.veh && hyp(P.x - SHOP_DOOR.x, P.y - SHOP_DOOR.y) < 70; }

function shopList() {
  return [
    {
      name: () => 'Kit médico (vida cheia)',
      price: () => 120,
      check: () => P.hp >= 100 ? 'Sua vida já está cheia' : '',
      run() { P.hp = 100; }
    },
    {
      name: () => 'Curativo (+40 de vida)',
      price: () => 60,
      check: () => P.hp >= 100 ? 'Sua vida já está cheia' : '',
      run() { P.hp = Math.min(100, P.hp + 40); }
    },
    {
      name: () => 'Colete balístico (60 s, vida máx 150)',
      price: () => 400,
      check: () => '',
      run() { P.hp = Math.min(150, P.hp + 50); vestEnd = tm + 60; }
    },
    {
      name: () => 'Celular (em breve)',
      price: () => 0,
      check: () => 'Ainda não disponível',
      run() {}
    }
  ];
}

function shopBuy(i) {
  const it = shopList()[i];
  if (!it) return;
  const err = it.check();
  if (err) { toast(err); return; }
  const p = it.price();
  if (money < p) { toast('Dinheiro insuficiente ($' + p + ')'); snd(150, .2, 'square', .05); return; }
  money -= p;
  it.run();
  saveGame();
  snd(900, .1, 'sine', .05, 300);
  toast('Comprado: ' + it.name() + ' (-$' + p + ')');
}

const AMMU_WARN = 'Isso aqui é coisa do crime, parceiro. Se a polícia te pegar com isso, é cadeia na certa.';

function ammuNear() { return !P.veh && hyp(P.x - AM_DOOR.x, P.y - AM_DOOR.y) < 70; }

// Armas e munições: só na Ammu-Nation. Armas são compradas uma vez; munições são lotes.
function ammuList() {
  return [
    { name: 'Pistola', price: 2000, crime: 0, need: () => owned[0] ? 'Você já tem a pistola' : '',
      run() { owned[0] = true; ammo[0] = Infinity; } },
    { name: 'Munição Pistola (+30)', price: 150, crime: 0, need: () => owned[0] ? '' : 'Compre a pistola primeiro',
      run() { ammo[0] = Infinity; } },
    { name: 'SMG', price: 8000, crime: 0, need: () => owned[1] ? 'Você já tem a SMG' : '',
      run() { owned[1] = true; ammo[1] += 60; } },
    { name: 'Munição SMG (+60)', price: 300, crime: 0, need: () => owned[1] ? '' : 'Compre a SMG primeiro',
      run() { ammo[1] += 60; } },
    { name: 'Escopeta', price: 12000, crime: 0, need: () => owned[2] ? 'Você já tem a escopeta' : '',
      run() { owned[2] = true; ammo[2] += 12; } },
    { name: 'Munição Escopeta (+12)', price: 400, crime: 0, need: () => owned[2] ? '' : 'Compre a escopeta primeiro',
      run() { ammo[2] += 12; } },
    { name: 'Faca (silenciosa)', price: 200, crime: 0, need: () => '',
      run() { inv.faca++; } },
    { name: 'Bastão', price: 120, crime: 0, need: () => '',
      run() { inv.bastao++; } },
    { name: 'C4', price: 800, crime: 2, need: () => '',
      run() { inv.c4++; } },
    { name: 'Granada', price: 400, crime: 2, need: () => '',
      run() { inv.granada++; } },
    { name: 'Molotov', price: 250, crime: 1, need: () => '',
      run() { inv.molotov++; } }
  ];
}

function ammuBuy(i) {
  const it = ammuList()[i];
  if (!it) return;
  const err = it.need();
  if (err) { toast(err); return; }
  if (money < it.price) { toast('Dinheiro insuficiente ($' + it.price + ')'); snd(150, .2, 'square', .05); return; }
  money -= it.price;
  it.run();
  saveGame();
  snd(900, .1, 'sine', .05, 300);
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
  if (st === 'play' && e.code === 'KeyF' && shopNear()) { st = 'shop'; return; }
  if (st === 'shop') {
    if (e.code === 'Escape' || e.code === 'KeyF') { st = 'play'; return; }
    const map = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
    if (e.code in map) shopBuy(map[e.code]);
  }
  if (st === 'play' && e.code === 'KeyR' && ammuNear()) { st = 'ammu'; return; }
  if (st === 'ammu') {
    if (e.code === 'Escape' || e.code === 'KeyR') { st = 'play'; return; }
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
  if (st === 'play' && ammuNear()) label('[R] Entrar na Ammu-Nation', W / 2, H - 150, 18, '#a3e635', 'center');
}

function drawShopOverlay() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,10,.75)'; ctx.fillRect(0, 0, W, H);
  label('LOJA', W / 2, H / 2 - 150, 48, '#4ade80', 'center');
  label('Dinheiro: $' + money.toLocaleString('pt-BR'), W / 2, H / 2 - 110, 20, '#facc15', 'center');
  shopList().forEach((it, i) => {
    const y = H / 2 - 60 + i * 56, err = it.check();
    ctx.fillStyle = 'rgba(20,20,50,.9)'; ctx.fillRect(W / 2 - 260, y - 22, 520, 46);
    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.strokeRect(W / 2 - 260, y - 22, 520, 46);
    label('[' + (i + 1) + '] ' + it.name(), W / 2 - 240, y + 6, 18, '#fff');
    label(err || ('$' + it.price()), W / 2 + 240, y + 6, 18, err ? '#f87171' : '#4ade80', 'right');
  });
  label('Aperte 1-4 para comprar   •   ESC ou F para sair', W / 2, H / 2 + 230, 16, '#94a3b8', 'center');
}

function drawAmmuOverlay() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(10,12,6,.85)'; ctx.fillRect(0, 0, W, H);
  label('AMMU-NATION', W / 2, H / 2 - 190, 46, '#a3e635', 'center');
  label('"Aqui é só pra quem sabe o que quer."', W / 2, H / 2 - 152, 16, '#94a3b8', 'center');
  label('Dinheiro: $' + money.toLocaleString('pt-BR'), W / 2, H / 2 - 120, 18, '#facc15', 'center');
  ammuList().forEach((it, i) => {
    const y = H / 2 - 82 + i * 30, err = it.need();
    ctx.fillStyle = 'rgba(31,38,20,.95)'; ctx.fillRect(W / 2 - 300, y - 16, 600, 26);
    ctx.strokeStyle = it.crime ? '#b45309' : '#65a30d'; ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 300, y - 16, 600, 26);
    label('[' + (i + 1) + '] ' + it.name, W / 2 - 280, y + 3, 14, '#ecfccb');
    label(err || ('$' + it.price), W / 2 + 280, y + 3, 14, err ? '#f87171' : '#a3e635', 'right');
  });
  label('Itens em laranja são ilegais: compre e a polícia vem atrás.', W / 2, H / 2 + 236, 15, '#fb923c', 'center');
  label('Aperte 1-9 para comprar   •   ESC ou R para sair', W / 2, H / 2 + 262, 16, '#94a3b8', 'center');
}