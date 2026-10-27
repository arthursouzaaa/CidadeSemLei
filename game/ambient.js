// ===== SOM AMBIENTE (trânsito, buzinas, conversas, rotor) =====
// Os volumes são chutes: ajuste aqui se ficar alto ou baixo.
setInterval(() => {
  if (st !== 'play' || !A()) return;
  let near = 1e9;
  for (const c of cars) if (!c.dead && c.ai) near = Math.min(near, hyp(c.x - P.x, c.y - P.y));
  const traffic = clamp(1 - near / 900, 0, 1);
  noise(.4, .006 + traffic * .02, 400);
  if (R() < .08) snd(200 + R() * 220, .12, 'sine', .004 + traffic * .006);
  if (traffic > .3 && R() < .03) snd(330 + R() * 130, .3, 'square', .01 + traffic * .02);
  if (heli) {
    const d = hyp(heli.x - P.x, heli.y - P.y);
    noise(.3, clamp(1 - d / 1400, 0, 1) * .06, 260);
  }
}, 300);