// ===== MAPA GRANDE: zoom (roda do mouse), arraste e detalhe por nível de zoom =====
// Abre clicando no minimapa ou com N. Esc ou N fecha.
const MM = { S: 84 };
const MAP = { ox: 0, oy: 0, sc: 1, size: 0, bx: 0, by: 0, fitSc: 1, maxSc: 1, cache: null, cacheSize: 0 };
const MAP_DETAIL_SC = 0.10;   // acima disso, desenha prédios e quarteirões em detalhe
const DOT_RANGE = 1000;
let mapSel = null;
let savedRoute = null;
let mapDrag = null;
const ICON_BY_TYPE = { pizza: '🍕', sushi: '🍣', burger: '🍔' };

function nodeXY(i, j) { return [i * CELL + RD / 2, j * CELL + RD / 2]; }

function minimapCenter() { return [20 + MM.S, H - 20 - MM.S]; }
function clickOnMinimap(x, y) {
  const [cx, cy] = minimapCenter();
  return hyp(x - cx, y - cy) <= MM.S;
}

// Caixa do mapa na tela e limites de zoom. Refeita a cada uso (suporta redimensionar a janela).
function mapLayout() {
  const s = Math.min(W, H) - 200;
  MAP.size = s;
  MAP.bx = (W - s) / 2;
  MAP.by = (H - s) / 2 + 10;
  MAP.fitSc = s / Math.max(WSW, WSH);      // visão da cidade inteira
  MAP.maxSc = s / (4 * CELL);              // visão de perto: ~4 quarteirões na tela
  MAP.sc = clamp(MAP.sc || MAP.fitSc, MAP.fitSc, MAP.maxSc);
  if (MAP.cacheSize !== Math.round(s)) buildMapCache();
}

// Mantém o mundo cobrindo a caixa do mapa (ou centralizado, se couber inteiro)
function clampView() {
  const worldW = WSW * MAP.sc, worldH = WSH * MAP.sc;
  if (worldW <= MAP.size) MAP.ox = MAP.bx + (MAP.size - worldW) / 2;
  else MAP.ox = clamp(MAP.ox, MAP.bx + MAP.size - worldW, MAP.bx);
  if (worldH <= MAP.size) MAP.oy = MAP.by + (MAP.size - worldH) / 2;
  else MAP.oy = clamp(MAP.oy, MAP.by + MAP.size - worldH, MAP.by);
}

function toScr(x, y) { return [MAP.ox + x * MAP.sc, MAP.oy + y * MAP.sc]; }

// Cache do nível de longe: a cidade inteira desenhada uma vez, em escala fixa (fitSc)
function buildMapCache() {
  const f = MAP.fitSc;
  const c = document.createElement('canvas');
  c.width = Math.ceil(WSW * f); c.height = Math.ceil(WSH * f);
  const m = c.getContext('2d');
  m.fillStyle = '#2d2f36'; m.fillRect(0, 0, c.width, c.height);
  m.setTransform(f, 0, 0, f, 0, 0);
  for (let j = 0; j < NH; j++) for (let i = 0; i < NW; i++) {
    const b = blocks[j * NW + i];
    m.fillStyle = b.park ? '#2f6b3a' : '#6b7080';
    m.fillRect(i * CELL + RD, j * CELL + RD, CELL - RD, CELL - RD);
  }
  MAP.cache = c;
  MAP.cacheSize = Math.round(MAP.size);
}

function openMapa() {
  mapLayout();
  MAP.sc = MAP.fitSc;
  clampView();
  mapSel = null;
  st = 'mapa';
  snd(500, .1, 'sine', .05);
}
function closeMapa() { mapSel = null; mapDrag = null; st = 'play'; }

function zoomAt(mx, my, f) {
  mapLayout();
  const wx = (mx - MAP.ox) / MAP.sc, wy = (my - MAP.oy) / MAP.sc;
  MAP.sc = clamp(MAP.sc * f, MAP.fitSc, MAP.maxSc);
  MAP.ox = mx - wx * MAP.sc;
  MAP.oy = my - wy * MAP.sc;
  clampView();
}

function inMapBox(x, y) {
  return x >= MAP.bx && x <= MAP.bx + MAP.size && y >= MAP.by && y <= MAP.by + MAP.size;
}

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

function nearestNode(x, y) {
  let bi = Math.round((x - RD / 2) / CELL), bj = Math.round((y - RD / 2) / CELL);
  bi = clamp(bi, 0, NW - 1); bj = clamp(bj, 0, NH - 1);
  let best = bi, bestJ = bj, bd = 1e9;
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    const i = bi + di, j = bj + dj;
    if (i < 0 || j < 0 || i >= NW || j >= NH) continue;
    const [nx, ny] = nodeXY(i, j), d = hyp(nx - x, ny - y);
    if (d < bd) { bd = d; best = i; bestJ = j; }
  }
  return [best, bestJ];
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
      if (ni < 0 || nj < 0 || ni >= NW || nj >= NH || prev.has(k(ni, nj))) continue;
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

function selectPoiAt(x, y) {
  let hit = null, bd = 18;
  for (const p of mapPois()) {
    const [sx, sy] = toScr(p.x, p.y), d = hyp(sx - x, sy - y);
    if (d < bd) { bd = d; hit = p; }
  }
  if (hit) {
    mapSel = hit.key;
    setSavedRoute(hit.key, hit.x, hit.y, hit.name, hit.icon, hit.col);
  } else {
    mapSel = null;
  }
}

addEventListener('mousedown', e => {
  if (st === 'play' && e.button === 0 && clickOnMinimap(e.clientX, e.clientY)) { openMapa(); return; }
  if (st !== 'mapa' || e.button !== 0) return;
  mapLayout();
  if (!inMapBox(e.clientX, e.clientY)) return;
  mapDrag = { x: e.clientX, y: e.clientY, ox0: MAP.ox, oy0: MAP.oy, moved: false };
});

addEventListener('mousemove', e => {
  if (!mapDrag) return;
  const dx = e.clientX - mapDrag.x, dy = e.clientY - mapDrag.y;
  if (!mapDrag.moved && hyp(dx, dy) > 4) mapDrag.moved = true;
  if (mapDrag.moved) {
    MAP.ox = mapDrag.ox0 + dx;
    MAP.oy = mapDrag.oy0 + dy;
    clampView();
  }
});

// Clique sem arrastar seleciona o ícone; arrastar só move a visão
addEventListener('mouseup', e => {
  if (!mapDrag) return;
  const was = mapDrag;
  mapDrag = null;
  if (st === 'mapa' && !was.moved) selectPoiAt(e.clientX, e.clientY);
});

addEventListener('wheel', e => {
  if (st !== 'mapa') return;
  e.preventDefault();
  zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.2 : 1 / 1.2);
}, { passive: false });

addEventListener('keydown', e => {
  if (st === 'play' && e.code === 'KeyN') { openMapa(); return; }
  if (st !== 'mapa') return;
  if (e.code === 'KeyN' || e.code === 'Escape') { closeMapa(); return; }
  if (e.code === 'Equal' || e.code === 'NumpadAdd') zoomAt(MAP.bx + MAP.size / 2, MAP.by + MAP.size / 2, 1.2);
  if (e.code === 'Minus' || e.code === 'NumpadSubtract') zoomAt(MAP.bx + MAP.size / 2, MAP.by + MAP.size / 2, 1 / 1.2);
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
  const { ox, oy, sc, bx, by, size } = MAP;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,10,.86)'; ctx.fillRect(0, 0, W, H);

  // Área do mapa: tudo que vai para dentro fica recortado nessa caixa
  ctx.save();
  ctx.beginPath(); ctx.rect(bx, by, size, size); ctx.clip();
  ctx.fillStyle = '#2d2f36'; ctx.fillRect(bx, by, size, size);

  if (sc < MAP_DETAIL_SC) {
    // Visão de longe: cidade inteira do cache
    ctx.drawImage(MAP.cache, ox, oy, WSW * sc, WSH * sc);
  } else {
    // Visão de perto: só os quarteirões dentro da janela visível
    const x0 = (bx - ox) / sc, x1 = (bx + size - ox) / sc;
    const y0 = (by - oy) / sc, y1 = (by + size - oy) / sc;
    const i0 = Math.max(0, Math.floor(x0 / CELL)), i1 = Math.min(NW - 1, Math.floor(x1 / CELL));
    const j0 = Math.max(0, Math.floor(y0 / CELL)), j1 = Math.min(NH - 1, Math.floor(y1 / CELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const b = blocks[j * NW + i];
      const [sx, sy] = toScr(i * CELL + RD, j * CELL + RD);
      ctx.fillStyle = b.park ? '#2f6b3a' : '#6b7080';
      ctx.fillRect(sx, sy, (CELL - RD) * sc, (CELL - RD) * sc);
      for (const q of b.bl) {
        const [qx, qy] = toScr(q.x, q.y);
        ctx.fillStyle = q.col; ctx.fillRect(qx, qy, q.w * sc, q.h * sc);
      }
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
  ctx.restore(); // fim do recorte

  ctx.strokeStyle = 'rgba(250,204,21,.5)'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, size, size);

  label('MAPA DA CIDADE', W / 2, by - 16, 22, '#facc15', 'center');
  label('Roda do mouse: zoom  •  Arraste: mover  •  [N] ou Esc: fechar', W / 2, 40, 16, '#94a3b8', 'center');
  const pct = Math.round((sc - MAP.fitSc) / (MAP.maxSc - MAP.fitSc) * 100);
  label('Zoom ' + Math.max(0, pct) + '%', bx + size - 8, by + 22, 14, '#cbd5e1', 'right');

  const bw = 560, bh = 60, px2 = W / 2 - bw / 2, py2 = H - 80;
  ctx.fillStyle = 'rgba(20,20,40,.95)'; ctx.fillRect(px2, py2, bw, bh);
  const infoCol = sel ? sel.col : '#64748b';
  ctx.strokeStyle = infoCol; ctx.lineWidth = 2; ctx.strokeRect(px2, py2, bw, bh);
  if (sel) {
    const r = routeTo(sel.x, sel.y);
    const isActive = savedRoute && savedRoute.key === sel.key;
    label(sel.icon + '  ' + sel.name, W / 2, py2 + 26, 18, '#fff', 'center');
    label('Distância: ~' + Math.round(r.len / 10) + ' m  •  ' + (isActive ? 'clique de novo para cancelar' : 'clique para salvar a rota'), W / 2, py2 + 50, 15, '#38bdf8', 'center');
  } else {
    label('Clique em um ícone para ver a rota e salvá-la', W / 2, py2 + 36, 16, '#cbd5e1', 'center');
  }
}

function nearbyPois() {
  return mapPois().filter(p => hyp(p.x - P.x, p.y - P.y) <= DOT_RANGE);
}