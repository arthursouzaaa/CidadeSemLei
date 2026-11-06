// ===== FLASH DE TELA (juice): sobreposição leve, chamada pelos eventos do jogo =====
let flashT = 0, flashDur = 0.15, flashCol = '255,255,255';
let flashAlpha = 0.18;

// Dispara um flash de tela. cor: 'r,g,b' (ex.: '74,222,128'); dur em segundos; alpha máx. leve
function flash(cor, dur = 0.15, alpha = 0.18) {
  flashCol = cor;
  flashDur = dur;
  flashT = Math.max(flashT, dur);
  flashAlpha = alpha;
}

// Desenha o flash com alfa decrescente (chamado no fim de draw, antes do HUD)
function drawFlash() {
  if (flashT <= 0) return;
  const k = clamp(flashT / flashDur, 0, 1);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(' + flashCol + ',' + (flashAlpha * k) + ')';
  ctx.fillRect(0, 0, W, H);
}

function drawCar(c) {
  if (c.fire) return drawFireTruck(c);
  if (c.model === 'moto') return drawMoto(c);
  const hl = c.L / 2, hw = c.Wd / 2;
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.roundRect(-hl + 2, -hw + 3, c.L, c.Wd, 6); ctx.fill();
  ctx.fillStyle = c.pol ? '#f1f5f9' : c.col; ctx.beginPath(); ctx.roundRect(-hl, -hw, c.L, c.Wd, 6); ctx.fill();
  if (c.pol) { ctx.fillStyle = '#1d4ed8'; ctx.fillRect(-hl, -3, c.L, 6); }

  if (c.model === 'caminhao') {
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-hl + 2, -hw + 2, c.L - 22, c.Wd - 4);
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 1; k < 4; k++) { const x = -hl + 2 + k * (c.L - 22) / 4; ctx.moveTo(x, -hw + 2); ctx.lineTo(x, hw - 2); }
    ctx.stroke();
    ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.roundRect(hl - 18, -hw + 2, 16, c.Wd - 4, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(hl - 12, -hw + 5, 6, c.Wd - 10);
  } else if (c.model === 'esportivo') {
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(-hl + 6, -2.5, c.L - 14, 5);
    ctx.fillStyle = '#111'; ctx.fillRect(-hl + 2, -hw - 1, 4, c.Wd + 2);
    ctx.fillStyle = '#16202e'; ctx.fillRect(2, -hw + 3, 9, c.Wd - 6);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-6, -hw + 3, 6, c.Wd - 6);
  } else {
    ctx.fillStyle = '#16202e'; ctx.fillRect(3, -hw + 2, 9, c.Wd - 4); ctx.fillRect(-15, -hw + 2, 6, c.Wd - 4);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-9, -hw + 2, 12, c.Wd - 4);
  }

  ctx.fillStyle = '#fde68a'; ctx.fillRect(hl - 2, -hw + 2, 3, 5); ctx.fillRect(hl - 2, hw - 7, 3, 5);
  ctx.fillStyle = '#dc2626'; ctx.fillRect(-hl - 1, -hw + 2, 2, 5); ctx.fillRect(-hl - 1, hw - 7, 2, 5);
  if (c.cop) {
    const f = Math.floor(tm * 8) % 2;
    ctx.fillStyle = f ? '#ef4444' : '#3b82f6'; ctx.fillRect(-4, -9, 5, 9);
    ctx.fillStyle = f ? '#3b82f6' : '#ef4444'; ctx.fillRect(-4, 0, 5, 9);
  }
  if (c.hp < 50) { ctx.fillStyle = 'rgba(0,0,0,' + (.5 - c.hp / 120) + ')'; ctx.beginPath(); ctx.roundRect(-hl, -hw, c.L, c.Wd, 6); ctx.fill(); }
  ctx.restore();
}

// ----- ARMA NA MÃO (animação por tipo) -----
const GUN_STYLE = {
  '-1': { len: 0,  kick: 0,  name: 'mao' },
  0:    { len: 16, kick: 5,  name: 'pistola', col: '#1f2937', rec: .28 },
  1:    { len: 26, kick: 3,  name: 'smg',     col: '#374151', rec: .07 },
  2:    { len: 30, kick: 9,  name: 'escopeta', col: '#78350f', rec: .8 }
};

function drawHeldWeapon(hx, hy) {
  const key = P.sel ? null : P.w;
  if (P.sel === 'faca' || P.sel === 'bastao') return drawMelee(hx, hy);
  if (P.sel) return;
  const st0 = GUN_STYLE[key] || GUN_STYLE['-1'];

  const since = P.cd > 0 ? 1 - P.cd / (st0.rec || 0.3) : 1;
  const recoil = st0.kick * clamp(1 - since, 0, 1) * (st0.rec ? 1 : 0);

  ctx.save();
  ctx.translate(hx, hy); ctx.rotate(P.a);
  if (key === -1 || key === undefined) {
    const sw = Math.sin(tm * 6) * 1.2;
    ctx.fillStyle = P.skin || '#d9a066';
    ctx.beginPath(); ctx.arc(5 + sw, 4, 2.6, 0, TAU); ctx.fill();
    ctx.restore(); return;
  }

  const L = st0.len, x0 = 6 - recoil;
  ctx.fillStyle = st0.col;
  if (key === 0) {
    ctx.fillRect(x0, -3, 10, 6);
    ctx.fillRect(x0 + 8, -2, L - 8, 4);
  } else if (key === 1) {
    ctx.fillRect(x0, -3, 14, 6);
    ctx.fillRect(x0 + 14, -1.5, L - 14, 3);
    ctx.fillRect(x0 + 4, 3, 3, 6);
    ctx.fillRect(x0 - 6, -2, 6, 4);
  } else if (key === 2) {
    ctx.fillRect(x0 - 8, -2.5, 8, 5);
    ctx.fillRect(x0, -4, L - 4, 3);
    ctx.fillRect(x0, 0, L - 4, 3);
    ctx.fillStyle = '#92400e'; ctx.fillRect(x0 - 12, -3, 6, 6);
  }
  ctx.fillStyle = P.skin || '#d9a066';
  ctx.beginPath(); ctx.arc(4, 3, 3.2, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawMelee(hx, hy) {
  const knife = P.sel === 'faca';
  const swing = clamp((P.cd || 0) / (knife ? .3 : .55), 0, 1);
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(P.a + (knife ? -.6 : -.9) * swing + (knife ? .3 : .45));
  if (knife) {
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(4, -1.5, 14, 3);
    ctx.fillStyle = '#7c2d12'; ctx.fillRect(0, -2.5, 5, 5);
  } else {
    ctx.fillStyle = '#78350f'; ctx.fillRect(4, -2.5, 22, 5);
  }
  ctx.fillStyle = P.skin || '#d9a066';
  ctx.beginPath(); ctx.arc(3, 0, 3, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawPed(p) {
  if (p.dead) {
    ctx.fillStyle = 'rgba(120,10,10,.7)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 11, 8, p.a, 0, TAU); ctx.fill();
    ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(p.x, p.y, 7, 5, p.a, 0, TAU); ctx.fill(); return;
  }
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(PED_SCALE, PED_SCALE);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(1, 2, 8, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, 5, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU); ctx.fill();
  if (p.cop) { ctx.fillStyle = '#1e3a8a'; ctx.beginPath(); ctx.arc(0, 0, 4.6, Math.PI, TAU); ctx.fill(); }
  ctx.restore();
}

const WALL = ['#2b2f3d', '#232633', '#1c1e29', '#262a38'];
function drawBld(b) {
  for (const q of b.bl) {
    const k = q.z / 1700;
    const pts = [[q.x, q.y], [q.x + q.w, q.y], [q.x + q.w, q.y + q.h], [q.x, q.y + q.h]];
    const rp = pts.map(p => [p[0] + (p[0] - camX) * k, p[1] + (p[1] - camY) * k]);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      ctx.fillStyle = WALL[i];
      ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.lineTo(rp[j][0], rp[j][1]); ctx.lineTo(rp[i][0], rp[i][1]); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = q.col;
    ctx.beginPath(); rp.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(rp[0][0] + q.w * .12, rp[0][1] + q.h * .12, q.w * .28, q.h * .28);
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(rp[0][0] + q.w * .55, rp[0][1] + q.h * .5, q.w * .3, q.h * .3);
  }
}

function drawGarageBuilding() {
  const b = GAR_BLD, h = 110;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(b.x + 8, b.y + 8, b.w, b.h);
  const k = h / 1700 * 2;
  const ox = (b.x + b.w / 2 - camX) * k, oy = (b.y + b.h / 2 - camY) * k;
  ctx.fillStyle = '#1e40af'; ctx.fillRect(b.x + ox * .3, b.y + oy * .3, b.w, b.h);
  ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2; ctx.strokeRect(b.x + ox * .3, b.y + oy * .3, b.w, b.h);
  ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('GARAGEM', b.x + b.w / 2 + ox * .3, b.y + b.h / 2 + oy * .3 + 8);
  const dw = 60, dh = 14, dx = GDOOR.x - dw / 2, dy = b.y + b.h - dh + 2;
  ctx.fillStyle = '#0f172a'; ctx.fillRect(dx, dy, dw, dh + 6);
  ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, dw, dh + 6);
  ctx.strokeStyle = 'rgba(56,189,248,.35)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = dx + 6; x < dx + dw; x += 8) { ctx.moveTo(x, dy + 2); ctx.lineTo(x, dy + dh + 2); }
  ctx.stroke();
}

function darkness() {
  const c = Math.cos((tod - 13) / 24 * TAU);
  return clamp((-c + .2) * .7, 0, .8);
}
function lights(i0, i1, j0, j1, vx0, vy0, vx1, vy1) {
  const dk = darkness(); if (dk < .03) return;
  lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, lc.width, lc.height);
  lx.fillStyle = 'rgba(3,6,24,' + dk + ')'; lx.fillRect(0, 0, lc.width, lc.height);
  lx.globalCompositeOperation = 'destination-out';
  const f = .25 * camZ;
  const L = (x, y, r, a) => {
    lx.globalAlpha = a;
    const s = r * f * 2;
    lx.drawImage(ls, (x - camX) * f + lc.width / 2 - s / 2, (y - camY) * f + lc.height / 2 - s / 2, s, s);
  };
  for (const c of cars) {
    if (c.dead || c.x < vx0 || c.x > vx1 || c.y < vy0 || c.y > vy1) continue;
    const fx = Math.cos(c.a), fy = Math.sin(c.a);
    L(c.x + fx * 65, c.y + fy * 65, 100, 1); L(c.x + fx * 25, c.y + fy * 25, 70, 1);
  }
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++)
    for (const ix of [i * CELL + 6, i * CELL + RD - 6])
      for (const iy of [j * CELL + 6, j * CELL + RD - 6]) L(ix, iy, 150, .9);
  if (!P.veh) L(P.x, P.y, 75, .8);
  lx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(lc, 0, 0, W, H);
  drawNightGlow(dk, i0, i1, j0, j1);
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0b1d2e'; ctx.fillRect(0, 0, W, H);
  const sxk = shake > .3 ? rnd(-shake, shake) : 0, syk = shake > .3 ? rnd(-shake, shake) : 0;
  ctx.translate(W / 2, H / 2); ctx.scale(camZ, camZ); ctx.translate(-camX + sxk, -camY + syk);
  const vw = W / camZ / 2 + 60, vh = H / camZ / 2 + 60;
  const vx0 = camX - vw, vx1 = camX + vw, vy0 = camY - vh, vy1 = camY + vh;
  // Limites da visão em quarteirões, por eixo (NW para i, NH para j)
  const i0 = Math.max(0, Math.floor(vx0 / CELL)), i1 = Math.min(NW - 1, Math.floor(vx1 / CELL));
  const j0 = Math.max(0, Math.floor(vy0 / CELL)), j1 = Math.min(NH - 1, Math.floor(vy1 / CELL));

  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const x = i * CELL, y = j * CELL, b = blocks[j * NW + i];
    ctx.fillStyle = '#2d2f36'; ctx.fillRect(x, y, CELL, RD); ctx.fillRect(x, y, RD, CELL);
    ctx.fillStyle = b.park ? '#2f6b3a' : '#8d9096'; ctx.fillRect(x + RD, y + RD, CELL - RD, CELL - RD);
    if (b.park) { ctx.strokeStyle = '#9a9ca3'; ctx.lineWidth = 14; ctx.strokeRect(x + RD + 7, y + RD + 7, CELL - RD - 14, CELL - RD - 14); }
    ctx.strokeStyle = 'rgba(250,204,21,.7)'; ctx.lineWidth = 3; ctx.setLineDash([22, 18]);
    ctx.beginPath(); ctx.moveTo(x + RD, y + RD / 2); ctx.lineTo(x + CELL, y + RD / 2);
    ctx.moveTo(x + RD / 2, y + RD); ctx.lineTo(x + RD / 2, y + CELL); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let k = 0; k < 6; k++) {
      const o = 8 + k * 17;
      ctx.fillRect(x + o, y - 12, 9, 10); ctx.fillRect(x + o, y + RD + 2, 9, 10);
      ctx.fillRect(x - 12, y + o, 10, 9); ctx.fillRect(x + RD + 2, y + o, 10, 9);
    }
  }
  drawDecals(vx0, vy0, vx1, vy1);
  drawTrafficLights(i0, i1, j0, j1);

  const mp = missionPos();
  if (mp && !order) {
    const col = missionColor();
    const r = 34 + Math.sin(tm * 5) * 5;
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(mp[0], mp[1], r, 0, TAU); ctx.stroke();
    ctx.fillStyle = col; ctx.globalAlpha = .25; ctx.fill(); ctx.globalAlpha = 1;
  }
  for (const k of pk) {
    if (k.x < vx0 || k.x > vx1 || k.y < vy0 || k.y > vy1) continue;
    ctx.fillStyle = k.t === 'hp' ? '#ef4444' : '#fde047';
    ctx.beginPath(); ctx.arc(k.x, k.y, 9 + Math.sin(tm * 4) * 1.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#111'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(k.t === 'hp' ? '+' : k.t === 'smg' ? 'S' : 'E', k.x, k.y + 4);
  }
  for (const c of cash) {
    ctx.fillStyle = '#4ade80'; ctx.fillRect(c.x - 6, c.y - 4, 12, 8);
    ctx.fillStyle = '#166534'; ctx.fillRect(c.x - 2, c.y - 2, 4, 4);
  }
  for (const p of peds) if (p.dead) drawPed(p);
  for (const c of cars) if (!c.dead && c.x > vx0 - 50 && c.x < vx1 + 50 && c.y > vy0 - 50 && c.y < vy1 + 50) drawCar(c);
  for (const p of peds) if (!p.dead && p.x > vx0 && p.x < vx1 && p.y > vy0 && p.y < vy1) drawPed(p);
  if (!P.veh && st !== 'dead') {
    drawPed(P);
    drawHeldWeapon(P.x, P.y);
  }

  if (garageAnim && garageAnim.mode === 'in') {
    const f = clamp(garageAnim.t / .6, 0, 1), s = 1 - f;
    ctx.save(); ctx.translate(GX, GY - 20 + f * 22); ctx.scale(s, s * .6 + .4);
    ctx.globalAlpha = 1 - f * .6;
    drawCar({ x: 0, y: 0, a: Math.PI / 2, L: MODELS[garageAnim.model].L, Wd: MODELS[garageAnim.model].W,
              model: garageAnim.model, col: garageAnim.col, pol: false, cop: false, hp: 100 });
    ctx.restore(); ctx.globalAlpha = 1;
  }
  if (garageAnim && garageAnim.mode === 'out') {
    const f = clamp(garageAnim.t / .6, 0, 1);
    ctx.save(); ctx.translate(GX, GY - 20 + (1 - f) * 22); ctx.scale(f, f * .6 + .4);
    ctx.globalAlpha = .4 + f * .6;
    drawCar({ x: 0, y: 0, a: Math.PI / 2, L: MODELS[garageAnim.model].L, Wd: MODELS[garageAnim.model].W,
              model: garageAnim.model, col: garageAnim.col, pol: false, cop: false, hp: 100 });
    ctx.restore(); ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.5;
  for (const b of bullets) { ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * .025, b.y - b.vy * .025); ctx.stroke(); }

  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const b = blocks[j * NW + i];
    for (const t of b.tr) {
      ctx.fillStyle = '#14532d';
      ctx.beginPath(); ctx.arc(t[0] + (t[0] - camX) * .03, t[1] + (t[1] - camY) * .03, t[2], 0, TAU); ctx.fill();
      ctx.fillStyle = '#22863a';
      ctx.beginPath(); ctx.arc(t[0] + (t[0] - camX) * .03 - 3, t[1] + (t[1] - camY) * .03 - 3, t[2] * .6, 0, TAU); ctx.fill();
    }
  }
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) drawBld(blocks[j * NW + i]);
  drawGarageBuilding();
  drawShopBuilding();
  drawAmmuBuilding();
  drawOficinaSign();
  drawBankBuilding();
  drawHouses(vx0, vy0, vx1, vy1);
  drawRestaurants();
  drawAtms();
  drawCombat();
  drawDeliveryWorld();
  drawSavedRoute();
  drawClothesBuilding();
  drawCasinoBuilding();
  drawHeli();

  for (const p of PT) {
    ctx.globalAlpha = clamp(p.l / p.m, 0, 1) * (p.sm ? .5 : 1);
    ctx.fillStyle = p.c; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
  }
  ctx.globalAlpha = 1;

  ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  for (const t of FT) { ctx.globalAlpha = clamp(t.l * 2, 0, 1); ctx.fillStyle = t.c; ctx.fillText(t.t, t.x, t.y); }
  ctx.globalAlpha = 1;

  lights(i0, i1, j0, j1, vx0, vy0, vx1, vy1);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (hurtF > 0) { ctx.fillStyle = 'rgba(220,0,0,' + hurtF * .5 + ')'; ctx.fillRect(0, 0, W, H); }
  drawFlash();
  if (st === 'play' || st === 'pause' || st === 'dead') hud();
  if (st === 'play' && !P.veh) {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 8, 0, TAU);
    ctx.moveTo(mouse.x - 14, mouse.y); ctx.lineTo(mouse.x - 4, mouse.y);
    ctx.moveTo(mouse.x + 4, mouse.y); ctx.lineTo(mouse.x + 14, mouse.y); ctx.stroke();
  }
  overlays();
}

function label(t, x, y, s = 16, c = '#fff', al = 'left') {
  ctx.font = 'bold ' + s + "px 'Segoe UI',sans-serif"; ctx.textAlign = al;
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(t, x, y);
  ctx.fillStyle = c; ctx.fillText(t, x, y);
}

function hud() {
  const S = 84, cx = 20 + S, cy = H - 20 - S, sc = S / 650;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, S, 0, TAU); ctx.clip();
  ctx.fillStyle = '#161a22'; ctx.fillRect(cx - S, cy - S, S * 2, S * 2);
  ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-P.x, -P.y);
  // Minimapa: quarteirões visíveis em torno do jogador, por eixo
  const a0 = Math.max(0, Math.floor((P.x - 650) / CELL)), a1 = Math.min(NW - 1, Math.floor((P.x + 650) / CELL));
  const b0 = Math.max(0, Math.floor((P.y - 650) / CELL)), b1 = Math.min(NH - 1, Math.floor((P.y + 650) / CELL));
  for (let j = b0; j <= b1; j++) for (let i = a0; i <= a1; i++) {
    const x = i * CELL, y = j * CELL;
    ctx.fillStyle = '#4a5060'; ctx.fillRect(x, y, CELL, RD); ctx.fillRect(x, y, RD, CELL);
    ctx.fillStyle = blocks[j * NW + i].park ? '#245a30' : '#2a2f3b'; ctx.fillRect(x + RD, y + RD, CELL - RD, CELL - RD);
  }
  const dot = (x, y, c, r) => {
    let dx = x - P.x, dy = y - P.y; const d = hyp(dx, dy);
    if (d > 600) { dx *= 600 / d; dy *= 600 / d; }
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(P.x + dx, P.y + dy, r / sc, 0, TAU); ctx.fill();
  };
  for (const p of peds) if (p.cop && !p.dead && hyp(p.x - P.x, p.y - P.y) < DOT_RANGE) dot(p.x, p.y, '#3b82f6', 3);
  for (const c of cars) if (c.cop && !c.dead && hyp(c.x - P.x, c.y - P.y) < DOT_RANGE) dot(c.x, c.y, Math.floor(tm * 6) % 2 ? '#ef4444' : '#3b82f6', 4);
  for (const c of cars) if (c.fire && !c.dead && hyp(c.x - P.x, c.y - P.y) < DOT_RANGE) dot(c.x, c.y, '#f87171', 4);
  if (heli && hyp(heli.x - P.x, heli.y - P.y) < DOT_RANGE) dot(heli.x, heli.y, '#f87171', 4);
  for (const p of nearbyPois()) dot(p.x, p.y, p.col, 4);
  const mp = missionPos();
  if (mp && !order) dot(mp[0], mp[1], missionColor(), 6);
  ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(P.a);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, S, 0, TAU); ctx.stroke();
  const bx = cx + S + 16, by = H - 50;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, by, 200, 16);
  ctx.fillStyle = P.hp > 100 ? '#60a5fa' : P.hp > 30 ? '#22c55e' : '#ef4444';
  ctx.fillRect(bx, by, 200 * clamp(P.hp / 150, 0, 1), 16);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, 200, 16);
  if (P.veh) {
    const c = P.veh;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, by - 22, 200, 10);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(bx, by - 22, 200 * clamp(c.hp / 100, 0, 1), 10);
    label(MODELS[c.model].n + ' • ' + Math.round(hyp(c.vx, c.vy) * .36) + ' km/h', bx, by - 30, 16, '#fff');
  } else {
    label(itemHudText(), bx, by - 8, 16, '#fde047');
  }
  label('$' + money.toLocaleString('pt-BR'), W - 20, 40, 32, '#4ade80', 'right');
  for (let i = 0; i < 5; i++) {
    const on = i < wanted, fl = on && heatT === 0 && Math.floor(tm * 4) % 2;
    label('★', W - 30 - i * 30, 76, 28, on ? (fl ? '#fff' : '#facc15') : 'rgba(255,255,255,.25)', 'right');
  }
  const hh = Math.floor(tod), mm = Math.floor((tod % 1) * 60);
  label(String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), W - 20, 104, 16, '#cbd5e1', 'right');
  if (mission && !order) label(missionText(), W / 2, 34, 18, missionColor(), 'center');
  toasts.forEach((t, i) => label(t.t, W / 2, 70 + i * 24, 16, '#fff', 'center'));
  if (!P.veh && st === 'play' && !garageAnim) {
    let n = null, bd = 60;
    for (const c of cars) { const d = hyp(c.x - P.x, c.y - P.y); if (d < bd && !c.drv && !c.dead) { bd = d; n = c; } }
    if (n) label('[E] Entrar no veículo', W / 2, H - 60, 18, '#fff', 'center');
  }
  if (garageNear() && st === 'play') {
    const t = garageAnim ? '' : P.veh ? '[G] Guardar carro na garagem'
      : garage.length ? '[G] Pegar carro da garagem (' + garage.length + ')' : 'Garagem vazia';
    if (t) label(t, W / 2, H - 90, 18, '#38bdf8', 'center');
  }
  if (shopNear() && st === 'play') label('[E] Entrar na loja', W / 2, H - 120, 18, '#4ade80', 'center');
  drawAmmuPrompt();
  drawAtmPrompt();
  drawDeliveryHud();
  drawOficinaHint();
  drawBankHint();
  drawHouseHint();
  drawClothesHint();
  drawCasinoHint();
  drawDistrictName();
}

function overlays() {
  if (st === 'menu') drawMenuScreen();
  if (st === 'pause') drawPauseStats();
  if (st === 'dead') {
    ctx.fillStyle = 'rgba(0,0,0,' + clamp(deadT * .4, 0, .6) + ')'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = clamp(deadT, 0, 1);
    label('WASTED', W / 2, H / 2, Math.min(120, W / 8), '#dc2626', 'center');
    ctx.globalAlpha = 1;
  }

  if (st === 'shop') drawShopOverlay();
  if (st === 'ammu') drawAmmuOverlay();
  if (st === 'code') drawCodeOverlay();
  if (st === 'mapa') drawMapa();
  if (st === 'oficina') drawOficinaOverlay();
  if (st === 'bank') drawBankOverlay();
  if (st === 'atm') drawAtmOverlay();
  if (st === 'clothes') drawClothesOverlay();
  if (st === 'casino') drawCasinoOverlay();
  if (st === 'safehouse') drawSafehouseOverlay();

  drawDebugMenu();
}

// Tela de pausa: ficha do criminoso com estatísticas, título e progresso
function drawPauseStats() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0, 0, 8, 0.82)'; ctx.fillRect(0, 0, W, H);

  const bw = 760, bh = 560, bx = W / 2 - bw / 2, by = H / 2 - bh / 2, cx = W / 2;
  drawPremiumPanel(bx, by, bw, bh, '#f472b6');

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f472b6';
  ctx.font = 'bold 40px "Segoe UI", sans-serif';
  ctx.shadowColor = '#f472b6'; ctx.shadowBlur = 16;
  ctx.fillText('PAUSADO', cx, by + 58);
  ctx.shadowBlur = 0;
  ctx.font = '14px "Consolas", monospace'; ctx.fillStyle = '#94a3b8';
  ctx.fillText('FICHA DO CRIMINOSO  •  P ou Esc para continuar', cx, by + 84);

  const s = stats;
  const pontos = Math.round(s.crimes * 120 + s.abatidos * 80 + s.missoes * 150 + s.ganho / 20);
  s.pontuacao = pontos;
  const titulo = pontos >= 3000 ? 'LENDA DO CRIME' : pontos >= 1500 ? 'CHEFE DO SUBMUNDO'
    : pontos >= 600 ? 'PROCURADO' : pontos >= 200 ? 'PEQUENO TRAFICANTE' : 'CIDADÃO (POR ENQUANTO)';
  ctx.fillStyle = 'rgba(244,114,182,.12)';
  ctx.beginPath(); ctx.roundRect(bx + 40, by + 100, bw - 80, 52, 12); ctx.fill();
  ctx.fillStyle = '#fde68a'; ctx.font = 'bold 24px "Segoe UI", sans-serif';
  ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 10;
  ctx.fillText(titulo, cx, by + 134);
  ctx.shadowBlur = 0;

  const cards = [
    { k: 'TEMPO JOGADO', v: formatTempo(s.tempo), c: '#38bdf8' },
    { k: 'CRIMES', v: String(s.crimes), c: '#f87171' },
    { k: 'MISSÕES', v: String(s.missoes), c: '#4ade80' },
    { k: 'GANHO TOTAL', v: '$' + Math.round(s.ganho).toLocaleString('pt-BR'), c: '#facc15' },
    { k: 'ABATIDOS', v: String(s.abatidos), c: '#fb923c' },
    { k: 'PONTUAÇÃO', v: pontos.toLocaleString('pt-BR'), c: '#e879f9' }
  ];
  const cw = (bw - 80 - 32) / 3, ch = 92;
  cards.forEach((card, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = bx + 40 + col * (cw + 16), y = by + 170 + row * (ch + 14);
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 14); ctx.fill();
    ctx.strokeStyle = card.c; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = card.c; ctx.fillRect(x, y + 12, 4, ch - 24);
    ctx.textAlign = 'center';
    ctx.font = '12px "Consolas", monospace'; ctx.fillStyle = '#94a3b8';
    ctx.fillText(card.k, x + cw / 2, y + 30);
    ctx.font = 'bold 26px "Consolas", monospace'; ctx.fillStyle = card.c;
    ctx.shadowColor = card.c; ctx.shadowBlur = 10;
    ctx.fillText(card.v, x + cw / 2, y + 66);
    ctx.shadowBlur = 0;
  });

  // Progresso até o próximo título
  const limites = [200, 600, 1500, 3000];
  const prox = limites.find(l => pontos < l) || 3000;
  const progresso = clamp(pontos / prox, 0, 1);
  const by2 = by + 420;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.roundRect(bx + 40, by2, bw - 80, 22, 11); ctx.fill();
  const gradBar = ctx.createLinearGradient(bx + 40, 0, bx + bw - 40, 0);
  gradBar.addColorStop(0, '#f472b6'); gradBar.addColorStop(1, '#facc15');
  ctx.fillStyle = gradBar;
  ctx.beginPath(); ctx.roundRect(bx + 40, by2, (bw - 80) * progresso, 22, 11); ctx.fill();
  ctx.textAlign = 'center'; ctx.font = '13px "Consolas", monospace'; ctx.fillStyle = '#e2e8f0';
  ctx.fillText('PROGRESSO ATÉ O PRÓXIMO TÍTULO: ' + Math.round(progresso * 100) + '%', cx, by2 + 48);

  ctx.font = '16px "Segoe UI", sans-serif'; ctx.fillStyle = '#facc15';
  ctx.fillText('Procurado agora: ' + '★'.repeat(wanted) + '☆'.repeat(5 - wanted), cx, by2 + 78);

  ctx.font = '12px "Consolas", monospace'; ctx.fillStyle = '#475569';
  ctx.fillText('Estatísticas salvas automaticamente', cx, by + bh - 20);
}

function formatTempo(seg) {
  const t = Math.floor(seg);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return h > 0
    ? h + 'h ' + String(m).padStart(2, '0') + 'm'
    : String(m).padStart(2, '0') + 'm ' + String(s).padStart(2, '0') + 's';
}