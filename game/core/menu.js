// ===== MENU PRINCIPAL: Continuar, Novo jogo, Opções =====
const OPTS_KEY = 'cidadeSemLei_opts';
const OPTS_DEFAULT = { volume: 80, sens: 100, zoom: 100 };
let opts = loadOpts();
let menuSel = 0;
let menuScreen = 'main';   // 'main' | 'options' | 'confirm'
let menuConfirmSel = 1;    // 0 = Sim, 1 = Não

function loadOpts() {
  try {
    const raw = localStorage.getItem(OPTS_KEY);
    const d = raw ? JSON.parse(raw) : {};
    return {
      volume: clamp(Number(d.volume ?? OPTS_DEFAULT.volume), 0, 100),
      sens: clamp(Number(d.sens ?? OPTS_DEFAULT.sens), 50, 200),
      zoom: clamp(Number(d.zoom ?? OPTS_DEFAULT.zoom), 70, 130)
    };
  } catch (e) { return { ...OPTS_DEFAULT }; }
}
function saveOpts() {
  try { localStorage.setItem(OPTS_KEY, JSON.stringify(opts)); } catch (e) {}
}
function applyOpts() {
  setMasterVol(opts.volume / 100);
  ZOOM_BASE = 1.25 * (opts.zoom / 100);
}
applyOpts();

function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}

function menuButtons() {
  return [
    { id: 'continue', text: 'CONTINUAR', sub: hasSave() ? 'Retomar a cidade' : 'Sem partida salva', enabled: hasSave(), color: '#4ade80', icon: '▶' },
    { id: 'new', text: 'NOVO JOGO', sub: 'Começar do zero', enabled: true, color: '#fb923c', icon: '✚' },
    { id: 'options', text: 'OPÇÕES', sub: 'Som, mouse e câmera', enabled: true, color: '#38bdf8', icon: '⚙' }
  ];
}

function menuAction(id) {
  if (id === 'continue') { if (hasSave()) start(); }
  else if (id === 'new') { menuScreen = 'confirm'; menuConfirmSel = 1; }
  else if (id === 'options') { menuScreen = 'options'; }
}

function confirmNew(sim) {
  if (sim) { resetSave(); stats = defaultStats(); start(); }
  else menuScreen = 'main';
}

// Teclado do menu (só quando st === 'menu')
addEventListener('keydown', e => {
  if (st !== 'menu') return;
  const c = e.code;
  if (menuScreen === 'main') {
    const btns = menuButtons();
    if (c === 'ArrowDown' || c === 'KeyS') menuSel = (menuSel + 1) % btns.length;
    else if (c === 'ArrowUp' || c === 'KeyW') menuSel = (menuSel + btns.length - 1) % btns.length;
    else if (c === 'Enter' || c === 'NumpadEnter' || c === 'Space') {
      const b = btns[menuSel]; if (b.enabled) menuAction(b.id);
    }
  } else if (menuScreen === 'confirm') {
    if (c === 'ArrowLeft' || c === 'ArrowRight') menuConfirmSel = 1 - menuConfirmSel;
    else if (c === 'Enter' || c === 'NumpadEnter') confirmNew(menuConfirmSel === 0);
    else if (c === 'Escape') menuScreen = 'main';
  } else if (menuScreen === 'options') {
    if (c === 'Escape' || c === 'Backspace') { saveOpts(); menuScreen = 'main'; }
  }
  e.stopImmediatePropagation();
}, true);

function menuLayout() {
  const bw = 640, bh = 600;
  return { bw, bh, bx: W / 2 - bw / 2, by: H / 2 - bh / 2 };
}

function optionsRows() {
  return [
    { key: 'volume', label: 'Volume', icon: '🔊', min: 0, max: 100, step: 5, unit: '%' },
    { key: 'sens', label: 'Sensibilidade do mouse', icon: '🖱', min: 50, max: 200, step: 10, unit: '%' },
    { key: 'zoom', label: 'Zoom padrão', icon: '🔍', min: 70, max: 130, step: 5, unit: '%' }
  ];
}
function adjustOpt(r, dir) {
  opts[r.key] = clamp(opts[r.key] + dir * r.step, r.min, r.max);
  applyOpts(); saveOpts();
}

// Áreas clicáveis da tela de opções (mesmas coordenadas do desenho)
function optionsRowY(by, i) { return by + 160 + i * 96; }
function optionsHit(x, y) {
  const { bx, by, bw } = menuLayout();
  const left = bx + bw - 300, right = bx + bw - 60;
  optionsRows().forEach((r, i) => {
    const ry = optionsRowY(by, i);
    if (mouseInRect(x, y, left - 10, ry + 26, 40, 40)) adjustOpt(r, -1);
    if (mouseInRect(x, y, right - 10, ry + 26, 40, 40)) adjustOpt(r, 1);
  });
  if (mouseInRect(x, y, bx + 60, by + 470, 200, 46)) {
    opts = { ...OPTS_DEFAULT }; saveOpts(); applyOpts();
  }
  if (mouseInRect(x, y, bx + bw - 260, by + 470, 200, 46)) { saveOpts(); menuScreen = 'main'; }
}

function menuHandleClick() {
  if (!mouse.clicked) return;
  const { bx, by, bw } = menuLayout();
  const x = mouse.x, y = mouse.y;
  if (menuScreen === 'main') {
    menuButtons().forEach((b, i) => {
      const yy = by + 180 + i * 92;
      if (mouseInRect(x, y, bx + 50, yy, bw - 100, 76) && b.enabled) { menuSel = i; menuAction(b.id); }
    });
  } else if (menuScreen === 'confirm') {
    const yb = by + 330;
    if (mouseInRect(x, y, bx + 90, yb, 210, 56)) confirmNew(true);
    else if (mouseInRect(x, y, bx + bw - 300, yb, 210, 56)) confirmNew(false);
  } else if (menuScreen === 'options') {
    optionsHit(x, y);
  }
  mouse.clicked = false;
}

// ----- DESENHO -----
function drawMenuBackdrop(bx, by, bw, bh) {
  // Fundo escuro com brilho radial no centro
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, 'rgba(6, 8, 28, 0.94)'); bg.addColorStop(1, 'rgba(0, 0, 6, 0.97)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, by + 90, 10, W / 2, by + 90, 420);
  glow.addColorStop(0, 'rgba(251,146,60,0.22)'); glow.addColorStop(1, 'rgba(251,146,60,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  // Faixas diagonais sutis
  ctx.save(); ctx.globalAlpha = 0.04; ctx.strokeStyle = '#fff'; ctx.lineWidth = 40;
  for (let x = -H; x < W + H; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke(); }
  ctx.restore();
}

function drawMenuScreen() {
  menuHandleClick();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const { bx, by, bw, bh } = menuLayout();
  const cx = W / 2;
  drawMenuBackdrop(bx, by, bw, bh);

  if (menuScreen === 'main') {
    drawPremiumPanel(bx, by, bw, bh, '#fb923c');

    // Título com contorno e sombra colorida
    ctx.textAlign = 'center';
    ctx.font = 'bold 50px "Segoe UI", sans-serif';
    ctx.shadowColor = 'rgba(251,113,133,0.8)'; ctx.shadowBlur = 24;
    const g = ctx.createLinearGradient(0, by + 50, 0, by + 110);
    g.addColorStop(0, '#fde68a'); g.addColorStop(0.5, '#fb923c'); g.addColorStop(1, '#e11d48');
    ctx.fillStyle = g; ctx.fillText('CIDADE SEM LEI', cx, by + 100);
    ctx.shadowBlur = 0;
    // Linha de destaque
    const line = ctx.createLinearGradient(cx - 180, 0, cx + 180, 0);
    line.addColorStop(0, 'rgba(251,146,60,0)'); line.addColorStop(0.5, '#fb923c'); line.addColorStop(1, 'rgba(251,146,60,0)');
    ctx.fillStyle = line; ctx.fillRect(cx - 180, by + 124, 360, 2);

    ctx.font = '13px "Consolas", monospace'; ctx.fillStyle = '#94a3b8';
    ctx.fillText('W/S ou setas: escolher   •   Enter ou clique: confirmar', cx, by + 150);

    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
    menuButtons().forEach((b, i) => {
      const y = by + 180 + i * 92, h = 76, x = bx + 50, w = bw - 100;
      const sel = i === menuSel, on = b.enabled;
      const col = on ? b.color : '#475569';
      ctx.save();
      if (sel && on) { ctx.shadowColor = col; ctx.shadowBlur = 18 + pulse * 8; }
      ctx.fillStyle = sel && on ? 'rgba(30,41,59,1)' : 'rgba(15,23,42,0.85)';
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = sel && on ? col : 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.stroke();
      ctx.restore();

      // Círculo com ícone
      ctx.beginPath(); ctx.arc(x + 46, y + h / 2, 24, 0, TAU);
      ctx.fillStyle = on ? col : '#334155'; ctx.globalAlpha = on ? 0.2 : 0.4; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      ctx.textAlign = 'center'; ctx.font = 'bold 20px "Segoe UI Symbol", "Segoe UI", sans-serif';
      ctx.fillStyle = on ? col : '#64748b'; ctx.fillText(b.icon, x + 46, y + h / 2 + 7);

      ctx.textAlign = 'left';
      ctx.fillStyle = on ? '#fff' : '#64748b';
      ctx.font = 'bold 22px "Segoe UI", sans-serif'; ctx.fillText(b.text, x + 86, y + 34);
      ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillStyle = '#94a3b8';
      ctx.fillText(b.sub, x + 86, y + 56);

      if (sel) { ctx.fillStyle = col; ctx.textAlign = 'right'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('›', x + w - 24, y + h / 2 + 7); }
    });

    ctx.textAlign = 'center'; ctx.font = '12px "Consolas", monospace'; ctx.fillStyle = '#475569';
    ctx.fillText('v0.5  •  Cidade Sem Lei', cx, by + bh - 22);
  }

  else if (menuScreen === 'confirm') {
    drawPremiumPanel(bx + 60, by + 130, bw - 120, 300, '#f87171');
    // Ícone de alerta
    ctx.beginPath(); ctx.arc(cx, by + 190, 30, 0, TAU);
    ctx.fillStyle = 'rgba(248,113,113,0.18)'; ctx.fill();
    ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2; ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#f87171'; ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.fillText('!', cx, by + 200);

    ctx.fillStyle = '#f87171'; ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.shadowColor = '#f87171'; ctx.shadowBlur = 12;
    ctx.fillText('NOVO JOGO?', cx, by + 250);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e2e8f0'; ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('Todo o progresso atual será apagado:', cx, by + 284);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('dinheiro, casas, garagem, banco e estatísticas.', cx, by + 306);

    drawConfirmBtn(bx + 90, by + 330, 210, 56, 'SIM, APAGAR', '#f87171', menuConfirmSel === 0);
    drawConfirmBtn(bx + bw - 300, by + 330, 210, 56, 'CANCELAR', '#4ade80', menuConfirmSel === 1);

    ctx.textAlign = 'center'; ctx.font = '12px "Consolas", monospace'; ctx.fillStyle = '#475569';
    ctx.fillText('Setas: escolher   •   Enter: confirmar   •   Esc: voltar', cx, by + bh - 22);
  }

  else if (menuScreen === 'options') {
    drawPremiumPanel(bx, by, bw, bh, '#38bdf8');
    ctx.textAlign = 'center'; ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 14;
    ctx.fillText('OPÇÕES', cx, by + 74);
    ctx.shadowBlur = 0;
    ctx.font = '13px "Consolas", monospace'; ctx.fillStyle = '#94a3b8';
    ctx.fillText('Clique nas setas para ajustar   •   Esc: voltar', cx, by + 104);

    const left = bx + bw - 300, barW = 180;
    optionsRows().forEach((r, i) => {
      const ry = optionsRowY(by, i);
      ctx.fillStyle = 'rgba(15,23,42,0.9)';
      ctx.beginPath(); ctx.roundRect(bx + 40, ry, bw - 80, 80, 16); ctx.fill();
      ctx.strokeStyle = 'rgba(56,189,248,0.15)'; ctx.lineWidth = 1; ctx.stroke();

      ctx.textAlign = 'left'; ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(r.label, bx + 64, ry + 46);

      const val = opts[r.key], pct = (val - r.min) / (r.max - r.min);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(left + 40, ry + 30, barW, 14, 7); ctx.fill();
      const g = ctx.createLinearGradient(left + 40, 0, left + 40 + barW, 0);
      g.addColorStop(0, '#38bdf8'); g.addColorStop(1, '#a78bfa');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(left + 40, ry + 30, Math.max(14, barW * pct), 14, 7); ctx.fill();

      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px "Consolas", monospace';
      ctx.fillText(val + r.unit, left + 40 + barW / 2, ry + 66);

      ctx.font = 'bold 26px "Segoe UI", sans-serif'; ctx.fillStyle = '#38bdf8';
      ctx.fillText('‹', left - 10 + 20, ry + 54);
      ctx.fillText('›', left + 40 + barW + 40 - 10 + 10, ry + 54);
    });

    drawConfirmBtn(bx + 60, by + 470, 200, 46, 'PADRÃO', '#facc15', false);
    drawConfirmBtn(bx + bw - 260, by + 470, 200, 46, 'VOLTAR', '#94a3b8', false);
  }
}

function drawConfirmBtn(x, y, w, h, text, col, sel) {
  ctx.save();
  if (sel) { ctx.shadowColor = col; ctx.shadowBlur = 14; }
  ctx.fillStyle = sel ? 'rgba(30,41,59,1)' : 'rgba(15,23,42,0.9)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.stroke();
  ctx.restore();
  ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.font = 'bold 16px "Consolas", monospace';
  ctx.fillText(text, x + w / 2, y + h / 2 + 6);
}