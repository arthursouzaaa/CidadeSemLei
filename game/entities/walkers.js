// ===== VIDA DOS PEDESTRES: caminhar, atravessar na faixa, desviar e voltar à vida =====
// Pedestres comuns escolhem um destino; se o caminho exige atravessar a rua,
// usam a faixa de pedestre e esperam o sinal dos carros ficar vermelho.
const WALK_MAX = 50;      // pedestres caminhantes ao mesmo tempo (separado dos idle)
const WALK_GOAL_T = 30;   // tempo máximo para alcançar um destino

// Pedestre na pista ou em cruzamento? (faixa de pedestre fica no contorno da rua)
function onRoad(x, y) { return isRoad(x, y); }

// Escolhe destino na calçada, distante, alcançável em linha reta ou por faixa
function walkTarget(p) {
  for (let t = 0; t < 30; t++) {
    const x = rnd(60, WS - 60), y = rnd(60, WS - 60);
    if (walkable(x, y, 10) && hyp(x - p.x, y - p.y) > 300) return [x, y];
  }
  return null;
}

// Pedestre idle: depois do tempo, volta a andar (libera espaço no mapa)
function wakeIdle(p) { p.idle = null; p.goal = null; p.wakeT = 0; }

// Desvia de pedestres parados ou de carros próximos, sem travar
function avoidance(p, vx, vy) {
  let ax = 0, ay = 0;
  for (const q of peds) {
    if (q === p || q.dead) continue;
    const dx = p.x - q.x, dy = p.y - q.y, d = hyp(dx, dy);
    if (d > 0 && d < 22) { ax += dx / d * (22 - d); ay += dy / d * (22 - d); }
  }
  for (const c of cars) {
    if (c.dead) continue;
    const dx = p.x - c.x, dy = p.y - c.y, d = hyp(dx, dy);
    if (d > 0 && d < 45) { ax += dx / d * (45 - d) * 1.5; ay += dy / d * (45 - d) * 1.5; }
  }
  return [vx + ax * .08, vy + ay * .08];
}

// Semáforo: a rua atravessada está vermelha para carros? Então o pedestre pode cruzar.
function crossingSafe(x, y) {
  const ci = Math.round((x - RD / 2) / CELL), cj = Math.round((y - RD / 2) / CELL);
  if (ci < 0 || cj < 0 || ci >= N || cj >= N) return true;
  const ph = lightPhase(ci, cj);
  return ph === 'h' || ph === 'v' ? true : false;
}

const _updPedBaseWalk = updPed;
updPed = function (p, dt) {
  // Pedestre idle: fica parado, mas tem tempo de vida e volta a andar
  if (p.idle) {
    if (p.dead || p.cop || p.fl > 0) { wakeIdle(p); }
    else {
      p.idle.t -= dt;
      if (p.idle.t <= 0) wakeIdle(p);
      else return;
    }
  }

  // Pedestre comum (não idle, não cop, não assustado, não boss de missão)
  if (p.dead || p.cop || p.tg || p.fl > 0) return _updPedBaseWalk(p, dt);

  if (!p.goal || hyp(p.goal[0] - p.x, p.goal[1] - p.y) < 20) {
    p.goal = walkTarget(p);
    p.goalT = 0;
    p.crossWait = 0;
  }
  if (!p.goal) return _updPedBaseWalk(p, dt);

  p.goalT += dt;
  if (p.goalT > WALK_GOAL_T) { p.goal = null; return; }

  const dx = p.goal[0] - p.x, dy = p.goal[1] - p.y, d = hyp(dx, dy) || 1;
  let vx = dx / d * p.spd, vy = dy / d * p.spd;
  [vx, vy] = avoidance(p, vx, vy);
  const nx = p.x + vx * dt, ny = p.y + vy * dt;
  p.a = Math.atan2(vy, vx);

  // Está na pista? Só entra se estiver na faixa e o sinal permitir
  if (isRoad(nx, ny) && !isRoad(p.x, p.y)) {
    if (!crossingSafe(p.x, p.y)) { p.crossWait = (p.crossWait || 0) + dt; return; }
  }

  if (walkable(nx, ny, 7) || isRoad(nx, ny)) { p.x = nx; p.y = ny; }
  else {
    // obstáculo: tenta contornar pelos lados
    const side = R() < .5 ? 1 : -1;
    const ax = p.a + side * Math.PI / 2;
    const sx = p.x + Math.cos(ax) * p.spd * dt, sy = p.y + Math.sin(ax) * p.spd * dt;
    if (walkable(sx, sy, 7) || isRoad(sx, sy)) { p.x = sx; p.y = sy; }
    else p.goal = null;
  }
  pushOut(p, 7);
};

// Mantém um número de pedestres caminhando, separado dos idle
setInterval(() => {
  if (st !== 'play') return;
  const walkers = peds.filter(p => !p.dead && !p.cop && !p.idle && !p.tg).length;
  if (walkers < WALK_MAX) {
    const p = spawnPed(false);
    if (p) p.goal = null;
  }
}, 500);