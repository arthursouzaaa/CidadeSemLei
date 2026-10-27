// ===== NÉON E POSTES À NOITE =====
const NEON_RGB = ['244,114,182', '56,189,248', '74,222,128', '251,191,36', '192,132,252'];

function nightGlow(x, y, r, rgb, a) {
  const sx = (x - camX) * camZ + W / 2, sy = (y - camY) * camZ + H / 2;
  const rad = r * camZ;
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
  g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
  g.addColorStop(1, 'rgba(' + rgb + ',0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx - rad, sy - rad, rad * 2, rad * 2);
}

function drawNightGlow(dk, i0, i1, j0, j1) {
  if (dk < .03) return;
  const k = clamp(dk / .5, 0, 1);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';

  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    nightGlow(i * CELL + RD - 6, j * CELL + RD - 6, 120, '255,200,110', .35 * k);
    nightGlow(i * CELL + 6, j * CELL + 6, 120, '255,200,110', .35 * k);
  }

  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const b = blocks[j * N + i];
    b.bl.forEach((q, bi) => {
      if ((i + j + bi) % 2) return;
      const rgb = NEON_RGB[(i * 3 + j * 5 + bi) % NEON_RGB.length];
      const y = q.y + q.h + 3;
      nightGlow(q.x + q.w / 2, y, 90, rgb, .3 * k);
      const sx1 = (q.x + 8 - camX) * camZ + W / 2, sx2 = (q.x + q.w - 8 - camX) * camZ + W / 2;
      const sy = (y - camY) * camZ + H / 2;
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (.9 * k) + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx1, sy); ctx.lineTo(sx2, sy); ctx.stroke();
    });
  }
  ctx.restore();
}