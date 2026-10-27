// ===== HELICÓPTERO DA POLÍCIA =====
// Aparece com 4+ estrelas, orbita o jogador e atira de cima (ignora prédios).
let heli = null, heliRespawn = 0;

function heliHit(d) {
  if (!heli) return;
  heli.hp -= d; heli.flash = .08;
  burst(heli.x, heli.y, '#e5e7eb', 4, 120, .3, 3);
  if (heli.hp <= 0) {
    const hx = heli.x, hy = heli.y;
    heli = null;
    explode(hx, hy, 'a');
    cash.push({ x: hx, y: hy, v: 150 });
    heliRespawn = 25;
    toast('Helicóptero abatido! +$150 no chão.');
  }
}

function updHeli(dt) {
  if (st !== 'play') return;
  if (heliRespawn > 0) heliRespawn -= dt;
  if (wanted < 4) { heli = null; return; }
  if (!heli) {
    if (heliRespawn > 0) return;
    const a = rnd(0, TAU);
    heli = { x: P.x + Math.cos(a) * 500, y: P.y + Math.sin(a) * 500, ang: a, cd: 1, hp: 150, flash: 0 };
    toast('Helicóptero da polícia na área!');
    snd(120, 1.2, 'sawtooth', .04);
    return;
  }
  const h = heli;
  h.ang += dt * .7;
  const tx = P.x + Math.cos(h.ang) * 280, ty = P.y + Math.sin(h.ang) * 280;
  const dx = tx - h.x, dy = ty - h.y, d = hyp(dx, dy) || 1;
  const sp = clamp(d * 2, 0, 260);
  h.x += dx / d * sp * dt; h.y += dy / d * sp * dt;
  h.flash -= dt; h.cd -= dt;
  const dist = hyp(P.x - h.x, P.y - h.y);
  if (dist < 620 && h.cd <= 0) {
    h.cd = .5;
    const a = Math.atan2(P.y - h.y, P.x - h.x) + rnd(-.1, .1);
    bullets.push({ x: h.x, y: h.y, vx: Math.cos(a) * 650, vy: Math.sin(a) * 650, l: 1.1, d: 6, o: 'c', air: true });
  }
}

function drawHeli() {
  if (!heli) return;
  const h = heli;
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(h.x + 16, h.y + 22, 20, 14, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.ang + Math.PI / 2);
  ctx.fillStyle = '#334155'; ctx.fillRect(-4, 14, 8, 30);
  ctx.fillStyle = '#1e293b'; ctx.fillRect(-2, 38, 4, 12);
  ctx.fillStyle = h.flash > 0 ? '#fff' : '#f1f5f9';
  ctx.beginPath(); ctx.ellipse(0, 0, 14, 22, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1d4ed8'; ctx.fillRect(-14, -2, 28, 5);
  ctx.fillStyle = 'rgba(56,189,248,.6)'; ctx.beginPath(); ctx.ellipse(0, -10, 9, 7, 0, 0, TAU); ctx.fill();
  const spin = tm * 30;
  ctx.strokeStyle = 'rgba(15,23,42,.8)'; ctx.lineWidth = 3;
  ctx.beginPath();
  for (const a of [spin, spin + Math.PI / 2]) {
    ctx.moveTo(-Math.cos(a) * 46, -Math.sin(a) * 46);
    ctx.lineTo(Math.cos(a) * 46, Math.sin(a) * 46);
  }
  ctx.stroke();
  ctx.restore();
}