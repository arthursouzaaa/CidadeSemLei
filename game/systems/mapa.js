// ===== MAPA GRANDE (abre clicando no minimapa ou com N) =====
const MM = { S: 84 };
const MAP = { ox: 0, oy: 0, sc: 1, size: 0 };
const DOT_RANGE = 1000;
let mapSel = null;
let savedRoute = null;
const ICON_BY_TYPE = { pizza: '🍕', sushi: '🍣', burger: '🍔' };

function minimapCenter() { return [20 + MM.S, H - 20 - MM.S]; }
function clickOnMinimap(x, y) {
  const [cx, cy] = minimapCenter();
  return hyp(x - cx, y - cy) <= MM.S;
}

function mapLayout() {
  const s = Math.min(W, H) - 200;
  MAP.size = s; MAP.sc = s / WS;
  MAP.ox = (W - s) / 2; MAP.oy = (H - s) / 2 + 10;
}
function toScr(x, y) { return [MAP.ox + x * MAP.sc, MAP.oy + y * MAP.sc]; }

function openMapa() { mapSel = null; mapLayout(); st = 'mapa'; snd(500, .1, 'sine', .05); }
function closeMapa() { mapSel = null; st = 'play'; }

function mapPois() {
  const L = [
    { key: 'garagem', name: 'Garagem', icon: '🚗', col: '#38bdf8', x: GDOOR.x, y: GDOOR.y },
    { key: 'loja', name: 'Loja (armas e reparos)', icon: '🛒', col: '#4ade80', x: SHOP_DOOR.x, y: SHOP_DOOR.y },
    { key: 'ammu', name: 'Ammu-Nation', icon: '🔫', col: '#a3e635', x: AM_DOOR.x, y: AM_DOOR.y }
  ];
  for (const r of RESTS) {
    L.push({ key: 'rest-' + r.type, name: r.name, icon: ICON_BY_TYPE[r.type], col: '#fde68a', x: r.door.x, y: r.door.y });
  }
  ATMS.forEach((a, k) => {
    const [x, y] = atmC(a);
    L.push({ key: 'atm-' + k, name: 'Caixa eletrônico ' + (k + 1) + (a.used ? ' (sem dinheiro)' : ''), icon: '🏧', col: '#f0abfc', x, y });
  });
  if (order) {
    L.push({ key: 'entrega', name: 'Cliente: ' + order.rest, icon: '📦', col: '#e879f9', x: order.dx, y: order.dy });
  } else if (mission) {
    const p = missionPos();
    if (p) L.push({ key: 'missao', name: 'Missão em andamento', icon: '🎯', col: missionColor(), x: p[0], y: p[1] });
  }
  return L;
}

function nodeXY(i, j) { return [i * CELL + RD / 2, j * CELL + RD / 2]; }
function nearestNode(x, y) {
  let bi = 0, bj = 0, bd = 1e9;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const [nx, ny] = nodeXY(i, j), d = hyp(nx - x, ny - y);
    if (d < bd) { bd = d; bi = i; bj = j; }
  }
  return [bi, bj];
}
function routeTo(tx, ty) {
  const [si, sj] = nearestNode(P.x, P.y), [ei, ej] = nearestNode(tx, ty);
  const prev = new Map(), k = (i, j) => i + ',' + j;
  const q = [[si, sj]]; let h = 0; prev.set(k(si, sj), null);
  while (h < q.length) {
    const [i, j] = q[h++];
    if (i === ei && j === ej) break;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N || prev.has(k(ni, nj))) continue;
      prev.set(k(ni, nj), [i, j]); q.push([ni, nj]);
    }
  }
  const nodes = [];
  let cur = [ei, ej];
  while (cur) { nodes.unshift(cur); cur = prev.get(k(cur[0], cur[1])) || null; }
  const pts = [[P.x, P.y], ...nodes.map(([i, j]) => nodeXY(i, j)), [tx, ty]];
  let len = 0;
  for (let a = 1; a < pts.length; a++) len += hyp(pts[a][0] - pts[a - 1][0], pts[a][1] - pts[a - 1][1]);
  return { pts, len };
}

function setSavedRoute(key, x, y, name, icon, col) {
  if (savedRoute && savedRoute.key === key) {
    savedRoute = null;
    toast('Rota cancelada.');
    return;
  }
  savedRoute = { key, x, y, name, icon, col };
  toast('Rota salva: ' + name);
}

function routeFromSaved() {
  if (!savedRoute) return null;
  const r = routeTo(savedRoute.x, savedRoute.y);
  return { ...savedRoute, pts: r.pts, len: r.len };
}

function updSavedRoute() {
  if (!savedRoute) return;
  if (hyp(P.x - savedRoute.x, P.y - savedRoute.y) < 60) {
    toast('Você chegou ao destino: ' + savedRoute.name);
    savedRoute = null; return;
  }
  if (savedRoute.key === 'entrega' && !order) savedRoute = null;
  if (savedRoute.key === 'missao' && !mission) savedRoute = null;
}

function autoRouteDelivery() {
  if (!order) return;
  savedRoute = { key: 'entrega', x: order.dx, y: order.dy, name: 'Cliente: ' + order.rest, icon: '📦', col: '#e879f9' };
}

addEventListener('mousedown', e => {
  if (st === 'play' && e.button === 0 && clickOnMinimap(e.clientX, e.clientY)) { openMapa(); return; }
  if (st !== 'mapa') return;
  mapLayout();
  let hit = null, bd = 18;
  for (const p of mapPois()) {
    const [sx, sy] = toScr(p.x, p.y), d = hyp(sx - e.clientX, sy - e.clientY);
    if (d < bd) { bd = d; hit = p; }
  }
  if (hit) {
    mapSel = hit.key;
    setSavedRoute(hit.key, hit.x, hit.y, hit.name, hit.icon, hit.col);
  } else {
    mapSel = null;
  }
});

addEventListener('keydown', e => {
  if (st === 'play' && e.code === 'KeyN') { openMapa(); return; }
  if (st === 'mapa' && (e.code === 'KeyN' || e.code === 'Escape')) closeMapa();
});

function drawSavedRoute() {
  const r = routeFromSaved();
  if (!r || st !== 'play') return;
  ctx.strokeStyle = 'rgba(56,189,248,.85)'; ctx.lineWidth = 6; ctx.setLineDash([18, 12]);
  ctx.beginPath();
  r.pts.forEach(([x, y], k) => { if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
  ctx.stroke(); ctx.setLineDash([]);
  label('Rota: ' + r.name + '  •  ~' + Math.round(r.len / 10) + ' m', W / 2, 186, 16, '#38bdf8', 'center');
}

function drawMapa() {
  mapLayout();
  const { ox, oy, sc, size } = MAP;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,10,.86)'; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#2d2f36'; ctx.fillRect(ox, oy, size, size);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const b = blocks[j * N + i];
    const [sx, sy] = toScr(i * CELL + RD, j * CELL + RD);
    ctx.fillStyle = b.park ? '#2f6b3a' : '#6b7080';
    ctx.fillRect(sx, sy, (CELL - RD) * sc, (CELL - RD) * sc);
    for (const q of b.bl) {
      const [qx, qy] = toScr(q.x, q.y);
      ctx.fillStyle = q.col; ctx.fillRect(qx, qy, q.w * sc, q.h * sc);
    }
  }

  const pois = mapPois();
  const sel = mapSel ? pois.find(p => p.key === mapSel) : null;
  const saved = routeFromSaved();
  if (saved) {
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.setLineDash([12, 7]);
    ctx.beginPath();
    saved.pts.forEach(([x, y], k) => {
      const [sx, sy] = toScr(x, y);
      if (k) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
    });
    ctx.stroke(); ctx.setLineDash([]);
  }

  for (const p of pois) {
    const [sx, sy] = toScr(p.x, p.y), isSel = (savedRoute && savedRoute.key === p.key);
    ctx.fillStyle = 'rgba(10,12,20,.92)';
    ctx.beginPath(); ctx.arc(sx, sy, isSel ? 20 : 15, 0, TAU); ctx.fill();
    ctx.strokeStyle = p.col; ctx.lineWidth = isSel ? 3 : 2; ctx.stroke();
    ctx.font = (isSel ? '22px' : '16px') + ' "Segoe UI Emoji", "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.icon, sx, sy + 1);
    ctx.textBaseline = 'alphabetic';
  }

  const [px, py] = toScr(P.x, P.y);
  ctx.save(); ctx.translate(px, py); ctx.rotate(P.a);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -7); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill();
  ctx.restore();

  label('MAPA DA CIDADE', W / 2, oy - 16, 22, '#facc15', 'center');
  label('[N] ou Esc para fechar', W / 2, 40, 16, '#94a3b8', 'center');
  const bw = 560, bh = 60, bx = W / 2 - bw / 2, by = H - 80;
  ctx.fillStyle = 'rgba(20,20,40,.95)'; ctx.fillRect(bx, by, bw, bh);
  const infoCol = sel ? sel.col : '#64748b';
  ctx.strokeStyle = infoCol; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
  if (sel) {
    const r = routeTo(sel.x, sel.y);
    const isActive = savedRoute && savedRoute.key === sel.key;
    label(sel.icon + '  ' + sel.name, W / 2, by + 26, 18, '#fff', 'center');
    label('Distância: ~' + Math.round(r.len / 10) + ' m  •  ' + (isActive ? 'clique de novo para cancelar' : 'clique para salvar a rota'), W / 2, by + 50, 15, '#38bdf8', 'center');
  } else {
    label('Clique em um ícone para ver a rota e salvá-la', W / 2, by + 36, 16, '#cbd5e1', 'center');
  }
}

function nearbyPois() {
  return mapPois().filter(p => hyp(p.x - P.x, p.y - P.y) <= DOT_RANGE);
}