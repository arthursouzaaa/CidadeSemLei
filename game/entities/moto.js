// ===== MOTOS =====
MODELS.moto = { n: 'Moto', max: 600, acc: 420, grip: 3.2, turn: 3.4, armor: 1.8, L: 28, W: 12, aiK: 1.1 };

pickModel = function () {
  const r = R();
  return r < .1 ? 'caminhao' : r < .2 ? 'esportivo' : r < .35 ? 'moto' : 'sedan';
};

const _playerCarBase = playerCar;
playerCar = function (c, dt) {
  if (c.model !== 'moto') return _playerCarBase(c, dt);
  _playerCarBase(c, dt);
  c.wheelie = !!keys.ShiftLeft && c.sp > 200;
  if (c.wheelie && !c._stunt) { c._stunt = true; toast('Empinando!'); }
  if (!c.wheelie) c._stunt = false;
  if (c.wheelie) c.grip = Math.min(c.grip, 2.2);
  if (c._psp !== undefined && c._psp - c.sp > 200 && P.veh === c) {
    P.veh = null; c.drv = null; c.ai = true;
    P.x = c.x + Math.sin(c.a) * 24; P.y = c.y - Math.cos(c.a) * 24;
    pushOut(P, 8);
    hurtP(30, .5);
    toast('Você caiu da moto!');
    engine(null);
  }
  c._psp = c.sp;
};

const _updDeliveryBase = updDelivery;
updDelivery = function (dt) {
  if (order && order.type === 'burger' && P.veh && P.veh.model === 'moto')
    return failOrder('A comida caiu da moto! Use carro ou caminhão.');
  return _updDeliveryBase(dt);
};

function drawMoto(c) {
  const hl = c.L / 2, hw = c.Wd / 2;
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(2, 3, hl, hw + 1, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.ellipse(-hl + 5, 0, 5, 3, 0, 0, TAU); ctx.fill();
  const fy = c.wheelie ? -6 : 0;
  ctx.beginPath(); ctx.ellipse(hl - 5, fy, 5, 3, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = c.col; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-hl + 6, 0); ctx.lineTo(hl - 6, fy * .5); ctx.stroke();
  ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.ellipse(-2, 0, 5, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(1, 0, 3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fde68a'; ctx.fillRect(hl - 2, -2, 3, 4);
  ctx.restore();
}