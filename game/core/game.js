// Fase 0.5a: limite do menu por eixo (WSW). Mesmo comportamento.
let last = performance.now();

function loop(t) {
  const dt = Math.min(.033, (t - last) / 1000 || .016);
  last = t;

  if (st === 'play') { update(dt); updCam(dt); }
  else if (st === 'casino') { casinoUpdate(dt); }
  else if (st === 'dead') {
    deadT += dt;
    for (const p of PT) { p.l -= dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    PT = PT.filter(p => p.l > 0);
    if (deadT > 3.5) {
      const rp = respawnPoint();
      P.hp = 100; P.x = rp.x; P.y = rp.y; P.iv = 2; wanted = 0; heatT = 0;
      camX = rp.x; camY = rp.y;
      applyDeathFine(500);
      saveGame();
      peds = peds.filter(p => !p.cop);
      for (const c of cars) c.cop = false;
      bullets = [];
      st = 'play';
      toast('Você foi para o hospital.');
    }
  } else if (st === 'menu') {
    camX += dt * 70; camY = SY; tm += dt;
    if (camX > WSW - 600) camX = 600;
  }

  draw();
  mouse.clicked = false;
  requestAnimationFrame(loop);
}

const _startBase = start;
start = function () {
  _startBase();
  restoreClock();
  P.col = look.shirt;
};

init();
restoreClock();
P.col = look.shirt;
camX = 600; camY = SY;
requestAnimationFrame(loop);

addEventListener('beforeunload', () => saveGame());