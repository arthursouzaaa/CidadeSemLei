// ===== SAFEHOUSES: casas compráveis que servem de spawn, save e cura =====
// Ids fixos: o save guarda os ids comprados, então a ordem da lista não importa.
const HOUSE_DEFS = [
  { id: 'periferia1', n: 'Casa da Periferia', region: 'periferia', price: 8000,  cell: [1, 10],  roof: '#92400e' },
  { id: 'periferia2', n: 'Casa da Periferia II', region: 'periferia', price: 8000,  cell: [3, 13], roof: '#78350f' },
  { id: 'industrial1', n: 'Casa Industrial', region: 'industrial', price: 12000, cell: [12, 5], roof: '#57534e' },
  { id: 'centro1',    n: 'Cobertura do Centro', region: 'centro', price: 25000, cell: [7, 1],  roof: '#334155' },
  { id: 'praia1',     n: 'Casa da Praia', region: 'praia', price: 40000, cell: [12, 14], roof: '#0891b2' },
  { id: 'resid1',     n: 'Casa Residencial', region: 'residencial', price: 10000, cell: [2, 6],  roof: '#7c2d12' },
  { id: 'resid2',     n: 'Casa Residencial II', region: 'residencial', price: 15000, cell: [14, 3], roof: '#4c1d95' }
];

// Monta o retângulo, a porta e o ponto de spawn de cada casa
for (const h of HOUSE_DEFS) {
  const [i, j] = h.cell;
  h.rect = { x: i * CELL + RD + 24, y: j * CELL + RD + 24, w: CELL - RD - 48, h: CELL - RD - 48 };
  h.door = { x: h.rect.x + h.rect.w / 2, y: h.rect.y + h.rect.h + 4 };
  h.spawn = { x: h.door.x, y: h.door.y - 20 };
}

function houseById(id) { return HOUSE_DEFS.find(h => h.id === id) || null; }
function ownsHouse(id) { return Array.isArray(houses) && houses.includes(id); }
function houseNear() {
  if (P.veh) return null;
  for (const h of HOUSE_DEFS) if (hyp(P.x - h.door.x, P.y - h.door.y) < 70) return h;
  return null;
}

// Compra com a carteira. Depois de comprada, a casa vira spawn e ponto de cura.
function buyHouse(h) {
  if (ownsHouse(h.id)) { toast('Você já é dono desta casa.'); return; }
  if (money < h.price) { toast('Dinheiro insuficiente ($' + h.price + ')'); snd(150, .2, 'square', .05); return; }
  money -= h.price;
  houses.push(h.id);
  spawnHouse = h.id;
  saveGame();
  snd(900, .1, 'sine', .05, 300);
  toast('Você comprou: ' + h.n + ' (-$' + h.price + ')');
}

// Salvar e curar: E na porta de uma casa que você possui
function useHouse(h) {
  P.hp = 100;
  spawnHouse = h.id;
  saveGame();
  toast('Você descansou e o jogo foi salvo na ' + h.n + '.');
}

// Respawn: casa comprada mais recente (spawnHouse), senão o hospital (SX, SY)
function respawnPoint() {
  const h = spawnHouse && ownsHouse(spawnHouse) ? houseById(spawnHouse) : null;
  return h ? h.spawn : { x: SX, y: SY };
}

// Tecla E: compra ou usa casa. Retorna true se tratou a ação.
function tryHouse() {
  const h = houseNear();
  if (!h) return false;
  if (ownsHouse(h.id)) useHouse(h);
  else buyHouse(h);
  return true;
}

function drawHouse(h) {
  const r = h.rect;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(r.x + 8, r.y + 8, r.w, r.h);
  ctx.fillStyle = h.roof; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
  // telhado com detalhe por região
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(r.x + 10, r.y + 10, r.w - 20, r.h - 20);
  if (h.region === 'praia') { // varanda com listras
    ctx.fillStyle = '#e0f2fe'; ctx.fillRect(r.x, r.y + r.h - 10, r.w, 6);
  } else if (h.region === 'periferia') { // pequeno jardim
    ctx.fillStyle = '#4d7c0f'; ctx.fillRect(r.x + 4, r.y - 8, r.w - 8, 6);
  } else if (h.region === 'centro') { // antena no topo
    ctx.fillStyle = '#9ca3af'; ctx.fillRect(r.x + r.w / 2 - 1, r.y - 14, 2, 14);
  } else { // residencial: chaminé
    ctx.fillStyle = '#6b7280'; ctx.fillRect(r.x + r.w - 16, r.y + 6, 8, 12);
  }
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
  else label('[E] Comprar ' + h.n + ' ($' + h.price + ')', W / 2, H - 240, 18, '#facc15', 'center');
}

// Ícone das casas no mapa grande
const _poisHouse = mapPois;
mapPois = function () {
  const L = _poisHouse();
  for (const h of HOUSE_DEFS) {
    L.push({ key: 'casa-' + h.id, name: h.n + (ownsHouse(h.id) ? ' (sua)' : ' ($' + h.price + ')'), icon: '🏠', col: ownsHouse(h.id) ? '#4ade80' : '#facc15', x: h.door.x, y: h.door.y });
  }
  return L;
};