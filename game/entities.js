const WP = [
  { n: 'Pistola', rate: .28, dmg: 25, sp: .03, pel: 1, v: 900, life: .8 },
  { n: 'SMG',     rate: .07, dmg: 12, sp: .09, pel: 1, v: 1000, life: .7 },
  { n: 'Escopeta',rate: .8,  dmg: 14, sp: .22, pel: 7, v: 850,  life: .35 }
];
const CC = ['#2563eb','#16a34a','#f59e0b','#9333ea','#e5e7eb','#0f766e','#dc2626','#64748b','#111827'];
const PC = ['#ef4444','#3b82f6','#22c55e','#eab308','#a855f7','#f97316','#e5e7eb','#14b8a6'];
const SK = ['#f1c27d','#c68642','#8d5524','#e0ac69','#ffdbac'];

const MODELS = {
  sedan:     { n: 'Sedan',     max: 430, acc: 280, grip: 7,   turn: 2.6, armor: 1,   L: 44, W: 22, aiK: 1 },
  esportivo: { n: 'Esportivo', max: 560, acc: 430, grip: 4.2, turn: 2.0, armor: 1.3, L: 40, W: 20, aiK: .9 },
  caminhao:  { n: 'Caminhão',  max: 300, acc: 140, grip: 9,   turn: 1.5, armor: .4,  L: 64, W: 26, aiK: .65 }
};
function pickModel() {
  const r = R();
  return r < .12 ? 'caminhao' : r < .27 ? 'esportivo' : 'sedan';
}

// ===== GARAGEM (dentro de um prédio) =====
const GAR_CELL = { i: 5, j: 5 };
const GAR_BLD = {
  x: GAR_CELL.i * CELL + RD + 20, y: GAR_CELL.j * CELL + RD + 20,
  w: CELL - RD - 40, h: CELL - RD - 40
};
const GDOOR = { x: GAR_BLD.x + GAR_BLD.w / 2, y: GAR_BLD.y + GAR_BLD.h + 4 };
const GX = GDOOR.x, GY = GDOOR.y;
const GARAGE_MAX = 3;
let garage = [];
let garageAnim = null;

let st = 'menu', P, cars, peds, bullets, PT, cash, pk, FT, toasts, money, wanted, heatT, tod,
    mission, mWait, ammo, owned, camX = 0, camY = 0, camZ = 1, shake = 0, hurtF = 0, deadT = 0, spawnT = 0, tm = 0;

let inv = { faca: 0, bastao: 0, c4: 0, granada: 0, molotov: 0 };
let vestEnd = 0;

const SX = 8 * CELL + RD + 10, SY = 8 * CELL + RD + 120;
const PED_MAX = 70;
const PED_SCALE = 1.25;

function mkCar(x, y, a, o = {}) {
  const key = MODELS[o.model] ? o.model : 'sedan';
  const m = MODELS[key];
  return {
    model: key, x, y, a, vx: 0, vy: 0, sp: 0, hp: 100,
    col: o.col || pick(CC), ai: o.ai !== false, cop: !!o.cop, pol: !!o.cop,
    dir: Math.round(a / (Math.PI / 2)) & 3, tsp: rnd(150, 230) * m.aiK, inI: false,
    drv: null, stk: 0, ig: 0, burn: 0, cd: 0, dp: 0,
    max: m.max, acc: m.acc, gripBase: m.grip, turn: m.turn, armor: m.armor, L: m.L, Wd: m.W
  };
}
function mkPed(x, y, o = {}) {
  return {
    x, y, a: (R() * 4 | 0) * Math.PI / 2, hp: o.cop ? 70 : 40, r: 7,
    col: o.cop ? '#1d4ed8' : pick(PC), skin: pick(SK), cop: !!o.cop,
    t: rnd(1, 3), fl: o.fl || 0, spd: rnd(35, 55), dead: 0, cd: rnd(0, 1), tg: 0
  };
}

function init() {
  cars = []; peds = []; bullets = []; PT = []; cash = []; pk = []; FT = []; toasts = [];
  P = { x: SX, y: SY, a: 0, hp: 100, r: 8, veh: null, cd: 0, w: 0, iv: 0, col: '#f97316', skin: '#d9a066', sel: null };
  cars.push(mkCar(8 * CELL + 90, SY, -Math.PI / 2, { ai: false, col: '#e11d48' }));

  const saved = loadGame();
  money = saved.money; owned = saved.owned; ammo = saved.ammo; garage = saved.garage;
  inv = saved.inv; vestEnd = 0;
  garageAnim = null;
  order = null; codeBuf = '';
  wanted = 0; heatT = 0; tod = 9; mission = null; mWait = 5;
  camX = SX; camY = SY;
  fireSpawnT = 20;

  for (let k = 0; k < 40; k++) {
    const p = randWalk();
    pk.push({ x: p[0], y: p[1], t: pick(['hp', 'hp', 'smg', 'shot']) });
  }
  for (let k = 0; k < 60; k++) spawnPed(true);
  for (let k = 0; k < 16; k++) spawnCar(true);
  parkCars();
}

function start() {
  init();
  st = 'play';
  toast('Bem-vindo! Entre no carro vermelho perto de você (tecla E).');
}
function toast(t) { toasts.push({ t, l: 4 }); }
function ftext(x, y, t, c = '#fff') { FT.push({ x, y, t, c, l: 1 }); }
function crime(n) {
  if (n > wanted) { wanted = Math.min(5, n); toast('Nível de procurado: ' + '★'.repeat(wanted)); }
  heatT = 0;
}

function spawnPed(init, cop) {
  for (let t = 0; t < 12; t++) {
    const a = rnd(0, TAU);
    const r = init ? rnd(120, 1300) : rnd(260, 620);
    const x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r;
    if (walkable(x, y, 10)) { const p = mkPed(x, y, { cop }); peds.push(p); return p; }
  }
}
function spawnCar(init, cop) {
  for (let t = 0; t < 12; t++) {
    const a = rnd(0, TAU), r = init ? rnd(250, 1400) : VR() + rnd(0, 250);
    let x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r;
    if (x < 20 || y < 20 || x > WS - CELL || y > WS - CELL) continue;

    const ci = Math.floor(x / CELL), cj = Math.floor(y / CELL), dir = (R() * 4) | 0;
    if (dir % 2 === 0) y = cj * CELL + (dir === 0 ? 90 : 30);
    else x = ci * CELL + (dir === 1 ? 30 : 90);

    if (cars.some(o => hyp(o.x - x, o.y - y) < 70)) continue;
    if (hyp(x - P.x, y - P.y) < 220) continue;

    const c = mkCar(x, y, dir * Math.PI / 2, { ai: true, cop: cop || R() < .08, model: cop ? 'sedan' : pickModel() });
    c.dir = dir; c.sp = c.tsp; cars.push(c); return c;
  }
}

function burst(x, y, col, n = 8, sp = 150, l = .6, s = 3) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, TAU), v = rnd(0, sp);
    PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: rnd(l * .5, l), m: l, c: col, s });
  }
}
function smoke(x, y, col = '#444') {
  PT.push({ x, y, vx: rnd(-15, 15), vy: rnd(-30, -10), l: 1, m: 1, c: col, s: 6, sm: 1 });
}
function explode(x, y, src) {
  callIncident(x, y);
  noise(.8, .3, 900); snd(60, .5, 'sawtooth', .1, -30); shake = 22;
  burst(x, y, '#f97316', 40, 320, .8, 5); burst(x, y, '#fde047', 20, 200, .5, 4); burst(x, y, '#222', 15, 120, 1.2, 6);
  for (const o of cars) { const d = hyp(o.x - x, o.y - y); if (d < 110 && d > 1) o.hp -= 45 * (1 - d / 110); }
  for (const p of peds) { if (!p.dead && hyp(p.x - x, p.y - y) < 110) hurtPed(p, 90, src); }
  const d = hyp(P.x - x, P.y - y);
  if (!P.veh && d < 100) hurtP(60 * (1 - d / 100), .5);
}
function hurtP(d, iv = .3) {
  if (P.iv > 0 || st !== 'play') return;
  P.hp -= d; P.iv = iv; hurtF = .4; burst(P.x, P.y, '#b91c1c', 5, 120);
}
function hurtPed(p, d, src) {
  if (p.dead) return;
  p.hp -= d; burst(p.x, p.y, '#b91c1c', 5, 120); p.fl = Math.max(p.fl, 5);
  if (src === 'p') crime(p.cop ? 2 : 1);
  if (p.hp <= 0) {
    p.dead = 1; p.dt = 12;
    cash.push({ x: p.x, y: p.y, v: p.cop ? 100 : Math.round(rnd(10, 80)) });
    burst(p.x, p.y, '#991b1b', 12, 160, .8);
    if (src === 'p' && p.cop) crime(Math.min(5, Math.max(wanted, 2) + 1));
  }
}
function die() {
  st = 'dead'; deadT = 0;
  if (P.veh) { P.veh.drv = null; P.veh = null; engine(null); }
  snd(80, 1, 'sawtooth', .1, -40);
}

function garageNear() { return hyp(P.x - GX, P.y - GY) < 70; }
function garageAction() {
  if (garageAnim) return;
  if (!garageNear()) { toast('Vá até a porta da garagem (prédio azul).'); return; }
  if (P.veh) {
    if (garage.length >= GARAGE_MAX) { toast('Garagem cheia!'); return; }
    const c = P.veh;
    garageAnim = { t: 0, mode: 'in', car: c, model: c.model, col: c.col };
    c.drv = null; c.ai = false; c.vx = 0; c.vy = 0; c.sp = 0;
    P.veh = null; engine(null);
    snd(260, .25, 'triangle', .05, -80);
  } else {
    if (!garage.length) { toast('Garagem vazia.'); return; }
    const g = garage[garage.length - 1];
    const fee = Math.round((100 - (g.hp ?? 100)) * 2);
    if (money < fee) { toast('Sem dinheiro para o conserto ($' + fee + ')'); return; }
    garageAnim = { t: 0, mode: 'out', model: g.model, col: g.col, fee };
    snd(260, .25, 'triangle', .05, 80);
  }
}
function finishGarage() {
  const a = garageAnim;
  if (a.mode === 'in') {
    garage.push({ model: a.model, col: a.col, hp: Math.max(1, Math.round(a.car.hp)) });
    a.car.dead = 1;
    P.x = GX; P.y = GY - 40; pushOut(P, 8);
    saveGame();
    toast('Carro guardado (' + garage.length + '/' + GARAGE_MAX + ')');
  } else {
    garage.pop();
    money -= a.fee;
    const c = mkCar(GX, GY - 2, -Math.PI / 2, { ai: false, model: a.model, col: a.col });
    c.sp = 0; cars.push(c);
    saveGame();
    toast(a.fee ? 'Carro consertado por $' + a.fee + ' e retirado.' : 'Carro retirado da garagem. Aperte E para entrar.');
  }
  garageAnim = null;
}
function updGarageAnim(dt) {
  if (!garageAnim) return;
  garageAnim.t += dt;
  if (garageAnim.t >= .6) finishGarage();
}

function onKey(c) {
  if (st === 'menu') { if (c === 'Enter') start(); return; }
  if (c === 'Escape' || c === 'KeyP') {
    if (st === 'play') st = 'pause'; else if (st === 'pause') st = 'play';
    return;
  }
  if (st !== 'play') return;
  if (c === 'KeyE') { if (!tryAtm() && !tryRestaurant()) toggleVeh(); return; }
  if (c === 'KeyG') garageAction();
  if (c === 'Digit1' || c === 'Digit2' || c === 'Digit3') {
    const w = +c.slice(-1) - 1;
    if (owned[w] && (ammo[w] > 0)) { P.w = w; P.sel = null; }
  }
  if (ITEM_KEYS[c]) selectItem(ITEM_KEYS[c]);
  if (c === 'KeyT') { radio = !radio; toast(radio ? 'Tensão ligada' : 'Tensão desligada'); }
  if (c === 'KeyZ') {
    owned = [true, true, true]; ammo = [Infinity, 300, 60];
    inv.faca = 1; inv.bastao = 1; inv.granada = 5; inv.molotov = 5; inv.c4 = 5;
    P.hp = 100; saveGame(); toast('Cheat: armas, itens e vida');
  }
  if (c === 'KeyX') { wanted = 5; heatT = 0; toast('Cheat: ★★★★★'); }
  if (c === 'KeyC') { wanted = 0; toast('Cheat: procurado zerado'); }
  if (c === 'KeyV') {
    const k = mkCar(P.x + Math.cos(P.a) * 60, P.y + Math.sin(P.a) * 60, P.a, { ai: false, col: '#facc15', model: 'esportivo' });
    cars.push(k); toast('Cheat: carro esportivo');
  }
  if (c === 'KeyB') tod = (tod + 6) % 24;
  if (c === 'KeyM') { money += 10000; saveGame(); toast('Cheat: +$10.000'); }
}

function toggleVeh() {
  if (garageAnim) return;
  if (P.veh) {
    const c = P.veh;
    c.drv = null; c.ai = false;
    P.x = c.x - Math.sin(c.a) * 30; P.y = c.y + Math.cos(c.a) * 30;
    P.veh = null; pushOut(P, 8); engine(null); return;
  }
  let best = null, bd = 60;
  for (const c of cars) { const d = hyp(c.x - P.x, c.y - P.y); if (d < bd && !c.drv && !c.dead) { bd = d; best = c; } }
  if (best) {
    if (best.ai || best.parked) {
      const q = mkPed(best.x - Math.sin(best.a) * 30, best.y + Math.cos(best.a) * 30, { fl: 6 });
      peds.push(q);
      if (best.parked) crime(1);
      else if (best.cop) crime(3);
      else if (best.pol) crime(2);
    }
    best.ai = false; best.cop = false; best.parked = false; best.drv = 'p'; P.veh = best;
    snd(200, .1, 'square', .04, -60);
  }
}

function playerFoot(dt) {
  const sp = keys.ShiftLeft ? 190 : 110;
  let dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let dy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  const l = hyp(dx, dy) || 1;
  P.x += dx / l * sp * dt; P.y += dy / l * sp * dt;
  pushOut(P, 8);
  if (inBld(P.x, P.y, 6)) pushOut(P, 8);
  P.x = clamp(P.x, 10, WS - 10); P.y = clamp(P.y, 10, WS - 10);

  const wx = camX + (mouse.x - W / 2) / camZ;
  const wy = camY + (mouse.y - H / 2) / camZ;
  P.a = Math.atan2(wy - P.y, wx - P.x);

  P.cd -= dt;
  if (mouse.down && P.cd <= 0) {
    if (P.sel === 'faca' || P.sel === 'bastao') {
      if (inv[P.sel] > 0) meleeAttack();
    } else if (P.sel) {
      throwItem();
    } else {
      const w = WP[P.w];
      if (ammo[P.w] > 0) {
        P.cd = w.rate; ammo[P.w]--;
        for (let i = 0; i < w.pel; i++) {
          const a = P.a + rnd(-w.sp, w.sp);
          bullets.push({ x: P.x + Math.cos(P.a) * 14, y: P.y + Math.sin(P.a) * 14, vx: Math.cos(a) * w.v, vy: Math.sin(a) * w.v, l: w.life, d: w.dmg, o: 'p' });
        }
        noise(.08, .12, P.w === 2 ? 1500 : 3000);
        snd(P.w === 2 ? 90 : 200, .07, 'square', .04, -100);
        shake = Math.max(shake, P.w === 2 ? 4 : 1.5);
        burst(P.x + Math.cos(P.a) * 16, P.y + Math.sin(P.a) * 16, '#fde047', 3, 80, .1, 3);
        for (const p of peds) if (!p.dead && !p.cop && hyp(p.x - P.x, p.y - P.y) < 500) { p.fl = 5; p.a = Math.atan2(p.y - P.y, p.x - P.x); }
        if (ammo[P.w] <= 0 && P.w !== 0) { P.w = 0; toast('Sem munição'); }
      }
    }
  }
}

function playerCar(c, dt) {
  const up = keys.KeyW || keys.ArrowUp, dn = keys.KeyS || keys.ArrowDown;
  const lf = keys.KeyA || keys.ArrowLeft, rt = keys.KeyD || keys.ArrowRight, hb = keys.Space;
  if (up) c.sp = Math.min(c.max, c.sp + (c.sp < 0 ? 600 : c.acc) * dt);
  else if (dn) c.sp = c.sp > 20 ? c.sp - 650 * dt : Math.max(-150, c.sp - 220 * dt);
  else c.sp -= Math.sign(c.sp) * Math.min(Math.abs(c.sp), 110 * dt);
  if (hb) c.sp -= Math.sign(c.sp) * Math.min(Math.abs(c.sp), 260 * dt);
  c.a += ((rt ? 1 : 0) - (lf ? 1 : 0)) * c.turn * clamp(c.sp / 150, -1, 1) * (hb ? 1.5 : 1) * dt;
  c.grip = hb ? 1.6 : c.gripBase;
  if (keys.KeyH && !c.hn) { c.hn = 1; snd(380, .25, 'square', .05); }
  if (!keys.KeyH) c.hn = 0;
}

function chooseDir(c) {
  const ci = Math.floor(c.x / CELL), cj = Math.floor(c.y / CELL);
  const ok = [ci < N - 1, cj < N - 1, ci > 0, cj > 0];
  const dv = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  let best = -1, bs = 1e9;
  for (let d = 0; d < 4; d++) {
    if (!ok[d]) continue;
    if (!c.cop && d === (c.dir + 2) % 4) continue;
    let s;
    if (c.cop) {
      const nx = (ci + dv[d][0]) * CELL + RD / 2, ny = (cj + dv[d][1]) * CELL + RD / 2;
      s = hyp(P.x - nx, P.y - ny);
    } else s = R() * 10 - (d === c.dir ? 5 : 0);
    if (s < bs) { bs = s; best = d; }
  }
  if (best < 0) for (let d = 0; d < 4; d++) if (ok[d]) best = d;
  c.dir = best;
}
function blocked(c, fx, fy, look) {
  for (const o of cars) {
    if (o === c || o.dead) continue;
    const dx = o.x - c.x, dy = o.y - c.y, f = dx * fx + dy * fy;
    if (f > 0 && f < look && Math.abs(-dx * fy + dy * fx) < 26) return true;
  }
  if (!P.veh) {
    const dx = P.x - c.x, dy = P.y - c.y, f = dx * fx + dy * fy;
    if (f > 0 && f < look - 10 && Math.abs(-dx * fy + dy * fx) < 22) return true;
  }
  for (const p of peds) {
    if (p.dead) continue;
    const dx = p.x - c.x, dy = p.y - c.y, f = dx * fx + dy * fy;
    if (f > 0 && f < look - 20 && Math.abs(-dx * fy + dy * fx) < 20) return true;
  }
  return false;
}
function updCar(c, dt) {
  const fx = Math.cos(c.a), fy = Math.sin(c.a); let grip = c.grip || 7;
  if (c.drv === 'p') { playerCar(c, dt); grip = c.grip; }
  else if (c.ai) {
    grip = 10;
    if (c.pol) c.cop = wanted > 0 && hyp(c.x - P.x, c.y - P.y) < 1500;
    const inI = inInter(c.x, c.y);
    if (inI && !c.inI) { c.inI = true; chooseDir(c); } else if (!inI) c.inI = false;
    const ci = clamp(Math.floor(c.x / CELL), 0, N - 1), cj = clamp(Math.floor(c.y / CELL), 0, N - 1), d = c.dir;
    let ex = 0, ey = 0;
    if (d % 2 === 0) ey = cj * CELL + (d === 0 ? 90 : 30) - c.y;
    else ex = ci * CELL + (d === 1 ? 30 : 90) - c.x;
    const DV = [[1, 0], [0, 1], [-1, 0], [0, -1]][d];
    c.a += clamp(angD(Math.atan2(DV[1] + clamp(ey * .025, -.9, .9), DV[0] + clamp(ex * .025, -.9, .9)), c.a), -3.2 * dt, 3.2 * dt);
    let ts = c.cop ? 300 : c.tsp;
    if (c.ig > 0) c.ig -= dt;
    if (c.ig <= 0 && blocked(c, fx, fy, 50 + Math.abs(c.sp) * .35)) ts = 0;
    if (redAhead(c)) ts = 0;
    if (c.cop) {
      const dd = hyp(P.x - c.x, P.y - c.y);
      if (dd < 110) ts = 0;
      c.cd -= dt;
      if (dd < 380 && c.cd <= 0) {
        c.cd = rnd(.6, 1.2);
        const a = Math.atan2(P.y - c.y, P.x - c.x) + rnd(-.14, .14);
        bullets.push({ x: c.x, y: c.y, vx: Math.cos(a) * 800, vy: Math.sin(a) * 800, l: .7, d: 6, o: 'c' });
        snd(300, .05, 'square', .02, -150);
      }
      c.dp -= dt;
      if (dd < 260 && !P.veh && c.dp <= 0) {
        c.dp = 5;
        if (peds.filter(q => q.cop && !q.dead).length < wanted * 3)
          peds.push(mkPed(c.x - fy * 28, c.y + fx * 28, { cop: true }));
      }
    }
    c.sp += clamp(ts - c.sp, -520 * dt, 230 * dt);
    if (c.sp < 8) { c.stk += dt; if (c.stk > 4) { c.ig = 2.5; c.stk = 0; } } else c.stk = 0;
  } else { c.sp -= Math.sign(c.sp) * Math.min(Math.abs(c.sp), 150 * dt); }

  c.vx += (Math.cos(c.a) * c.sp - c.vx) * Math.min(1, grip * dt);
  c.vy += (Math.sin(c.a) * c.sp - c.vy) * Math.min(1, grip * dt);
  c.x += c.vx * dt; c.y += c.vy * dt;

  if (pushOut(c, 16)) {
    const dot = c.vx * c.nx + c.vy * c.ny;
    if (dot < 0) {
      c.vx -= 1.3 * dot * c.nx; c.vy -= 1.3 * dot * c.ny;
      if (-dot > 60) {
        c.hp -= -dot * .06 * c.armor; snd(70, .15, 'sawtooth', .06, -30);
        if (c.drv) shake = Math.max(shake, -dot * .03);
        burst(c.x, c.y, '#fbbf24', 4, 150, .3, 2);
      }
      c.sp = c.vx * Math.cos(c.a) + c.vy * Math.sin(c.a);
    }
  }
  if (c.x < 20 || c.x > WS - 20 || c.y < 20 || c.y > WS - 20) {
    c.x = clamp(c.x, 20, WS - 20); c.y = clamp(c.y, 20, WS - 20);
    c.vx *= -.3; c.vy *= -.3; c.sp *= .3;
  }
  const v = hyp(c.vx, c.vy);
  if (v > 70) {
    for (const p of peds) {
      if (p.dead) continue;
      const dx = p.x - c.x, dy = p.y - c.y;
      if (dx * dx + dy * dy < (20 + p.r) ** 2) {
        hurtPed(p, v * .22, c.drv === 'p' ? 'p' : 'a');
        p.x += c.vx * .06; p.y += c.vy * .06;
        snd(100, .08, 'sine', .08, -50); c.sp *= .98;
      }
    }
    if (!P.veh) {
      const dx = P.x - c.x, dy = P.y - c.y;
      if (dx * dx + dy * dy < 28 * 28 && v > 90) { hurtP(v * .1, .5); P.x += c.vx * .05; P.y += c.vy * .05; }
    }
  }
  if (c.hp < 45 && R() < .25) smoke(c.x + fx * 14, c.y + fy * 14, c.hp < 20 ? '#222' : '#777');
  if (c.hp < 20) { c.burn += dt; if (R() < .3) burst(c.x, c.y, '#f97316', 1, 60, .4, 4); if (c.burn > 3.5) c.hp = 0; }
  if (c.drv === 'p') engine(c);
  if (c.hp <= 0) {
    c.dead = 1; explode(c.x, c.y, c.drv === 'p' ? 'p' : 'a');
    if (c.drv === 'p') { P.veh = null; c.drv = null; engine(null); P.x = c.x; P.y = c.y; hurtP(60, .5); }
  }
}

function carVsCar() {
  for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
    const a = cars[i], b = cars[j];
    if (a.dead || b.dead) continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = hyp(dx, dy);
    if (d < 32 && d > .1) {
      const nx = dx / d, ny = dy / d, ov = (32 - d) / 2;
      a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
      const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (rel > 0) {
        const imp = rel * .85;
        a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp;
        a.sp = a.vx * Math.cos(a.a) + a.vy * Math.sin(a.a);
        b.sp = b.vx * Math.cos(b.a) + b.vy * Math.sin(b.a);
        if (rel > 50) {
          a.hp -= rel * .07 * a.armor; b.hp -= rel * .07 * b.armor;
          snd(60, .15, 'sawtooth', .07, -30);
          burst((a.x + b.x) / 2, (a.y + b.y) / 2, '#fbbf24', 5, 160, .3, 2);
          if (a.drv || b.drv) shake = Math.max(shake, rel * .04);
          if ((a.drv === 'p' && b.cop) || (b.drv === 'p' && a.cop)) crime(2);
        }
      }
    }
  }
}

function updPed(p, dt) {
  if (p.dead) { p.dt -= dt; return; }
  let sp = p.spd;
  if (p.cop && wanted > 0) {
    const d = hyp(P.x - p.x, P.y - p.y);
    p.a = Math.atan2(P.y - p.y, P.x - p.x);
    if (d > 170) { p.x += Math.cos(p.a) * 115 * dt; p.y += Math.sin(p.a) * 115 * dt; }
    p.cd -= dt;
    if (d < 330 && p.cd <= 0) {
      p.cd = rnd(.5, 1);
      const a = p.a + rnd(-.12, .12);
      bullets.push({ x: p.x + Math.cos(p.a) * 12, y: p.y + Math.sin(p.a) * 12, vx: Math.cos(a) * 850, vy: Math.sin(a) * 850, l: .5, d: 8, o: 'c' });
      snd(250, .05, 'square', .02, -120);
    }
  } else {
    if (p.fl > 0) { p.fl -= dt; sp = 130; }
    else if (!isRoad(p.x, p.y)) { p.t -= dt; if (p.t <= 0) { p.t = rnd(1, 4); p.a = ((R() * 4) | 0) * Math.PI / 2; } }
    let nx = p.x + Math.cos(p.a) * sp * dt, ny = p.y + Math.sin(p.a) * sp * dt;
    if (p.fl <= 0 && !isRoad(p.x, p.y) && isRoad(nx, ny) && !inInter(nx, ny)) { p.a = ((R() * 4) | 0) * Math.PI / 2; p.t = rnd(1, 3); }
    else { p.x = nx; p.y = ny; }
    if (pushOut(p, 7) && p.fl <= 0) p.a = ((R() * 4) | 0) * Math.PI / 2;
    if (p.x < 10 || p.y < 10 || p.x > WS - 10 || p.y > WS - 10) { p.x = clamp(p.x, 10, WS - 10); p.y = clamp(p.y, 10, WS - 10); p.a += Math.PI; }
  }
}

function updBullets(dt) {
  for (const b of bullets) {
    const ox = b.x, oy = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt;
    if (!b.air && segHitsBld(ox, oy, b.x, b.y)) { b.l = 0; burst(b.x, b.y, '#d1d5db', 3, 90, .2, 2); continue; }
    if (b.o === 'p') {
      if (heli && hyp(heli.x - b.x, heli.y - b.y) < 26) { heliHit(b.d); b.l = 0; continue; }
      for (const p of peds) { if (!p.dead && hyp(p.x - b.x, p.y - b.y) < p.r + 4) { hurtPed(p, b.d * (p.tg ? .6 : 1), 'p'); b.l = 0; break; } }
      if (b.l > 0) for (const c of cars) {
        if (c.drv !== 'p' && !c.dead && hyp(c.x - b.x, c.y - b.y) < 20) {
          c.hp -= b.d * .35 * c.armor; b.l = 0; burst(b.x, b.y, '#fbbf24', 3, 120, .2, 2);
          if (c.cop || c.pol) crime(2); break;
        }
      }
    } else {
      if (!P.veh && hyp(P.x - b.x, P.y - b.y) < 10) { hurtP(b.d, .08); b.l = 0; }
      else if (P.veh && hyp(P.veh.x - b.x, P.veh.y - b.y) < 20) { P.veh.hp -= b.d * .4 * P.veh.armor; hurtP(b.d * .15, .1); b.l = 0; burst(b.x, b.y, '#fbbf24', 3, 120, .2, 2); }
    }
  }
  bullets = bullets.filter(b => b.l > 0);
}

function startDelivery() {
  const a = randWalk(), b = randWalk();
  mission = { t: 'd', s: 0, a, b, r: Math.round(hyp(a[0] - b[0], a[1] - b[1]) / 10) * 10 + 300 };
  toast('MISSÃO: pegue a encomenda (marcador amarelo).');
}
function startHit() {
  const a = randWalk(), p = mkPed(a[0], a[1]);
  p.hp = 100; p.tg = 1; p.col = '#facc15'; peds.push(p);
  mission = { t: 'h', p, r: 1500 };
  toast('MISSÃO: elimine o alvo (marcador vermelho).');
}
function startSteal() {
  const cands = cars.filter(c => c.ai && !c.cop && !c.pol && !c.dead && !c.drv && !c.fire && hyp(c.x - P.x, c.y - P.y) > 150);
  if (!cands.length) return startDelivery();
  const c = pick(cands);
  mission = { t: 's', car: c, r: 1200 };
  toast('MISSÃO: roube o carro marcado (marcador laranja).');
}
function startRace() {
  const cps = [];
  let x = P.x, y = P.y;
  for (let k = 0; k < 3; k++) {
    let p = null;
    for (let t = 0; t < 60 && !p; t++) {
      const a = rnd(0, TAU), r = rnd(900, 1400);
      const q = [clamp(x + Math.cos(a) * r, 40, WS - 40), clamp(y + Math.sin(a) * r, 40, WS - 40)];
      if (isRoad(q[0], q[1])) p = q;
    }
    if (!p) p = [x, y];
    cps.push(p); x = p[0]; y = p[1];
  }
  mission = { t: 'r', cps, idx: 0, timeLeft: 110, r: 1500 };
  toast('CORRIDA: passe pelos 3 checkpoints ciano em 110 segundos!');
}
function startEscape() {
  crime(2);
  mission = { t: 'e', prog: 0, r: 800 + wanted * 200 };
  toast('MISSÃO: a polícia está atrás de você! Aguente 30 segundos.');
}
function newMission() {
  const r = R();
  if (wanted > 0 && r < .2) startEscape();
  else if (r < .45) startDelivery();
  else if (r < .62) startHit();
  else if (r < .8) startSteal();
  else startRace();
}
function missionPos() {
  const m = mission; if (!m) return null;
  switch (m.t) {
    case 'd': return m.s === 0 ? m.a : m.b;
    case 'h': return m.p.dead ? null : [m.p.x, m.p.y];
    case 's': return [m.car.x, m.car.y];
    case 'r': return m.cps[m.idx];
  }
  return null;
}
function missionColor() {
  const m = mission; if (!m) return '#fff';
  if (m.t === 'd') return m.s === 0 ? '#facc15' : '#4ade80';
  return { h: '#ef4444', s: '#f97316', r: '#22d3ee', e: '#a78bfa' }[m.t] || '#fff';
}
function missionText() {
  const m = mission; if (!m) return '';
  const p = missionPos();
  const dist = p ? ' (' + Math.round(hyp(P.x - p[0], P.y - p[1]) / 10) + ' m)' : '';
  switch (m.t) {
    case 'd': return (m.s === 0 ? 'Pegue a encomenda' : 'Entregue a encomenda') + dist + '  •  $' + m.r;
    case 'h': return 'Elimine o alvo' + dist + '  •  $' + m.r;
    case 's': return 'Roube o carro laranja' + dist + '  •  $' + m.r;
    case 'r': return 'Corrida: checkpoint ' + (m.idx + 1) + '/3  •  ' + Math.ceil(m.timeLeft) + 's  •  $' + m.r;
    case 'e': return 'Fuja da polícia: ' + Math.ceil(30 - m.prog) + 's  •  $' + m.r;
  }
  return '';
}
function updMission(dt) {
  if (!mission) { mWait -= dt; if (mWait <= 0) newMission(); return; }
  const m = mission;
  let done = false, fail = null;
  switch (m.t) {
    case 'd': {
      const g = missionPos();
      if (hyp(P.x - g[0], P.y - g[1]) < 50) {
        if (m.s === 0) { m.s = 1; toast('Encomenda coletada! Leve ao destino verde.'); snd(700, .2, 'triangle', .06, 400); }
        else done = true;
      }
      break;
    }
    case 'h': if (m.p.dead) done = true; break;
    case 's':
      if (m.car.dead || !cars.includes(m.car)) fail = 'o carro sumiu.';
      else if (P.veh === m.car) done = true;
      break;
    case 'r': {
      m.timeLeft -= dt;
      if (m.timeLeft <= 0) fail = 'tempo esgotado.';
      else {
        const c = m.cps[m.idx];
        if (hyp(P.x - c[0], P.y - c[1]) < 60) {
          m.idx++;
          snd(700, .15, 'triangle', .06, 400);
          if (m.idx >= 3) done = true; else toast('Checkpoint ' + m.idx + '/3!');
        }
      }
      break;
    }
    case 'e':
      if (wanted > 0) m.prog += dt;
      if (m.prog >= 30) done = true;
      break;
  }
  if (fail) {
    toast('MISSÃO FALHOU: ' + fail);
    snd(120, .4, 'sawtooth', .08, -60);
    mission = null; mWait = 5; return;
  }
  if (done) {
    money += m.r; saveGame(); toast('MISSÃO COMPLETA! +$' + m.r);
    snd(600, .4, 'triangle', .07, 800);
    mission = null; mWait = 6;
  }
}

function update(dt) {
  tm += dt; tod = (tod + dt / 10) % 24;
  P.iv -= dt; hurtF = Math.max(0, hurtF - dt); shake *= .9;
  updGarageAnim(dt);
  updBarriers(dt);
  updHeli(dt);
  updFireSpawn(dt);
  updVest(dt);
  updCombat(dt);
  if (P.veh) { P.x = P.veh.x; P.y = P.veh.y; P.a = P.veh.a; }
  else { playerFoot(dt); engine(null); }
  for (const c of cars) if (!c.dead) (c.fire ? updFire(c, dt) : updCar(c, dt));
  carVsCar();
  for (const p of peds) updPed(p, dt);
  updBullets(dt);
  updReactions(dt);
  updDelivery(dt);

  if (!order) updMission(dt);

  for (const c of cash) if (hyp(c.x - P.x, c.y - P.y) < 24) {
    c.g = 1; money += c.v; saveGame(); ftext(c.x, c.y, '+$' + c.v, '#4ade80'); snd(900, .08, 'sine', .05, 300);
  }
  cash = cash.filter(c => !c.g);

  for (const k of pk) if (!P.veh && hyp(k.x - P.x, k.y - P.y) < 20) {
    if (k.t === 'hp') { if (P.hp < 100) { P.hp = Math.min(100, P.hp + 40); k.g = 1; ftext(k.x, k.y, '+Vida', '#f87171'); } }
    else {
      const w = k.t === 'smg' ? 1 : 2;
      owned[w] = true; ammo[w] += w === 1 ? 90 : 16; k.g = 1; saveGame();
      ftext(k.x, k.y, '+' + WP[w].n, '#fde047');
    }
    if (k.g) snd(700, .15, 'triangle', .06, 400);
  }
  pk = pk.filter(k => !k.g);
  if (pk.length < 30) {
    const p = randWalk();
    if (hyp(p[0] - P.x, p[1] - P.y) > VR()) pk.push({ x: p[0], y: p[1], t: pick(['hp', 'hp', 'smg', 'shot']) });
  }

  if (wanted > 0) {
    let near = false;
    for (const p of peds) if (p.cop && !p.dead && hyp(p.x - P.x, p.y - P.y) < 520) near = true;
    for (const c of cars) if (c.cop && !c.dead && hyp(c.x - P.x, c.y - P.y) < 520) near = true;
    if (near) heatT = 0;
    else { heatT += dt; if (heatT > 12) { wanted--; heatT = 0; toast(wanted ? 'Procurado diminuiu' : 'Você despistou a polícia!'); } }
  } else for (const c of cars) c.cop = false;

  spawnT -= dt;
  if (spawnT <= 0) {
    spawnT = .25;
    const vr = VR();
    if (peds.filter(p => !p.cop && !p.dead && !p.idle).length < PED_MAX) { spawnPed(false); spawnPed(false); }
    if (cars.filter(c => c.ai && !c.cop && !c.dead && !c.fire).length < 16) spawnCar(false);
    if (wanted > 0) {
      if (peds.filter(p => p.cop && !p.dead).length < wanted * 2) spawnPed(false, true);
      if (cars.filter(c => c.cop && !c.dead).length < Math.max(0, wanted - 1)) spawnCar(false, true);
    }
    peds = peds.filter(p => !(p.dead && p.dt <= 0) && (p.tg || p.dead || p.idle || hyp(p.x - P.x, p.y - P.y) < vr + 500));
    cars = cars.filter(c => !c.dead && (c.drv || !c.ai && hyp(c.x - P.x, c.y - P.y) < vr + 900 || c.ai && hyp(c.x - P.x, c.y - P.y) < vr + 500));
  } else cars = cars.filter(c => !c.dead);

  for (const p of PT) { p.l -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; if (p.sm) p.s += dt * 8; }
  PT = PT.filter(p => p.l > 0).slice(-350);

  for (const t of FT) { t.l -= dt; t.y -= 25 * dt; }
  FT = FT.filter(t => t.l > 0);

  for (const t of toasts) t.l -= dt;
  toasts = toasts.filter(t => t.l > 0).slice(-3);

  if (P.hp <= 0) die();
}
function updCam(dt) {
  const lv = P.veh ? hyp(P.veh.vx, P.veh.vy) : 0;
  const tx = P.x + (P.veh ? P.veh.vx * .35 : 0), ty = P.y + (P.veh ? P.veh.vy * .35 : 0);
  const tz = ZOOM_BASE - clamp(lv / 1800, 0, .2);
  const k = Math.min(1, 5 * dt);
  camX += (tx - camX) * k; camY += (ty - camY) * k;
  camZ += (tz - camZ) * Math.min(1, 2 * dt);
}