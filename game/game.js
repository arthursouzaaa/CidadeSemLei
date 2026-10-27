let last = performance.now();

function loop(t) {
  const dt = Math.min(.033, (t - last) / 1000 || .016);
  last = t;

  if (st === 'play') { update(dt); updCam(dt); }
  else if (st === 'dead') {
    deadT += dt;
    for (const p of PT) { p.l -= dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    PT = PT.filter(p => p.l > 0);
    if (deadT > 3.5) {
      P.hp = 100; P.x = SX; P.y = SY; P.iv = 2; wanted = 0; heatT = 0;
      money = Math.max(0, money - 500);
      saveGame();
      peds = peds.filter(p => !p.cop);
      for (const c of cars) c.cop = false;
      bullets = [];
      st = 'play';
      toast('Você foi para o hospital. -$500');
    }
  } else if (st === 'menu') {
    camX += dt * 70; camY = SY; tm += dt;
    if (camX > WS - 600) camX = 600;
  }

  draw();
  requestAnimationFrame(loop);
}

init();
camX = 600; camY = SY;
requestAnimationFrame(loop);

addEventListener('beforeunload', () => saveGame());