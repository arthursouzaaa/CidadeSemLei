const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const lc = document.createElement('canvas');
const lx = lc.getContext('2d');
const ZOOM_BASE = 1.25;
let W, H;

function rs() {
  W = cv.width = innerWidth;
  H = cv.height = innerHeight;
  lc.width = W >> 2;
  lc.height = H >> 2;
}
addEventListener('resize', rs);
rs();

const R = Math.random, TAU = Math.PI * 2, hyp = Math.hypot;
const rnd = (a, b) => a + R() * (b - a);
const pick = a => a[(R() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angD = (a, b) => {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};

const ls = document.createElement('canvas');
ls.width = ls.height = 128;
{
  const g = ls.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
}

// ==========================================
// ==== SISTEMA DE UI PREMIUM (AAA) ====
// ==========================================

function mouseInRect(mx, my, x, y, w, h) {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

// Desenha o Card principal com Glassmorphism e Borda Neon
function drawPremiumPanel(x, y, w, h, accentColor = '#38bdf8') {
  ctx.save();
  
  // Sombra pesada atrás do painel
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  
  // Fundo do painel (Gradiente escuro translúcido)
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
  grad.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 20); ctx.fill();
  
  // Reseta a sombra para a borda
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  
  // Borda externa brilhante
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 20); ctx.stroke();
  
  // Linha de brilho no topo (Reflexo de vidro)
  const glare = ctx.createLinearGradient(x, y, x + w, y + 50);
  glare.addColorStop(0, 'rgba(255,255,255,0)');
  glare.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  glare.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glare;
  ctx.beginPath(); ctx.roundRect(x + 5, y + 2, w - 10, 3, 5); ctx.fill();
  
  ctx.restore();
}

// Desenha um botão interativo super estiloso
function drawPremiumButton(x, y, w, h, key, text, subtext, color, icon) {
  const hover = mouseInRect(mouse.x, mouse.y, x, y, w, h);
  
  ctx.save();
  
  // Efeito de hover (Fundo e brilho)
  if (hover) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
  }
  
  // Fundo do botão
  const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
  bgGrad.addColorStop(0, hover ? 'rgba(30, 41, 59, 1)' : 'rgba(15, 23, 42, 0.8)');
  bgGrad.addColorStop(1, hover ? 'rgba(15, 23, 42, 1)' : 'rgba(2, 6, 23, 0.8)');
  ctx.fillStyle = bgGrad;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
  
  ctx.shadowBlur = 0; // Reseta brilho

  // Borda do botão
  ctx.strokeStyle = hover ? color : 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.stroke();

  // Marcador lateral (barra colorida)
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x, y, 6, h, [12, 0, 0, 12]); ctx.fill();

  // Texto Principal
  ctx.textAlign = 'left';
  ctx.fillStyle = hover ? '#fff' : '#cbd5e1';
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.fillText((icon ? icon + '  ' : '') + text, x + 25, y + h / 2 + 6);

  // Tecla de Atalho
  ctx.textAlign = 'right';
  ctx.fillStyle = color;
  ctx.font = 'bold 14px "Consolas", monospace'; // Fonte mais tech
  ctx.fillText(key, x + w - 20, y + h / 2 + 6);

  // Subtexto
  if (subtext) {
    ctx.textAlign = 'right';
    ctx.fillStyle = hover ? color : '#64748b';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText(subtext, x + w - 60, y + h / 2 + 6);
  }
  ctx.restore();
}