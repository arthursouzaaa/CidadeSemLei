// ===== PEDESTRES QUE CAMINHAM PELA CIDADE =====
function walkTarget(p) {
  for (let t = 0; t < 30; t++) {
    const x = rnd(60, WS - 60), y = rnd(60, WS - 60);
    if (walkable(x, y, 10) && hyp(x - p.x, y - p.y) > 400) return [x, y];
  }
  return null;
}

const _updPedWalk = updPed;
updPed = function (p, dt) {
  if (p.dead || p.cop || p.idle || p.tg || p.fl > 0) return _updPedWalk(p, dt);

  if (!p.goal || hyp(p.goal[0] - p.x, p.goal[1] - p.y) < 20) {
    p.goal = walkTarget(p);
    p.goalT = 0;
  }
  if (!p.goal) return _updPedWalk(p, dt);

  p.goalT += dt;
  if (p.goalT > 25) { p.goal = null; return; }

  const dx = p.goal[0] - p.x, dy = p.goal[1] - p.y, d = hyp(dx, dy) || 1;
  const sp = p.spd;
  const nx = p.x + dx / d * sp * dt, ny = p.y + dy / d * sp * dt;
  p.a = Math.atan2(dy, dx);

  if (walkable(nx, ny, 7)) { p.x = nx; p.y = ny; }
  else {
    const side = R() < .5 ? 1 : -1;
    const ax = p.a + side * Math.PI / 2;
    const sx = p.x + Math.cos(ax) * sp * dt, sy = p.y + Math.sin(ax) * sp * dt;
    if (walkable(sx, sy, 7)) { p.x = sx; p.y = sy; }
    else p.goal = null;
  }
  pushOut(p, 7);
};