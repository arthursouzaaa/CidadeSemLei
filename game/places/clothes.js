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
let clothesAnimTimer = 0;

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
  if (st === 'play' && e.code === 'KeyE' && clothesNear()) { st = 'clothes'; clothesAnimTimer = 0; return; }
  if (st === 'clothes') {
    if (e.code === 'Escape' || e.code === 'KeyE') { st = 'play'; return; }
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
  if (st === 'play' && clothesNear()) label('[E] Entrar na loja de roupas', W / 2, H - 180, 18, '#c4b5fd', 'center');
}

function drawClothesOverlay() {
  if (clothesAnimTimer < 1) clothesAnimTimer += 0.1;
  const animScale = 0.95 + (0.05 * clothesAnimTimer);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0, 0, 5, 0.75)'; ctx.fillRect(0, 0, W, H);

  const bw = 720, bh = 580;
  const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;

  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.scale(animScale, animScale);
  ctx.translate(-W/2, -H/2);

  drawPremiumPanel(bx, by, bw, bh, '#c4b5fd');
  
  const cx = W / 2;
  let startY = by + 60;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#c4b5fd';
  ctx.font = 'bold 32px "Segoe UI", sans-serif';
  ctx.shadowColor = '#c4b5fd'; ctx.shadowBlur = 10;
  ctx.fillText('👕 CABINE DE ESTILO', cx, startY);
  ctx.shadowBlur = 0;
  
  ctx.font = '14px "Consolas", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('VISUALIZAÇÃO DO PERSONAGEM', cx, startY + 20);

  // --- ÁREA DO PROVADOR ---
  startY += 50;
  const holoW = 320, holoH = 260;
  const holoX = cx - holoW / 2;
  const holoY = startY;

  // Fundo do provador
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.roundRect(holoX, holoY, holoW, holoH, 16); ctx.fill();
  
  // Holofote de luz
  const lightGrad = ctx.createLinearGradient(cx, holoY, cx, holoY + holoH);
  lightGrad.addColorStop(0, 'rgba(196, 181, 253, 0.3)');
  lightGrad.addColorStop(1, 'rgba(196, 181, 253, 0)');
  ctx.fillStyle = lightGrad;
  ctx.beginPath(); ctx.roundRect(holoX, holoY, holoW, holoH, 16); ctx.fill();

  ctx.strokeStyle = 'rgba(196, 181, 253, 0.6)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(holoX, holoY, holoW, holoH, 16); ctx.stroke();

  // --- BONECO DESENHADO DE FRENTE (PROPORÇÕES HUMANAS) ---
  ctx.save();
  ctx.translate(cx, holoY + 130); // Ponto central do boneco

  // 1. Pernas (Calça)
  ctx.fillStyle = look.pants;
  // Perna Esquerda
  ctx.beginPath(); ctx.roundRect(-18, 20, 14, 50, 6); ctx.fill();
  // Perna Direita
  ctx.beginPath(); ctx.roundRect(4, 20, 14, 50, 6); ctx.fill();

  // 2. Tronco (Camisa)
  ctx.fillStyle = look.shirt;
  ctx.beginPath(); ctx.roundRect(-25, -30, 50, 60, 12); ctx.fill();

  // 3. Braços (Pele)
  ctx.fillStyle = P.skin;
  // Braço Esquerdo
  ctx.beginPath(); ctx.roundRect(-40, -20, 12, 45, 6); ctx.fill();
  // Braço Direito
  ctx.beginPath(); ctx.roundRect(28, -20, 12, 45, 6); ctx.fill();

  // 4. Pescoço e Cabeça
  ctx.fillStyle = P.skin;
  ctx.beginPath(); ctx.roundRect(-6, -45, 12, 15, 4); ctx.fill(); // Pescoço
  ctx.beginPath(); ctx.arc(0, -60, 22, 0, TAU); ctx.fill(); // Cabeça

  // 5. Cabelo
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(0, -65, 22, Math.PI, TAU); ctx.fill(); 
  ctx.beginPath(); ctx.roundRect(-22, -65, 44, 8, 2); ctx.fill();

  // 6. Detalhes (Olhos)
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-7, -60, 4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -60, 4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-7, -60, 2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -60, 2, 0, TAU); ctx.fill();

  ctx.restore();

  // Base iluminada (Chão do provador)
  ctx.fillStyle = 'rgba(196, 181, 253, 0.3)';
  ctx.beginPath(); ctx.ellipse(cx, holoY + holoH - 20, 80, 15, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, holoY + holoH - 20, 80, 15, 0, 0, TAU); ctx.stroke();

  startY += holoH + 30;

  // Botões
  const options = [
    { icon: '👕', text: 'TROCAR CAMISA', key: '[1]', color: '#c4b5fd', price: '$' + CLOTHES_PRICE, action: clothesBuyShirt },
    { icon: '👖', text: 'TROCAR CALÇA', key: '[2]', color: '#c4b5fd', price: '$' + CLOTHES_PRICE, action: clothesBuyPants }
  ];

  options.forEach((opt, i) => {
    const oy = startY + i * 65;
    drawPremiumButton(bx + 50, oy, bw - 100, 52, opt.key, opt.text, opt.price, opt.color, opt.icon);
    if (mouse.clicked && mouseInRect(mouse.x, mouse.y, bx + 50, oy, bw - 100, 52)) {
      opt.action();
      mouse.clicked = false;
    }
  });

  ctx.restore();
  
  ctx.textAlign = 'center'; ctx.fillStyle = '#475569'; ctx.font = '14px "Consolas", monospace';
  ctx.fillText('ESC: SAIR', cx, by + bh - 25);
}

addEventListener('mousedown', e => {
  if (st === 'clothes' && e.button === 0) {
    const bw = 720, bh = 580;
    const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
    if (!mouseInRect(e.clientX, e.clientY, bx, by, bw, bh)) {
      st = 'play';
    }
  }
});

const _poisClothes = mapPois;
mapPois = function () {
  const L = _poisClothes();
  L.push({ key: 'roupas', name: 'Loja de Roupas', icon: '👕', col: '#c4b5fd', x: CL_DOOR.x, y: CL_DOOR.y });
  return L;
};