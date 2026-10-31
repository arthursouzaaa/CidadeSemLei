// ===== CASSINO: caça-níqueis =====
const CA_CELL = { i: 6, j: 8 };
const CA_RECT = {
  x: CA_CELL.i * CELL + RD + 20, y: CA_CELL.j * CELL + RD + 20,
  w: CELL - RD - 40, h: CELL - RD - 40
};
const CA_DOOR = { x: CA_RECT.x + CA_RECT.w / 2, y: CA_RECT.y + CA_RECT.h + 4 };
blocks[CA_CELL.j * N + CA_CELL.i] = {
  x: CA_CELL.i * CELL + RD, y: CA_CELL.j * CELL + RD, s: CELL - RD, park: false, tr: [],
  bl: [{ x: CA_RECT.x, y: CA_RECT.y, w: CA_RECT.w, h: CA_RECT.h, z: 180, col: '#b91c1c' }]
};

const CASINO_BET = 100;
const CASINO_SYMBOLS = ['🍒', '🔔', '💎', '7️⃣', '🍋', '⭐'];
let casinoState = null;

function casinoNear() { return !P.veh && hyp(P.x - CA_DOOR.x, P.y - CA_DOOR.y) < 70; }

function casinoOpen() {
  casinoState = { reels: [pick(CASINO_SYMBOLS), pick(CASINO_SYMBOLS), pick(CASINO_SYMBOLS)], spinT: 0, spinning: false, msg: '' };
  st = 'casino';
}

function casinoSpin() {
  if (money < CASINO_BET) { casinoState.msg = 'Sem dinheiro para apostar $' + CASINO_BET; return; }
  money -= CASINO_BET;
  casinoState.spinning = true;
  casinoState.spinT = 1.5;
  casinoState.msg = 'Girando...';
}

function casinoUpdate(dt) {
  if (!casinoState) return;
  if (casinoState.spinning) {
    casinoState.spinT -= dt;
    if (casinoState.spinT <= 0) {
      casinoState.spinning = false;
      casinoState.reels = [pick(CASINO_SYMBOLS), pick(CASINO_SYMBOLS), pick(CASINO_SYMBOLS)];
      const [a, b, c] = casinoState.reels;
      let win = 0;
      if (a === '7️⃣' && b === '7️⃣' && c === '7️⃣') win = 5000;
      else if (a === b && b === c) win = 1000;
      else if (a === b || b === c || a === c) win = 250;
      if (win > 0) {
        money += win;
        casinoState.msg = 'Você ganhou $' + win + '!';
        snd(900, .1, 'sine', .05, 300);
      } else {
        casinoState.msg = 'Você perdeu $' + CASINO_BET;
        snd(150, .2, 'square', .05);
      }
      saveGame();
    }
  }
}

addEventListener('keydown', e => {
  if (st === 'play' && e.code === 'KeyU' && casinoNear()) { casinoOpen(); return; }
  if (st === 'casino') {
    if (e.code === 'Escape' || e.code === 'KeyU') { st = 'play'; casinoState = null; return; }
    if (e.code === 'Digit1') casinoSpin();
  }
});

function drawCasinoBuilding() {
  const b = CA_RECT;
  ctx.fillStyle = '#fca5a5'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('CASSINO', b.x + b.w / 2, b.y + b.h / 2 + 6);
  const dw = 56, dh = 12, dx = CA_DOOR.x - dw / 2, dy = b.y + b.h - 2;
  ctx.fillStyle = '#450a0a'; ctx.fillRect(dx, dy, dw, dh + 6);
  ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, dw, dh + 6);
}

function drawCasinoHint() {
  if (st === 'play' && casinoNear()) label('[U] Entrar no cassino', W / 2, H - 210, 18, '#fca5a5', 'center');
}

function drawCasinoOverlay() {
  if (!casinoState) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(10,2,2,.95)'; ctx.fillRect(0, 0, W, H);
  label('CASSINO', W / 2, H / 2 - 180, 48, '#fca5a5', 'center');
  label('Dinheiro: $' + money.toLocaleString('pt-BR'), W / 2, H / 2 - 130, 20, '#facc15', 'center');
  const cx = W / 2, cy = H / 2 - 40, sp = 80;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(cx - 1.5 * sp + i * sp - sp / 2, cy - sp / 2, sp, sp);
    ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 2;
    ctx.strokeRect(cx - 1.5 * sp + i * sp - sp / 2, cy - sp / 2, sp, sp);
    ctx.font = '40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(casinoState.reels[i], cx - 1.5 * sp + i * sp, cy);
    ctx.textBaseline = 'alphabetic';
  }
  label('[1] Girar ($' + CASINO_BET + ')', W / 2, H / 2 + 80, 22, '#fff', 'center');
  if (casinoState.msg) label(casinoState.msg, W / 2, H / 2 + 130, 18, '#fde68a', 'center');
  label('ESC ou U para sair', W / 2, H - 40, 14, '#94a3b8', 'center');
}

const _poisCasino = mapPois;
mapPois = function () {
  const L = _poisCasino();
  L.push({ key: 'cassino', name: 'Cassino', icon: '🎰', col: '#fca5a5', x: CA_DOOR.x, y: CA_DOOR.y });
  return L;
};