// ===== MENU DE DEBUG (só para testes) =====
// Coloque DEBUG = false para desligar tudo.
const DEBUG = true;
let debugOpen = false;

const DEBUG_OPTIONS = [
  { key: '1', label: 'Missão: entrega',       run: () => startDelivery() },
  { key: '2', label: 'Missão: eliminar alvo', run: () => startHit() },
  { key: '3', label: 'Missão: roubar carro',  run: () => startSteal() },
  { key: '4', label: 'Missão: corrida',       run: () => startRace() },
  { key: '5', label: 'Missão: fuga',          run: () => startEscape() }
];

addEventListener('keydown', e => {
  if (!DEBUG) return;
  if (e.code === 'Tab') {
    e.preventDefault();
    if (st === 'play' || st === 'pause' || debugOpen) {
      debugOpen = !debugOpen;
      if (debugOpen) st = st === 'play' ? 'debug' : st;
      else if (st === 'debug') st = 'play';
    }
    return;
  }
  if (!debugOpen) return;
  if (e.code === 'Escape') { debugOpen = false; if (st === 'debug') st = 'play'; return; }
  const opt = DEBUG_OPTIONS.find(o => 'Digit' + o.key === e.code);
  if (opt) {
    mission = null;
    opt.run();
    toast('[DEBUG] ' + opt.label);
    debugOpen = false;
    if (st === 'debug') st = 'play';
  }
});

function drawDebugMenu() {
  if (!DEBUG || !debugOpen) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,10,.75)'; ctx.fillRect(0, 0, W, H);
  const bw = 420, bh = 80 + DEBUG_OPTIONS.length * 40, bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
  ctx.fillStyle = 'rgba(20,20,50,.95)'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
  label('DEBUG', W / 2, by + 36, 24, '#facc15', 'center');
  DEBUG_OPTIONS.forEach((o, i) => {
    label('[' + o.key + '] ' + o.label, W / 2, by + 80 + i * 40, 18, '#e2e8f0', 'center');
  });
  label('Tab ou Esc para fechar', W / 2, by + bh - 14, 14, '#94a3b8', 'center');
}