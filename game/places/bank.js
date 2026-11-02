// ===== BANCO: conta, depósito, saque, extrato e multas =====
const BANK_CELL = { i: 8, j: 8 };
const BANK_RECT = {
  x: BANK_CELL.i * CELL + RD + 20, y: BANK_CELL.j * CELL + RD + 20,
  w: CELL - RD - 40, h: CELL - RD - 40
};
const BANK_DOOR = { x: BANK_RECT.x + BANK_RECT.w / 2, y: BANK_RECT.y + BANK_RECT.h + 4 };
blocks[BANK_CELL.j * N + BANK_CELL.i] = {
  x: BANK_CELL.i * CELL + RD, y: BANK_CELL.j * CELL + RD, s: CELL - RD, park: false, tr: [],
  bl: [{ x: BANK_RECT.x, y: BANK_RECT.y, w: BANK_RECT.w, h: BANK_RECT.h, z: 220, col: '#1e3a8a' }]
};

const DEBT_DAILY = 0.05;
let bankScreen = 'menu';
let bankInput = '';
let bankNewPin = null;
let bankMsg = '';
let bankAnimTimer = 0;

// NOVO: Histórico de transações
let bankHistory = [];

function bankNear() { return !P.veh && hyp(P.x - BANK_DOOR.x, P.y - BANK_DOOR.y) < 70; }
function newAccountNumber() { return String(1000 + Math.floor(R() * 9000)); }

function addHistory(type, amount) {
  const now = new Date();
  const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  bankHistory.unshift({ type, amount, time });
  if (bankHistory.length > 5) bankHistory.pop(); // Mantém apenas as 5 últimas
}

let lastInterestDay = 0;
function applyInterest() {
  const day = Math.floor(tm / 240);
  if (day <= lastInterestDay) return;
  if (debt > 0) {
    const days = day - lastInterestDay;
    debt = Math.round(debt * Math.pow(1 + DEBT_DAILY, days));
    toast('Juros da multa pendente: dívida agora $' + debt);
  }
  lastInterestDay = day;
  saveGame();
}

function bankOpenMenu() { 
  bankScreen = bank.acc ? 'menu' : 'conta'; 
  bankInput = ''; bankNewPin = null; bankMsg = ''; 
  bankAnimTimer = 0;
  st = 'bank'; 
}

function bankSubmit() {
  if (bankScreen === 'conta') {
    if (bankInput.length !== 4) { bankMsg = 'Digite 4 dígitos para a senha.'; return; }
    bankNewPin = bankInput; bankInput = ''; bankScreen = 'senha2'; bankMsg = 'Confirme a senha.';
    return;
  }
  if (bankScreen === 'senha2') {
    if (bankInput !== bankNewPin) { bankMsg = 'As senhas não batem. Recomece.'; bankInput = ''; bankScreen = 'conta'; bankNewPin = null; return; }
    bank.acc = newAccountNumber(); bank.pin = bankNewPin; saveGame();
    bankScreen = 'menu'; bankInput = ''; bankMsg = 'Conta criada! Agência ' + bank.acc + '.';
    return;
  }
  if (bankScreen === 'senha') {
    if (bankInput === bank.pin) { bankScreen = 'menu'; bankMsg = ''; }
    else bankMsg = 'Senha incorreta.';
    bankInput = '';
    return;
  }
  if (bankScreen === 'depositar' || bankScreen === 'sacar') {
    const v = Number(bankInput);
    bankInput = '';
    if (!v || v <= 0) { bankMsg = 'Valor inválido.'; return; }
    if (bankScreen === 'depositar') {
      if (money < v) { bankMsg = 'Você não tem esse valor na carteira.'; return; }
      money -= v; bank.balance += v; bankMsg = 'Depositado $' + v + '.';
      addHistory('Depósito', v); // Registra no histórico
    } else {
      if (bank.balance < v) { bankMsg = 'Saldo insuficiente.'; return; }
      bank.balance -= v; money += v; bankMsg = 'Sacado $' + v + '.';
      addHistory('Saque', -v); // Registra no histórico
    }
    saveGame(); bankScreen = 'menu';
  }
}

function bankPayDebt(v) {
  const pay = Math.min(v, debt, money + bank.balance);
  if (pay <= 0) { bankMsg = 'Nada a pagar.'; return; }
  const fromWallet = Math.min(money, pay); money -= fromWallet;
  bank.balance -= (pay - fromWallet);
  debt -= pay; saveGame();
  bankMsg = 'Pago $' + pay + '. Dívida: $' + debt;
  addHistory('Multa', -pay); // Registra no histórico
}

addEventListener('keydown', e => {
  if (st === 'play' && e.code === 'KeyE' && bankNear() && !garageAnim) { bankOpenMenu(); e.stopImmediatePropagation(); return; }
  if (st !== 'bank') return;
  e.stopImmediatePropagation();
  if (e.code === 'Escape') { st = 'play'; bankInput = ''; return; }
  if (bankScreen === 'menu') {
    if (e.code === 'Digit1') { bankScreen = 'depositar'; bankInput = ''; bankMsg = 'Quanto depositar? (digite e Enter)'; }
    if (e.code === 'Digit2') { bankScreen = 'sacar'; bankInput = ''; bankMsg = 'Quanto sacar? (digite e Enter)'; }
    if (e.code === 'Digit3') { bankScreen = 'extrato'; }
    if (e.code === 'Digit4') { bankScreen = 'multas'; bankMsg = ''; }
    return;
  }
  if (bankScreen === 'extrato' || bankScreen === 'multas') {
    if (bankScreen === 'multas') {
      if (e.code === 'Digit1') bankPayDebt(100);
      if (e.code === 'Digit2') bankPayDebt(500);
      if (e.code === 'Digit3') bankPayDebt(debt);
    }
    if (e.code === 'Backspace' || e.code === 'Escape') { bankScreen = 'menu'; bankMsg = ''; }
    return;
  }
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { bankSubmit(); return; }
  if (e.code === 'Backspace') { bankInput = bankInput.slice(0, -1); return; }
  const m = e.code.match(/^(Digit|Numpad)(\d)$/);
  if (m && bankInput.length < (bankScreen === 'depositar' || bankScreen === 'sacar' ? 7 : 4)) bankInput += m[2];
});

function drawBankBuilding() {
  const b = BANK_RECT;
  ctx.fillStyle = '#93c5fd'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('BANCO', b.x + b.w / 2, b.y + b.h / 2 + 6);
  const dw = 56, dh = 12, dx = BANK_DOOR.x - dw / 2, dy = b.y + b.h - 2;
  ctx.fillStyle = '#0f172a'; ctx.fillRect(dx, dy, dw, dh + 6);
  ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 2; ctx.strokeRect(dx, dy, dw, dh + 6);
}

function drawBankHint() {
  if (st === 'play' && bankNear()) label('[E] Entrar no banco', W / 2, H - 180, 18, '#93c5fd', 'center');
}

function drawBankOverlay() {
  if (bankAnimTimer < 1) bankAnimTimer += 0.1;
  const animScale = 0.95 + (0.05 * bankAnimTimer);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0, 0, 5, 0.75)'; ctx.fillRect(0, 0, W, H);

  const bw = 680, bh = 520;
  const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;

  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.scale(animScale, animScale);
  ctx.translate(-W/2, -H/2);

  drawPremiumPanel(bx, by, bw, bh, '#38bdf8');

  ctx.textAlign = 'center';
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 32px "Segoe UI", sans-serif';
  ctx.fillText('BANCO CENTRAL', W / 2, by + 55);
  ctx.font = '14px "Consolas", monospace';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.fillText('SISTEMA FINANCEIRO SEGURO', W / 2, by + 80);

  const cx = W / 2;
  let startY = by + 120;

  if (bank.acc) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.roundRect(bx + 40, startY - 30, bw - 80, 70, 12); ctx.fill();
    
    ctx.textAlign = 'left';
    ctx.font = '14px "Consolas", monospace'; ctx.fillStyle = '#94a3b8';
    ctx.fillText('AGÊNCIA: ' + bank.acc, bx + 60, startY - 5);
    ctx.fillText('CONTA: ' + bank.pin, bx + 60, startY + 15);

    ctx.textAlign = 'right';
    ctx.font = 'bold 28px "Consolas", monospace'; 
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 10;
    ctx.fillText('$' + bank.balance.toLocaleString('pt-BR'), bx + bw - 60, startY + 10);
    ctx.shadowBlur = 0;

    startY += 70;
  } else { startY = by + 120; }

  const masked = '*'.repeat(bankInput.length);

  if (bankScreen === 'conta' || bankScreen === 'senha2' || bankScreen === 'senha') {
    ctx.textAlign = 'center'; ctx.fillStyle = '#facc15'; ctx.font = 'bold 20px "Segoe UI", sans-serif';
    const msg = bankScreen === 'conta' ? 'CRIE SUA SENHA DE 4 DÍGITOS' : bankScreen === 'senha2' ? 'CONFIRME A SENHA' : 'ACESSO RESTRITO';
    ctx.fillText(msg, cx, startY + 20);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; 
    ctx.beginPath(); ctx.roundRect(cx - 120, startY + 50, 240, 80, 12); ctx.fill();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 48px "Consolas", monospace';
    ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 15;
    ctx.fillText(masked.padEnd(4, '_').split('').join(' '), cx, startY + 108);
    ctx.shadowBlur = 0;

  } else if (bankScreen === 'menu') {
    const options = [
      { icon: '💸', text: 'DEPOSITAR', key: '[1]', color: '#4ade80', action: () => { bankScreen = 'depositar'; bankInput = ''; } },
      { icon: '💵', text: 'SACAR', key: '[2]', color: '#facc15', action: () => { bankScreen = 'sacar'; bankInput = ''; } },
      { icon: '📄', text: 'EXTRATO', key: '[3]', color: '#cbd5e1', action: () => { bankScreen = 'extrato'; } },
      { icon: '⚖️', text: 'PAGAR MULTAS', key: '[4]', color: '#f87171', sub: debt > 0 ? 'DÍVIDA: $' + debt : 'SEM DÍVIDAS', action: () => { bankScreen = 'multas'; bankMsg = ''; } }
    ];
    options.forEach((opt, i) => {
      const oy = startY + i * 70;
      drawPremiumButton(bx + 50, oy, bw - 100, 56, opt.key, opt.text, opt.sub, opt.color, opt.icon);
      if (mouse.clicked && mouseInRect(mouse.x, mouse.y, bx + 50, oy, bw - 100, 56)) {
        opt.action(); mouse.clicked = false;
      }
    });

  } else if (bankScreen === 'depositar' || bankScreen === 'sacar') {
    ctx.textAlign = 'center'; ctx.fillStyle = '#facc15'; ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText(bankScreen === 'depositar' ? 'VALOR DO DEPÓSITO' : 'VALOR DO SAQUE', cx, startY);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; 
    ctx.beginPath(); ctx.roundRect(cx - 200, startY + 40, 400, 100, 12); ctx.fill();
    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#4ade80'; ctx.font = 'bold 50px "Consolas", monospace';
    ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 15;
    ctx.fillText('$ ' + (bankInput || '0'), cx, startY + 110);
    ctx.shadowBlur = 0;
    if (bankMsg) {
      ctx.font = '16px "Segoe UI", sans-serif'; ctx.fillStyle = '#94a3b8';
      ctx.fillText(bankMsg, cx, startY + 170);
    }

  } else if (bankScreen === 'extrato') {
    ctx.textAlign = 'center'; ctx.fillStyle = '#cbd5e1'; ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText('EXTRATO BANCÁRIO', cx, startY);
    
    // NOVO: Lista de Transações
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.roundRect(bx + 60, startY + 30, bw - 120, 200, 12); ctx.fill();
    
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px "Consolas", monospace'; ctx.fillStyle = '#94a3b8';
    ctx.fillText('HISTÓRICO RECENTE', bx + 80, startY + 60);

    if (bankHistory.length === 0) {
      ctx.font = 'italic 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#64748b';
      ctx.fillText('Nenhuma transação recente.', bx + 80, startY + 100);
    } else {
      bankHistory.forEach((t, i) => {
        const oy = startY + 90 + i * 28;
        ctx.font = '14px "Consolas", monospace'; ctx.fillStyle = '#64748b';
        ctx.fillText(`[${t.time}]`, bx + 80, oy);
        
        ctx.fillStyle = t.amount > 0 ? '#4ade80' : '#f87171';
        ctx.fillText(t.type, bx + 150, oy);

        ctx.textAlign = 'right';
        ctx.fillStyle = t.amount > 0 ? '#4ade80' : '#f87171';
        ctx.fillText((t.amount > 0 ? '+$' : '-$') + Math.abs(t.amount), bx + bw - 80, oy);
        ctx.textAlign = 'left';
      });
    }

  } else if (bankScreen === 'multas') {
    ctx.textAlign = 'center'; ctx.fillStyle = '#fca5a5'; ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText('PAGAR MULTAS', cx, startY);
    ctx.font = '16px "Segoe UI", sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('DÍVIDA ATUAL: $' + debt, cx, startY + 30);
    
    const opts = [
      { text: 'PAGAR $100', key: '[1]', val: 100 },
      { text: 'PAGAR $500', key: '[2]', val: 500 },
      { text: 'PAGAR TUDO', key: '[3]', val: debt }
    ];
    opts.forEach((opt, i) => {
      const oy = startY + 60 + i * 55;
      drawPremiumButton(cx - 160, oy, 320, 42, opt.key, opt.text, '', '#f87171', '');
      if (mouse.clicked && mouseInRect(mouse.x, mouse.y, cx - 160, oy, 320, 42)) {
        bankPayDebt(opt.val); mouse.clicked = false;
      }
    });
  }

  ctx.restore();

  if (bankMsg && bankScreen !== 'depositar' && bankScreen !== 'sacar') {
    ctx.textAlign = 'center';
    ctx.fillStyle = bankMsg.includes('Sucesso') || bankMsg.includes('criada') || bankMsg.includes('Pago') ? '#4ade80' : '#f87171';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText(bankMsg, cx, by + bh - 60);
  }

  ctx.textAlign = 'center'; ctx.fillStyle = '#475569'; ctx.font = '14px "Consolas", monospace';
  ctx.fillText('ESC: SAIR', cx, by + bh - 25);
}

addEventListener('mousedown', e => {
  if (st === 'bank' && e.button === 0) {
    const bw = 680, bh = 520;
    const bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
    if (!mouseInRect(e.clientX, e.clientY, bx, by, bw, bh)) {
      st = 'play'; bankInput = '';
    }
  }
});

const _poisBank = mapPois;
mapPois = function () {
  const L = _poisBank();
  L.push({ key: 'banco', name: 'Banco', icon: '🏦', col: '#93c5fd', x: BANK_DOOR.x, y: BANK_DOOR.y });
  return L;
};