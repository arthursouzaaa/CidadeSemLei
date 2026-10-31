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

function bankNear() { return !P.veh && hyp(P.x - BANK_DOOR.x, P.y - BANK_DOOR.y) < 70; }

function newAccountNumber() {
  return String(1000 + Math.floor(R() * 9000));
}

// Juros salvos: lastInterestDay vai no save para não recontar ao reabrir o jogo
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

function bankOpenMenu() { bankScreen = bank.acc ? 'menu' : 'conta'; bankInput = ''; bankNewPin = null; bankMsg = ''; st = 'bank'; }

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
    } else {
      if (bank.balance < v) { bankMsg = 'Saldo insuficiente.'; return; }
      bank.balance -= v; money += v; bankMsg = 'Sacado $' + v + '.';
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
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(2,6,23,.92)'; ctx.fillRect(0, 0, W, H);
  label('BANCO', W / 2, H / 2 - 170, 44, '#93c5fd', 'center');
  if (bank.acc) label('Agência ' + bank.acc + '  •  Saldo: $' + bank.balance.toLocaleString('pt-BR') + '  •  Carteira: $' + money.toLocaleString('pt-BR'), W / 2, H / 2 - 130, 16, '#e2e8f0', 'center');
  const masked = '*'.repeat(bankInput.length);
  if (bankScreen === 'conta') {
    label('Criar conta: digite uma senha de 4 dígitos', W / 2, H / 2 - 60, 20, '#facc15', 'center');
    label(masked.padEnd(4, '_').split('').join(' '), W / 2, H / 2, 40, '#fde047', 'center');
  } else if (bankScreen === 'senha2') {
    label('Confirme a senha', W / 2, H / 2 - 60, 20, '#facc15', 'center');
    label(masked.padEnd(4, '_').split('').join(' '), W / 2, H / 2, 40, '#fde047', 'center');
  } else if (bankScreen === 'menu') {
    ['[1] Depositar', '[2] Sacar', '[3] Extrato', '[4] Pagar multas (dívida: $' + debt + ')'].forEach((t, i) =>
      label(t, W / 2, H / 2 - 50 + i * 44, 22, '#fff', 'center'));
  } else if (bankScreen === 'depositar' || bankScreen === 'sacar') {
    label(bankScreen === 'depositar' ? 'Depositar' : 'Sacar', W / 2, H / 2 - 60, 20, '#facc15', 'center');
    label(bankInput || '0', W / 2, H / 2, 40, '#fde047', 'center');
  } else if (bankScreen === 'extrato') {
    label('Extrato', W / 2, H / 2 - 60, 22, '#93c5fd', 'center');
    label('Saldo no banco: $' + bank.balance, W / 2, H / 2, 20, '#fff', 'center');
    label('Carteira: $' + money + '   •   Dívida: $' + debt, W / 2, H / 2 + 40, 18, '#cbd5e1', 'center');
  } else if (bankScreen === 'senha') {
    label('Digite a senha', W / 2, H / 2 - 60, 20, '#facc15', 'center');
    label(masked.padEnd(4, '_').split('').join(' '), W / 2, H / 2, 40, '#fde047', 'center');
  } else if (bankScreen === 'multas') {
    label('Pagar multas: $' + debt + ' (juros de 5% ao dia)', W / 2, H / 2 - 60, 20, '#fca5a5', 'center');
    ['[1] Pagar $100', '[2] Pagar $500', '[3] Pagar tudo'].forEach((t, i) => label(t, W / 2, H / 2 + i * 40, 20, '#fff', 'center'));
  }
  if (bankMsg) label(bankMsg, W / 2, H / 2 + 150, 18, '#fde68a', 'center');
  label('Enter confirmar  •  Backspace apagar  •  Esc sair', W / 2, H - 40, 14, '#94a3b8', 'center');
}

const _poisBank = mapPois;
mapPois = function () {
  const L = _poisBank();
  L.push({ key: 'banco', name: 'Banco', icon: '🏦', col: '#93c5fd', x: BANK_DOOR.x, y: BANK_DOOR.y });
  return L;
};