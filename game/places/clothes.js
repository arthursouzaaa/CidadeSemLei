// ===== LOJA DE ROUPAS: customização do personagem =====
const CL_CELL = { i: 9, j: 10 };
const CL_RECT = {
  x: CL_CELL.i * CELL + RD + 20, y: CL_CELL.j * CELL + RD + 20,
  w: CELL - RD - 40, h: CELL - RD - 40
};
const CL_DOOR = { x: CL_RECT.x + CL_RECT.w / 2, y: CL_RECT.y + CL_RECT.h + 4 };
blocks[CL_CELL.j * N + CL_CELL.i] = {
  x: CL_CELL.i * CELL + RD, y: CL_CELL.j * CELL + RD, s: CELL - RD, park: false, tr: [],
  bl: [{ x: CL_RECT.x, y: CL_RECT.y, w: CL_RECT.w, h: CL_RECT.h, z: 110, col: '#7c3aed' }]
};

const SHIRTS = ['#f97316', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#e5e7eb', '#111827'];
const PANTS = ['#1f2937', '#374151', '#0f766e', '#7c2d12', '#4c1d95'];
const CLOTHES_PRICE = 150;

function clothesNear() { return !P.veh && hyp(P.x - CL_DOOR.x, P.y - CL_DOOR.y) < 70; }

function clothesBuyShirt() {
  if (money < CLOTHES_PRICE) return toast('Dinheiro insuficiente ($' + CLOTHES_PRICE + ')');
  money -= CLOTHES_PRICE;
  look.shirt = pick(SHIRTS.filter(c => c !== look.shirt));
  P.col = look.shirt;
  saveGame();
  snd(900, .1, 'sine', .05, 300);
  toast('Camisa nova! (-$' + CLOTHES_PRICE + ')');
}

function clothesBuyPants() {
  if (money < CLOTHES_PRICE) return toast('Dinheiro insuficiente ($' + CLOTHES_PRICE + ')');
  money -= CLOTHES_PRICE;
  look.pants = pick(PANTS.filter(c => c !== look.pants));
  saveGame();
  snd(900, .1, 'sine', .05, 300);
  toast('Calça nova! (-$' + CLOTHES_PRICE + ')');
}

addEventListener('keydown', e => {
  if (st === 'play' && e.code === 'KeyT' && clothesNear()) { st = 'clothes'; return; }
  if (st === 'clothes') {
    if (e.code === 'Escape' || e.code === 'KeyT') { st = 'play'; return; }
    if (e.code === 'Digit1') clothesBuyShirt();
    if (e.code === 'Digit2') clothesBuyPants();
  }
});

function drawClothesBuilding() {
  const b = CL_RECT;
  ctx.fillStyle = '#c4b5fd'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('ROUPAS', b.x + b.w / 2, b.y + b.h / 2 + 6);
  const dw = 56, dh = 12, dx = CL_DOOR.x - dw / 2, dy = b.y + b.h - 2;
  ctx.fillStyle = '#1c1917'; ctx.fillRect(dx, dy, dw, dh + 6);
  ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, dw, dh + 6);
}

function drawClothesHint() {
  if (st === 'play' && clothesNear()) label('[T] Entrar na loja de roupas', W / 2, H - 180, 18, '#c4b5fd', 'center');
}

function drawClothesOverlay() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(2,6,23,.92)'; ctx.fillRect(0, 0, W, H);
  label('LOJA DE ROUPAS', W / 2, H / 2 - 150, 44, '#c4b5fd', 'center');
  label('Dinheiro: $' + money.toLocaleString('pt-BR'), W / 2, H / 2 - 110, 20, '#facc15', 'center');
  label('[1] Camisa (muda a cor do personagem) - $' + CLOTHES_PRICE, W / 2, H / 2 - 40, 22, '#fff', 'center');
  label('[2] Calça (muda a cor das pernas) - $' + CLOTHES_PRICE, W / 2, H / 2 + 10, 22, '#fff', 'center');
  label('ESC ou T para sair', W / 2, H - 40, 14, '#94a3b8', 'center');
}

const _poisClothes = mapPois;
mapPois = function () {
  const L = _poisClothes();
  L.push({ key: 'roupas', name: 'Loja de Roupas', icon: '👕', col: '#c4b5fd', x: CL_DOOR.x, y: CL_DOOR.y });
  return L;
};