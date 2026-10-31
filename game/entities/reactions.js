// ===== REAÇÕES DOS PEDESTRES E CARROS ESTACIONADOS =====
function panic(p, ang, t) {
  if (p.fl <= 0) ftext(p.x, p.y - 12, pick(['Ahh!', 'Socorro!', 'Corre!']), '#fff');
  p.fl = Math.max(p.fl, t);
  p.a = ang;
}

function updReactions() {
  if (st !== 'play') return;
  const v = P.veh;
  const aiming = mouse.down && !P.sel && !P.veh && ammo[P.w] > 0;
  for (const p of peds) {
    if (p.dead || p.cop) continue;
    if (v && hyp(v.vx, v.vy) > 60) {
      const d = hyp(p.x - v.x, p.y - v.y);
      if (d < 60) panic(p, Math.atan2(p.y - v.y, p.x - v.x), 2.2);
    }
    if (aiming) {
      const dx = p.x - P.x, dy = p.y - P.y, d = hyp(dx, dy);
      if (d < 240 && Math.abs(angD(Math.atan2(dy, dx), P.a)) < .5)
        panic(p, Math.atan2(dy, dx) + rnd(-.8, .8), 2);
    }
  }
}

function parkCars() {
  let n = 0;
  for (let t = 0; t < 200 && n < 22; t++) {
    const i = (R() * N) | 0, j = (R() * N) | 0, ix = i * CELL, jy = j * CELL;
    let x, y, a;
    if (R() < .5) { x = ix + RD + rnd(60, CELL - RD - 60); y = jy - 4; a = 0; }
    else { x = ix - 4; y = jy + RD + rnd(60, CELL - RD - 60); a = Math.PI / 2; }
    if (hyp(x - SX, y - SY) < 400) continue;
    if (cars.some(c => hyp(c.x - x, c.y - y) < 90)) continue;
    const c = mkCar(x, y, a, { ai: false, col: pick(CC) });
    c.parked = true;
    cars.push(c); n++;
  }
}