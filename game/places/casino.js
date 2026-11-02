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
let casinoAnimTimer = 0;

function casinoNear() { return !P.veh && hyp(P.x - CA_DOOR.x, P.y - CA_DOOR.y) < 70; }

function casinoOpen() {
  casinoState = { reels: [pick(CASINO_SYMBOLS), pick(CASINO_SYMBOLS), pick(CASINO_SYMBOLS)], spinT: 0, spinning: false, msg: '' };
  casinoAnimTimer = 0;
  st = 'casino';
}

function casinoSpin() {
  if (!casinoState || casinoState.spinning) return;
  if (money < CASINO_BET) { casinoState.msg = 'Saldo insuficiente para apostar $' + CASINO_BET; return; }
  money -= CASINO_BET;
  casinoState.spinning = true;
  casinoState.spinT = 1.5;
  casinoState.msg = 'GIRANDO...';
  snd(400, .2, 'triangle', .05);
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
        casinoState.msg = 'VOCÊ GANHOU $' + win + '!';
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
  if (st === 'play' && e.code === 'KeyE' && casinoNear()) { casinoOpen(); return; }
  if (st === 'casino') {
    if (e.code === 'Escape' || e.code === 'KeyE') { st = 'play'; casinoState = null; return; }
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
  if (st === 'play' && casinoNear()) label('[E] Entrar no cassino', W / 2, H - 210, 18, '#fca5a5', 'center');
}

function drawCasinoOverlay() {
  if (!casinoState) return;
  
  // Animação de entrada
  if (casinoAnimTimer < 1) casinoAnimTimer += 0.1;
  const animScale = 0.95 + (0.05 * casinoAnimTimer);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0, 0, 5, 0.8)'; ctx.fillRect(0, 0, W, H);

  const bw = 680, bh = 520;
  const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;

  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.scale(animScale, animScale);
  ctx.translate(-W/2, -H/2);

  // Painel de Vidro escuro com borda vermelha (cor do cassino)
  drawPremiumPanel(bx, by, bw, bh, '#fca5a5');

  const cx = W / 2;
  let startY = by + 80;

  // Título
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fca5a5';
  ctx.font = 'bold 32px "Segoe UI", sans-serif';
  ctx.shadowColor = '#fca5a5'; ctx.shadowBlur = 10;
  ctx.fillText('🎰 CASSINO', cx, startY);
  ctx.shadowBlur = 0;

  ctx.font = '14px "Consolas", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('SORTE GRANDE, VIDA LOUCA', cx, startY + 20);

  // Dinheiro atual
  ctx.font = 'bold 24px "Consolas", monospace';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('$' + money.toLocaleString('pt-BR'), cx, startY + 60);

  startY += 100;

  // Desenha os Rolos (Slots)
  const slotW = 100, slotH = 100, spacing = 120;
  const startX = cx - spacing; // Centraliza os 3 slots

  for (let i = 0; i < 3; i++) {
    const sx = startX + i * spacing;
    
    // Fundo do Slot
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.roundRect(sx - slotW/2, startY, slotW, slotH, 12); ctx.fill();
    
    // Borda do Slot (Brilha se estiver girando)
    ctx.strokeStyle = casinoState.spinning ? '#facc15' : '#fca5a5';
    ctx.lineWidth = 3;
    if (casinoState.spinning) {
      ctx.shadowColor = '#facc15'; ctx.shadowBlur = 15;
    }
    ctx.beginPath(); ctx.roundRect(sx - slotW/2, startY, slotW, slotH, 12); ctx.stroke();
    ctx.shadowBlur = 0;

    // Ícone do Slot
    ctx.font = '48px "Segoe UI Emoji", "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    
    // Se estiver girando, mostra um ponto de interrogação piscando
    if (casinoState.spinning) {
      ctx.fillStyle = Math.floor(tm * 10) % 2 ? '#facc15' : '#fff';
      ctx.fillText('?', sx, startY + slotH/2 + 5);
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillText(casinoState.reels[i], sx, startY + slotH/2 + 5);
    }
    ctx.textBaseline = 'alphabetic';
  }

  startY += slotH + 40;

  // Mensagem de Feedback
  if (casinoState.msg) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillStyle = casinoState.msg.includes('GANHOU') ? '#4ade80' : (casinoState.msg.includes('GIRANDO') ? '#facc15' : '#f87171');
    ctx.fillText(casinoState.msg, cx, startY);
  }
  
  startY += 50;

  // Botão de Girar
  const btnW = 300, btnH = 60;
  const btnX = cx - btnW/2;
  const hover = mouseInRect(mouse.x, mouse.y, btnX, startY, btnW, btnH);
  
  if (hover && !casinoState.spinning) {
    ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 20;
  }
  
  const btnColor = casinoState.spinning ? '#475569' : (money >= CASINO_BET ? '#4ade80' : '#f87171');
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath(); ctx.roundRect(btnX, startY, btnW, btnH, 12); ctx.fill();
  ctx.strokeStyle = btnColor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(btnX, startY, btnW, btnH, 12); ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.textAlign = 'center';
  ctx.fillStyle = btnColor;
  ctx.font = 'bold 22px "Consolas", monospace';
  ctx.fillText(casinoState.spinning ? 'GIRANDO...' : '[1] GIRAR ($' + CASINO_BET + ')', cx, startY + 38);

  // Lógica de Clique no botão de Girar
  if (mouse.clicked && hover && !casinoState.spinning) {
    casinoSpin();
    mouse.clicked = false;
  }

  ctx.restore();

  // Rodapé
  ctx.textAlign = 'center'; ctx.fillStyle = '#475569'; ctx.font = '14px "Consolas", monospace';
  ctx.fillText('ESC: SAIR', cx, by + bh - 25);
}

addEventListener('mousedown', e => {
  if (st === 'casino' && e.button === 0) {
    const bw = 680, bh = 520;
    const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
    if (!mouseInRect(e.clientX, e.clientY, bx, by, bw, bh)) {
      st = 'play';
      casinoState = null;
    }
  }
});

const _poisCasino = mapPois;
mapPois = function () {
  const L = _poisCasino();
  L.push({ key: 'cassino', name: 'Cassino', icon: '🎰', col: '#fca5a5', x: CA_DOOR.x, y: CA_DOOR.y });
  return L;
};