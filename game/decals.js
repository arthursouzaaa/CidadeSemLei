// ===== SUJEIRA VISUAL: decalques gerados uma vez ao carregar =====
const DECALS = [];
const ZEBRA = 'rgba(241,245,249,.7)';
(function makeDecals() {
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const ix = i * CELL, jy = j * CELL;
    if (R() < .7) for (let k = 0; k < 4; k++) {
      DECALS.push({ t: 'rect', x: ix + RD + 8 + k * 13, y: jy + 10, w: 7, h: RD - 20, col: ZEBRA });
      DECALS.push({ t: 'rect', x: ix - 20 - k * 13, y: jy + 10, w: 7, h: RD - 20, col: ZEBRA });
      DECALS.push({ t: 'rect', x: ix + 10, y: jy + RD + 8 + k * 13, w: RD - 20, h: 7, col: ZEBRA });
      DECALS.push({ t: 'rect', x: ix + 10, y: jy - 20 - k * 13, w: RD - 20, h: 7, col: ZEBRA });
    }
    if (R() < .5) DECALS.push({ t: 'manhole', x: ix + RD + rnd(70, CELL - RD - 70), y: jy + RD / 2 });
    if (R() < .35) DECALS.push({ t: 'puddle', x: ix + rnd(RD + 40, CELL - 40), y: jy + RD / 2 + rnd(-20, 20), rx: rnd(14, 26), ry: rnd(7, 12) });
    if (R() < .3) {
      const y = jy + (R() < .5 ? 34 : 86), x = ix + RD + rnd(20, 60);
      DECALS.push({ t: 'skid', x1: x, y1: y, x2: x + rnd(60, 110), y2: y });
    }
    if (R() < .6) DECALS.push({ t: 'trash', x: ix + RD + rnd(6, 14), y: jy + RD + rnd(40, CELL - RD - 40) });
    if (R() < .4) DECALS.push({ t: 'box', x: ix + RD + rnd(4, 14), y: jy + RD + rnd(60, CELL - RD - 60) });
    if (R() < .35) DECALS.push({ t: 'cone', x: ix + rnd(25, RD - 25), y: jy + RD + rnd(20, 60) });
  }
})();

function drawDecals(x0, y0, x1, y1) {
  for (const d of DECALS) {
    const px = d.x ?? d.x1, py = d.y ?? d.y1;
    if (px < x0 - 60 || px > x1 + 60 || py < y0 - 60 || py > y1 + 60) continue;
    switch (d.t) {
      case 'rect':
        ctx.fillStyle = d.col; ctx.fillRect(d.x, d.y, d.w, d.h); break;
      case 'manhole':
        ctx.fillStyle = '#1f2328'; ctx.beginPath(); ctx.arc(d.x, d.y, 9, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(d.x, d.y, 6, 0, TAU); ctx.stroke();
        break;
      case 'puddle':
        ctx.fillStyle = 'rgba(96,165,250,.3)';
        ctx.beginPath(); ctx.ellipse(d.x, d.y, d.rx, d.ry, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.2)';
        ctx.beginPath(); ctx.ellipse(d.x - d.rx * .3, d.y - d.ry * .3, d.rx * .4, d.ry * .25, 0, 0, TAU); ctx.fill();
        break;
      case 'skid':
        ctx.strokeStyle = 'rgba(15,15,20,.45)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke();
        break;
      case 'trash':
        ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.ellipse(d.x, d.y, 6, 5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#374151'; ctx.beginPath(); ctx.arc(d.x + 2, d.y - 1, 2, 0, TAU); ctx.fill();
        break;
      case 'box':
        ctx.fillStyle = '#a16207'; ctx.fillRect(d.x, d.y, 14, 10);
        ctx.fillStyle = '#fde68a'; ctx.fillRect(d.x + 6, d.y, 2, 10);
        break;
      case 'cone':
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.moveTo(d.x, d.y - 7); ctx.lineTo(d.x - 5, d.y + 5); ctx.lineTo(d.x + 5, d.y + 5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(d.x - 3, d.y, 6, 2);
        break;
    }
  }
}