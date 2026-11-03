// ===== SAFEHOUSES =====
const HOUSE_DEFS = [
  { id: 'periferia1', n: 'Casa da Periferia', region: 'periferia', price: 8000,  cell: [1, 10],  roof: '#92400e' },
  { id: 'periferia2', n: 'Casa da Periferia II', region: 'periferia', price: 8000,  cell: [3, 13],  roof: '#78350f' },
  { id: 'industrial1', n: 'Casa Industrial', region: 'industrial', price: 12000, cell: [12, 5], roof: '#57534e' },
  { id: 'centro1',    n: 'Cobertura do Centro', region: 'centro', price: 25000, cell: [7, 1],  roof: '#334155' },
  { id: 'praia1',     n: 'Casa da Praia', region: 'praia', price: 40000, cell: [12, 14], roof: '#0891b2' },
  { id: 'resid1',     n: 'Casa Residencial', region: 'residencial', price: 10000, cell: [2, 6],  roof: '#7c2d12' },
  { id: 'resid2',     n: 'Casa Residencial II', region: 'residencial', price: 15000, cell: [14, 3], roof: '#4c1d95' }
];
let safehouseAnimTimer = 0;
let selectedHouse = null;

for (const h of HOUSE_DEFS) {
  const [i, j] = h.cell;
  h.rect = { x: i * CELL + RD + 24, y: j * CELL + RD + 24, w: CELL - RD - 48, h: CELL - RD - 48 };
  h.door = { x: h.rect.x + h.rect.w / 2, y: h.rect.y + h.rect.h + 4 };
  h.spawn = { x: h.door.x, y: h.door.y - 20 };
}

function houseById(id) { return HOUSE_DEFS.find(h => h.id === id) || null; }
function ownsHouse(id) { return Array.isArray(houses) && houses.includes(id); }

// Distância da porta: maior que a área de colisão, para o E funcionar a pé ou de carro parado
function houseNear() {
  for (const h of HOUSE_DEFS) if (hyp(P.x - h.door.x, P.y - h.door.y) < 90) return h;
  return null;
}

function buyHouse(h) {
  if (ownsHouse(h.id)) return;
  if (money < h.price) { toast('Dinheiro insuficiente ($' + h.price + ')'); snd(150, .2, 'square', .05); return; }
  money -= h.price;
  houses.push(h.id);
  spawnHouse = h.id;
  saveGame();
  snd(900, .1, 'sine', .05, 300);
  toast('Você comprou: ' + h.n + ' (-$' + h.price + ')');
}

function useHouse(h) {
  P.hp = 100;
  spawnHouse = h.id;
  saveGame();
  toast('Você descansou e o jogo foi salvo na ' + h.n + '.');
  st = 'play';
}

function respawnPoint() {
  const h = spawnHouse && ownsHouse(spawnHouse) ? houseById(spawnHouse) : null;
  return h ? h.spawn : { x: SX, y: SY };
}

function drawHouse(h) {
  const r = h.rect;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(r.x + 8, r.y + 8, r.w, r.h);
  ctx.fillStyle = h.roof; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(r.x + 10, r.y + 10, r.w - 20, r.h - 20);
  const owned = ownsHouse(h.id);
  ctx.fillStyle = owned ? '#0f172a' : '#1f2937';
  ctx.fillRect(h.door.x - 6, h.door.y - 12, 12, 16);
  ctx.strokeStyle = owned ? '#4ade80' : '#facc15'; ctx.lineWidth = 2;
  ctx.strokeRect(h.door.x - 6, h.door.y - 12, 12, 16);
}

function drawHouses(x0, y0, x1, y1) {
  for (const h of HOUSE_DEFS) {
    if (h.door.x < x0 - 80 || h.door.x > x1 + 80 || h.door.y < y0 - 80 || h.door.y > y1 + 80) continue;
    drawHouse(h);
  }
}

function drawHouseHint() {
  if (st !== 'play') return;
  const h = houseNear();
  if (!h) return;
  if (ownsHouse(h.id)) label('[E] Descansar e salvar (' + h.n + ')', W / 2, H - 240, 18, '#4ade80', 'center');
  else label('[E] Ver imóvel: ' + h.n + ' ($' + h.price + ')', W / 2, H - 240, 18, '#facc15', 'center');
}

function drawSafehouseOverlay() {
  const h = selectedHouse;
  if (!h) { st = 'play'; return; }
  if (safehouseAnimTimer < 1) safehouseAnimTimer += 0.1;
  const animScale = 0.95 + (0.05 * safehouseAnimTimer);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0, 0, 5, 0.75)'; ctx.fillRect(0, 0, W, H);

  const bw = 680, bh = 500;
  const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(animScale, animScale);
  ctx.translate(-W / 2, -H / 2);

  drawPremiumPanel(bx, by, bw, bh, '#facc15');

  const cx = W / 2;
  let startY = by + 70;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 28px "Segoe UI", sans-serif';
  ctx.shadowColor = '#facc15'; ctx.shadowBlur = 10;
  ctx.fillText('🏠 IMOBILIÁRIA', cx, startY);
  ctx.shadowBlur = 0;

  ctx.font = '14px "Consolas", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('IMÓVEIS DISPONÍVEIS', cx, startY + 20);

  startY += 60;

  ctx.font = 'bold 24px "Segoe UI", sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(h.n.toUpperCase(), cx, startY);

  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Região: ' + (h.region.charAt(0).toUpperCase() + h.region.slice(1)), cx, startY + 25);

  startY += 70;

  ctx.font = 'bold 18px "Consolas", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('VALOR DO IMÓVEL', cx, startY);

  ctx.font = 'bold 36px "Consolas", monospace';
  ctx.fillStyle = '#facc15';
  ctx.shadowColor = '#facc15'; ctx.shadowBlur = 10;
  ctx.fillText('$' + h.price.toLocaleString('pt-BR'), cx, startY + 35);
  ctx.shadowBlur = 0;

  ctx.font = '16px "Consolas", monospace';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('Seu saldo: $' + money.toLocaleString('pt-BR'), cx, startY + 65);

  startY += 110;

  const btnW = 400, btnH = 64;
  const btnX = cx - btnW / 2;
  const canBuy = money >= h.price;
  const hover = mouseInRect(mouse.x, mouse.y, btnX, startY, btnW, btnH);

  if (hover && canBuy) { ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 20; }

  const bgGrad = ctx.createLinearGradient(btnX, startY, btnX, startY + btnH);
  bgGrad.addColorStop(0, hover && canBuy ? 'rgba(34, 197, 94, 0.2)' : 'rgba(15, 23, 42, 0.9)');
  bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
  ctx.fillStyle = bgGrad;
  ctx.beginPath(); ctx.roundRect(btnX, startY, btnW, btnH, 12); ctx.fill();

  ctx.strokeStyle = canBuy ? '#4ade80' : '#f87171';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(btnX, startY, btnW, btnH, 12); ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.textAlign = 'center';
  ctx.fillStyle = canBuy ? '#4ade80' : '#f87171';
  ctx.font = 'bold 20px "Consolas", monospace';
  ctx.fillText(canBuy ? '[1] COMPRAR CASA' : 'DINHEIRO INSUFICIENTE', cx, startY + 40);

  if (mouse.clicked && hover && canBuy) {
    buyHouse(h);
    useHouse(h);
    selectedHouse = null;
    mouse.clicked = false;
  }

  ctx.restore();
  ctx.textAlign = 'center'; ctx.fillStyle = '#475569'; ctx.font = '14px "Consolas", monospace';
  ctx.fillText('ESC: CANCELAR', cx, by + bh - 25);
}

// E abre a casa (ou descansa, se for sua). Este listener roda depois do interact.js,
// que ignora o E quando há casa por perto, então não há disparo duplo.
addEventListener('keydown', e => {
  if (st === 'play' && e.code === 'KeyE' && !garageAnim) {
    const h = houseNear();
    if (!h) return;
    if (ownsHouse(h.id)) { useHouse(h); return; }
    selectedHouse = h;
    st = 'safehouse';
    safehouseAnimTimer = 0;
    return;
  }
  if (st === 'safehouse') {
    if (e.code === 'Escape' || e.code === 'KeyE') { st = 'play'; selectedHouse = null; return; }
    if (e.code === 'Digit1') {
      const h = selectedHouse;
      if (h && money >= h.price) { buyHouse(h); useHouse(h); selectedHouse = null; }
    }
  }
});

addEventListener('mousedown', e => {
  if (st === 'safehouse' && e.button === 0) {
    const bw = 680, bh = 500;
    const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
    if (!mouseInRect(e.clientX, e.clientY, bx, by, bw, bh)) {
      st = 'play';
      selectedHouse = null;
    }
  }
});

if (typeof mapPois === 'function') {
  const _poisHouse = mapPois;
  mapPois = function () {
    const L = _poisHouse();
    for (const h of HOUSE_DEFS) {
      L.push({ key: 'casa-' + h.id, name: h.n + (ownsHouse(h.id) ? ' (sua)' : ' ($' + h.price + ')'), icon: '🏠', col: ownsHouse(h.id) ? '#4ade80' : '#facc15', x: h.door.x, y: h.door.y });
    }
    return L;
  };
}