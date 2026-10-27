// ===== BLOQUEIOS DA POLÍCIA =====
// Três viaturas paradas atravessadas numa rua. Ficam no mapa até o jogador se afastar.
const BARRIER_MIN_WANTED = 3;
const BARRIER_MAX = 2;
const BARRIER_REMOVE_DIST = 900;
const BARRIER_COOLDOWN = 8;
let barGroups = [];
let barCD = 0;

function spawnBarrier() {
  for (let t = 0; t < 15; t++) {
    const a = rnd(0, TAU), r = rnd(420, 560);
    const x0 = P.x + Math.cos(a) * r, y0 = P.y + Math.sin(a) * r;
    if (x0 < 80 || y0 < 80 || x0 > WS - 80 || y0 > WS - 80) continue;

    const horiz = R() < .5;
    let cx, cy, ang;
    if (horiz) {
      cy = Math.floor(y0 / CELL) * CELL + RD / 2; cx = x0; ang = 0;
      if (cx % CELL < RD + 30 || cx % CELL > CELL - 30) continue;
    } else {
      cx = Math.floor(x0 / CELL) * CELL + RD / 2; cy = y0; ang = Math.PI / 2;
      if (cy % CELL < RD + 30 || cy % CELL > CELL - 30) continue;
    }
    if (cars.some(o => !o.dead && hyp(o.x - cx, o.y - cy) < 120)) continue;

    const g = { x: cx, y: cy, cars: [] };
    for (const off of [-40, 0, 40]) {
      const c = mkCar(horiz ? cx : cx + off, horiz ? cy + off : cy, ang, { ai: false, model: 'sedan', col: '#f1f5f9' });
      c.pol = true; c.bar = true;
      cars.push(c); g.cars.push(c);
    }
    barGroups.push(g);
    return;
  }
}

function updBarriers(dt) {
  if (st !== 'play') return;
  barGroups = barGroups.filter(g => g.cars.some(c => cars.includes(c)));
  barGroups = barGroups.filter(g => {
    if (hyp(g.x - P.x, g.y - P.y) > BARRIER_REMOVE_DIST) {
      for (const c of g.cars) c.dead = 1;
      return false;
    }
    return true;
  });
  barCD -= dt;
  if (wanted >= BARRIER_MIN_WANTED && barGroups.length < BARRIER_MAX && barCD <= 0) {
    barCD = BARRIER_COOLDOWN;
    spawnBarrier();
  }
}