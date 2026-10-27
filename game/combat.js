// ===== COMBATE ESPECIAL, EXPLOSIVOS E CAIXAS ELETRÔNICOS =====
const ITEM_NAMES = { faca: 'Faca', bastao: 'Bastão', granada: 'Granada', molotov: 'Molotov', c4: 'C4' };
const ITEM_KEYS = { Digit4: 'faca', Digit5: 'bastao', Digit6: 'granada', Digit7: 'molotov', Digit8: 'c4' };

let grenades = [];
let fires = [];
let meleeFx = null;
let atmProg = null;

const ATMS = [[2, 2], [6, 3], [12, 7], [3, 11], [9, 13], [14, 10]].map(([i, j]) => ({
  x: i * CELL + RD + 8, y: j * CELL + RD + 8, used: false, cd: 0
}));
function atmC(a) { return [a.x + 7, a.y + 7]; }
function nearAtm() {
  if (P.veh) return null;
  for (const a of ATMS) {
    const [x, y] = atmC(a);
    if (hyp(P.x - x, P.y - y) < 50) return a;
  }
  return null;
}

function itemHudText() {
  const s = P.sel;
  if (!s) { const w = WP[P.w]; return w.n + ' ' + (ammo[P.w] === Infinity ? '∞' : ammo[P.w]); }
  if (s === 'faca' || s === 'bastao') return ITEM_NAMES[s];
  return ITEM_NAMES[s] + ' x' + (inv[s] || 0);
}

function selectItem(k) {
  if (!inv[k]) { toast('Você não tem ' + ITEM_NAMES[k] + '. Compre na Ammu-Nation (R).'); return; }
  P.sel = k;
  toast('Equipado: ' + ITEM_NAMES[k]);
}

function meleeAttack() {
  const knife = P.sel === 'faca';
  const range = knife ? 34 : 40, dmg = knife ? 70 : 35;
  P.cd = knife ? .3 : .55;
  meleeFx = { x: P.x, y: P.y, a: P.a, t: .15, knife };
  for (const p of peds) {
    if (p.dead) continue;
    if (hyp(p.x - P.x, p.y - P.y) > range + p.r) continue;
    if (Math.abs(angD(Math.atan2(p.y - P.y, p.x - P.x), P.a)) > 1.1) continue;
    hurtPed(p, dmg, knife && !p.cop ? 'k' : 'p');
  }
  if (knife) snd(500, .06, 'triangle', .04);
  else snd(140, .08, 'sawtooth', .05);
}

function throwItem() {
  const k = P.sel;
  if (!inv[k]) { P.sel = null; toast('Acabou ' + ITEM_NAMES[k] + '.'); return; }
  if (k === 'c4') { toast('C4 se usa num caixa eletrônico (E perto de um).'); P.cd = .5; return; }
  const tx = camX + (mouse.x - W / 2) / camZ, ty = camY + (mouse.y - H / 2) / camZ;
  const dx = tx - P.x, dy = ty - P.y, d = hyp(dx, dy) || 1, f = Math.min(1, 320 / d);
  inv[k]--;
  grenades.push({ type: k, sx: P.x, sy: P.y, tx: P.x + dx * f, ty: P.y + dy * f, x: P.x, y: P.y, t: 0, dur: k === 'granada' ? 1 : .6, done: false });
  P.cd = .6;
  if (k === 'molotov' || k === 'granada') crime(1);
  snd(400, .15, 'triangle', .04, 200);
  if (inv[k] <= 0) { P.sel = null; toast('Acabou ' + ITEM_NAMES[k] + '.'); }
  saveGame();
}

function updCombat(dt) {
  if (meleeFx) { meleeFx.t -= dt; if (meleeFx.t <= 0) meleeFx = null; }

  for (const g of grenades) {
    g.t += dt;
    const f = Math.min(1, g.t / g.dur);
    g.x = g.sx + (g.tx - g.sx) * f; g.y = g.sy + (g.ty - g.sy) * f;
    if (g.t >= g.dur) {
      g.done = true;
      if (g.type === 'granada') explode(g.tx, g.ty, 'p');
      else {
        fires.push({ x: g.tx, y: g.ty, t: 5 });
        snd(120, .4, 'sawtooth', .06, -40);
        burst(g.tx, g.ty, '#f97316', 20, 140, .6, 4);
      }
    }
  }
  grenades = grenades.filter(g => !g.done);

  for (const f of fires) {
    f.t -= dt;
    for (const p of peds) if (!p.dead && hyp(p.x - f.x, p.y - f.y) < 55) { hurtPed(p, 20 * dt, 'f'); p.fl = Math.max(p.fl, .4); }
    for (const c of cars) if (!c.dead && hyp(c.x - f.x, c.y - f.y) < 55) c.hp -= 12 * dt * c.armor;
    if (!P.veh && hyp(P.x - f.x, P.y - f.y) < 55) hurtP(8, .5);
  }
  fires = fires.filter(f => f.t > 0);

  updAtm(dt);
}

function tryAtm() {
  const a = nearAtm();
  if (!a) return false;
  if (atmProg) return true;
  if (a.used) { toast('Este caixa está sem dinheiro. Volte mais tarde.'); return true; }
  if (!inv.c4) { toast('Você precisa de um explosivo. Compre na Ammu-Nation.'); return true; }
  inv.c4--;
  if (!inv.c4 && P.sel === 'c4') P.sel = null;
  atmProg = { atm: a, t: 0, beep: 0 };
  toast('C4 plantada! Fique perto do caixa por 5 segundos.');
  saveGame();
  return true;
}

function updAtm(dt) {
  for (const a of ATMS) if (a.used && tm >= a.cd) a.used = false;
  if (!atmProg) return;
  if (st !== 'play') { atmProg = null; return; }
  const p = atmProg, [x, y] = atmC(p.atm);
  if (P.veh || hyp(P.x - x, P.y - y) > 80) {
    atmProg = null;
    toast('Roubo cancelado: você se afastou do caixa.');
    snd(150, .2, 'square', .05);
    return;
  }
  p.t += dt; p.beep -= dt;
  if (p.beep <= 0) { p.beep = Math.max(.1, .5 - p.t * .09); snd(1800, .05, 'square', .04); }
  if (p.t >= 5) detonateAtm(p.atm);
}

function detonateAtm(a) {
  atmProg = null;
  const [x, y] = atmC(a);
  noise(.9, .35, 700); snd(60, .6, 'sawtooth', .12, -30); shake = 18;
  burst(x, y, '#f97316', 30, 260, .7, 5); burst(x, y, '#a3a3a3', 20, 160, 1, 4);
  for (const p of peds) if (!p.dead && hyp(p.x - x, p.y - y) < 60) hurtPed(p, 90, 'a');
  for (const c of cars) if (!c.dead && hyp(c.x - x, c.y - y) < 60) c.hp -= 40 * c.armor;
  crime(2);
  a.used = true; a.cd = tm + 120;
  const total = 200 + Math.round(R() * 300), parts = 4;
  for (let k = 0; k < parts; k++)
    cash.push({ x: x + rnd(-28, 28), y: y + rnd(-28, 28), v: Math.round(total / parts) });
  toast('CAIXA ESTOURADO! Pegue o dinheiro no chão (+$' + total + ').');
  saveGame();
}

function drawAtms() {
  for (const a of ATMS) {
    ctx.fillStyle = a.used ? '#374151' : '#1e293b'; ctx.fillRect(a.x, a.y, 14, 14);
    ctx.strokeStyle = a.used ? '#6b7280' : '#f0abfc'; ctx.lineWidth = 1.5; ctx.strokeRect(a.x, a.y, 14, 14);
    ctx.fillStyle = a.used ? '#6b7280' : '#86efac'; ctx.fillRect(a.x + 3, a.y + 3, 8, 4);
  }
  if (atmProg) {
    const [x, y] = atmC(atmProg.atm);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 20 + Math.sin(tm * 20) * 4, 0, TAU); ctx.stroke();
  }
}

function drawCombat() {
  for (const g of grenades) {
    ctx.fillStyle = g.type === 'granada' ? '#3f6212' : '#b45309';
    ctx.beginPath(); ctx.arc(g.x, g.y, 5, 0, TAU); ctx.fill();
  }
  for (const f of fires) {
    const k = clamp(f.t / 5, 0, 1);
    for (let n = 0; n < 6; n++) {
      const a = tm * 5 + n, r = 22 + Math.sin(a * 2) * 6;
      ctx.fillStyle = n % 2 ? 'rgba(251,191,36,.7)' : 'rgba(239,68,68,.6)';
      ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 14 * k, f.y + Math.sin(a) * 14 * k - 4, r * .5 * k + 6, 0, TAU); ctx.fill();
    }
  }
  if (meleeFx) {
    const m = meleeFx, f = clamp(m.t / .15, 0, 1), range = m.knife ? 34 : 40;
    ctx.strokeStyle = m.knife ? 'rgba(226,232,240,' + f + ')' : 'rgba(250,204,21,' + f + ')';
    ctx.lineWidth = m.knife ? 3 : 6;
    ctx.beginPath(); ctx.arc(m.x, m.y, range, m.a - .9, m.a + .9); ctx.stroke();
  }
}

function drawAtmPrompt() {
  if (st !== 'play') return;
  if (atmProg) {
    const left = Math.max(0, 5 - atmProg.t).toFixed(1);
    label('Explodindo caixa... ' + left + 's', W / 2, H - 180, 20, '#ef4444', 'center');
    return;
  }
  const a = nearAtm(); if (!a) return;
  label(a.used ? 'Caixa sem dinheiro' : '[E] Explodir caixa com C4', W / 2, H - 180, 18, '#f0abfc', 'center');
}